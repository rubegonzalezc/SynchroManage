import { NextResponse } from 'next/server'
import { getApiUser } from '@/lib/auth/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getBranchName } from '@/lib/utils/branch-name'
import { revalidateProjectTaskCaches } from '@/lib/utils/revalidate-project-task-cache'
import { syncTaskDependencies } from '@/lib/utils/task-dependency'
import {
  buildSprintPlanTemplate,
  fillMissingSprintOrders,
  prepareSprintPlan,
  type ImportPerson,
  type ResolvedPlanTask,
  type ResolvedSprintPlan,
} from '@/lib/utils/sprint-plan-import'

interface PersonRow extends ImportPerson {
  role: string | null
}

interface ExistingTask {
  id: string
  title: string
  sprint_order: number | null
}

function normalizeLabel(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()
}

async function loadContext(projectId: string) {
  const admin = createAdminClient()
  const [{ data: project, error: projectError }, { data: profiles, error: profilesError }] = await Promise.all([
    admin.from('projects').select('id, name').eq('id', projectId).maybeSingle(),
    admin.from('profiles').select('id, full_name, email, role:roles(name)').order('full_name'),
  ])

  if (projectError) throw new Error(projectError.message)
  if (profilesError) throw new Error(profilesError.message)

  const people: PersonRow[] = (profiles || []).map((profile) => {
    const role = profile.role as { name?: string } | { name?: string }[] | null
    const roleName = Array.isArray(role) ? role[0]?.name : role?.name
    return {
      id: profile.id,
      full_name: profile.full_name || profile.email || 'Sin nombre',
      email: profile.email,
      role: roleName ?? null,
    }
  })

  return { admin, project, people }
}

async function requireImporter() {
  const user = await getApiUser()
  if (!user) {
    return { error: NextResponse.json({ error: 'No autorizado' }, { status: 401 }) }
  }

  const admin = createAdminClient()
  const { data: profile } = await admin
    .from('profiles')
    .select('role:roles(name)')
    .eq('id', user.id)
    .single()

  const role = profile?.role as { name?: string } | { name?: string }[] | null
  const roleName = Array.isArray(role) ? role[0]?.name : role?.name
  if (!roleName || !['admin', 'pm'].includes(roleName)) {
    return { error: NextResponse.json({ error: 'Solo un admin o PM puede importar un sprint' }, { status: 403 }) }
  }

  return { user }
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const authResult = await requireImporter()
    if ('error' in authResult && authResult.error) return authResult.error

    const { project, people } = await loadContext(id)
    if (!project) return NextResponse.json({ error: 'Proyecto no encontrado' }, { status: 404 })

    return NextResponse.json({
      project: { id: project.id, name: project.name },
      people: people.map(({ full_name, email, role }) => ({ full_name, email, role })),
      template: buildSprintPlanTemplate(project.name, people),
    })
  } catch (error) {
    console.error('Error loading sprint import context:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const authResult = await requireImporter()
    if ('error' in authResult && authResult.error) return authResult.error
    const user = authResult.user
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const { admin, project, people } = await loadContext(id)
    if (!project) return NextResponse.json({ error: 'Proyecto no encontrado' }, { status: 404 })

    const body = await request.json()
    const dryRun = body?.dry_run !== false
    const rawPlan = body?.plan ?? (body?.sprint ? body : null)
    const prepared = prepareSprintPlan(rawPlan, people)

    const publicPeople = people.map(({ full_name, email, role }) => ({ full_name, email, role }))

    if (!prepared.plan) {
      return NextResponse.json({
        dry_run: dryRun,
        errors: prepared.errors,
        warnings: [],
        people: publicPeople,
      }, { status: 400 })
    }

    const preview = await buildPreview(admin, project, prepared.plan)
    if (preview.errors.length > 0) {
      return NextResponse.json({
        dry_run: dryRun,
        errors: preview.errors,
        warnings: preview.warnings,
        people: publicPeople,
        preview: preview.payload,
      }, { status: 400 })
    }

    if (dryRun) {
      return NextResponse.json({
        dry_run: true,
        errors: [],
        warnings: preview.warnings,
        people: publicPeople,
        preview: preview.payload,
      })
    }

    const applied = await applyPlan(admin, project.id, user.id, prepared.plan, preview.tasks, preview.existingSprintId, preview.matches)
    revalidateProjectTaskCaches(project.id, {
      assigneeIds: prepared.plan.tasks.flatMap((task) => task.assigneeIds),
    })

    return NextResponse.json({
      dry_run: false,
      errors: [],
      warnings: preview.warnings,
      people: publicPeople,
      preview: preview.payload,
      applied,
    }, { status: 201 })
  } catch (error) {
    console.error('Error importing sprint plan:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}

interface TaskMatch {
  planIndex: number
  action: 'create' | 'skip'
  existingId: string | null
}

async function buildPreview(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  admin: any,
  project: { id: string; name: string },
  plan: ResolvedSprintPlan
) {
  const errors: { path: string; message: string }[] = []
  const warnings: string[] = []

  if (plan.projectName && normalizeLabel(plan.projectName) !== normalizeLabel(project.name)) {
    warnings.push(`El JSON dice «${plan.projectName}» y este proyecto es «${project.name}». Se importará en «${project.name}».`)
  }

  const { data: sprints, error: sprintError } = await admin
    .from('sprints')
    .select('id, name, goal, start_date, end_date, status')
    .eq('project_id', project.id)

  if (sprintError) throw new Error(sprintError.message)

  const existingSprint = (sprints || []).find(
    (sprint: { name: string }) => normalizeLabel(sprint.name) === normalizeLabel(plan.sprint.name)
  )

  let existingTasks: ExistingTask[] = []
  if (existingSprint) {
    warnings.push('El sprint ya existe. Se reutiliza y no se cambian sus fechas ni su objetivo.')
    const { data, error } = await admin
      .from('tasks')
      .select('id, title, sprint_order')
      .eq('sprint_id', existingSprint.id)
    if (error) throw new Error(error.message)
    existingTasks = data || []
  }

  const matches: TaskMatch[] = []
  const usedExistingIds = new Set<string>()

  plan.tasks.forEach((task, planIndex) => {
    const sameTitle = existingTasks.filter((existing) => normalizeLabel(existing.title) === normalizeLabel(task.title))
    if (sameTitle.length > 1) {
      errors.push({
        path: `tasks[${planIndex}].title`,
        message: `Hay más de una tarea llamada «${task.title}» en el sprint. No se puede reimportar con seguridad.`,
      })
      matches.push({ planIndex, action: 'create', existingId: null })
      return
    }
    if (sameTitle.length === 1) {
      usedExistingIds.add(sameTitle[0].id)
      matches.push({ planIndex, action: 'skip', existingId: sameTitle[0].id })
      return
    }
    matches.push({ planIndex, action: 'create', existingId: null })
  })

  const occupiedOrders = existingTasks
    .filter((task) => !usedExistingIds.has(task.id) && task.sprint_order != null)
    .map((task) => task.sprint_order as number)

  plan.tasks.forEach((task, planIndex) => {
    if (matches[planIndex]?.action !== 'create' || task.sprintOrder == null) return
    if (occupiedOrders.includes(task.sprintOrder)) {
      errors.push({
        path: `tasks[${planIndex}].sprint_order`,
        message: `El orden HU-${task.sprintOrder} ya lo usa otra tarea del sprint`,
      })
    }
  })

  const reservedOrders = [
    ...occupiedOrders,
    ...existingTasks
      .filter((task) => usedExistingIds.has(task.id) && task.sprint_order != null)
      .map((task) => task.sprint_order as number),
  ]
  const filledCreates = fillMissingSprintOrders(
    plan.tasks.filter((_, planIndex) => matches[planIndex]?.action === 'create'),
    reservedOrders
  )
  let createCursor = 0
  const tasks = plan.tasks.map((task, planIndex) => {
    if (matches[planIndex]?.action !== 'create') {
      const existing = existingTasks.find((item) => item.id === matches[planIndex]?.existingId)
      return { ...task, sprintOrder: existing?.sprint_order ?? null }
    }
    const filled = filledCreates[createCursor]
    createCursor += 1
    return filled
  })

  return {
    errors,
    warnings,
    existingSprintId: existingSprint?.id ?? null,
    matches,
    tasks,
    payload: {
      sprint: {
        name: plan.sprint.name,
        goal: plan.sprint.goal,
        start_date: plan.sprint.startDate,
        end_date: plan.sprint.endDate,
        status: existingSprint?.status ?? plan.sprint.status,
        action: existingSprint ? 'reuse' as const : 'create' as const,
      },
      tasks: tasks.map((task, index) => ({
        key: task.key,
        title: task.title,
        description: task.description,
        action: matches[index]?.action ?? 'create',
        assignees: task.assigneeNames,
        reviewer: task.reviewerName,
        sprint_order: task.sprintOrder,
        depends_on: task.dependsOnKeys,
        category: task.category,
        priority: task.priority,
        status: task.status,
        complexity: task.complexity,
      })),
      summary: {
        to_create: matches.filter((match) => match.action === 'create').length,
        to_skip: matches.filter((match) => match.action === 'skip').length,
      },
    },
  }
}

async function applyPlan(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  admin: any,
  projectId: string,
  userId: string,
  plan: ResolvedSprintPlan,
  tasks: ResolvedPlanTask[],
  existingSprintId: string | null,
  matches: TaskMatch[]
) {
  let sprintId = existingSprintId

  if (!sprintId) {
    const { data: lastSprint } = await admin
      .from('sprints')
      .select('order_index')
      .eq('project_id', projectId)
      .order('order_index', { ascending: false })
      .limit(1)
      .maybeSingle()

    const { data: sprint, error } = await admin
      .from('sprints')
      .insert({
        project_id: projectId,
        name: plan.sprint.name,
        goal: plan.sprint.goal,
        start_date: plan.sprint.startDate,
        end_date: plan.sprint.endDate,
        status: plan.sprint.status,
        order_index: (lastSprint?.order_index ?? -1) + 1,
        created_by: userId,
      })
      .select('id')
      .single()

    if (error || !sprint) throw new Error(error?.message || 'No se pudo crear el sprint')
    sprintId = sprint.id
  }

  const idsByKey = new Map<string, string>()
  let created = 0
  let skipped = 0

  for (let index = 0; index < tasks.length; index += 1) {
    const task = tasks[index]
    const match = matches[index]
    if (match?.action === 'skip' && match.existingId) {
      idsByKey.set(task.key, match.existingId)
      skipped += 1
      continue
    }

    const { data: maxPosData } = await admin
      .from('tasks')
      .select('position')
      .eq('project_id', projectId)
      .eq('status', task.status)
      .order('position', { ascending: false })
      .limit(1)
      .maybeSingle()

    const { data: inserted, error } = await admin
      .from('tasks')
      .insert({
        project_id: projectId,
        sprint_id: sprintId,
        title: task.title,
        description: task.description,
        status: task.status,
        priority: task.priority,
        category: task.category,
        assignee_id: task.assigneeIds[0] ?? null,
        reviewer_id: task.reviewerId,
        due_date: task.dueDate,
        position: (maxPosData?.position ?? -1) + 1,
        sprint_order: task.sprintOrder,
        complexity: task.complexity,
        branch_name: task.branchName,
        depends_on_task_id: null,
      })
      .select('id, task_number, title, category')
      .single()

    if (error || !inserted) throw new Error(error?.message || `No se pudo crear «${task.title}»`)

    if (task.autoBranch && inserted.task_number) {
      const branchName = getBranchName(inserted)
      await admin.from('tasks').update({ branch_name: branchName }).eq('id', inserted.id)
    }

    if (task.assigneeIds.length > 0) {
      const { error: assigneesError } = await admin
        .from('task_assignees')
        .upsert(
          task.assigneeIds.map((assigneeId) => ({ task_id: inserted.id, user_id: assigneeId })),
          { onConflict: 'task_id,user_id', ignoreDuplicates: true }
        )
      if (assigneesError) throw new Error(assigneesError.message)
    }

    idsByKey.set(task.key, inserted.id)
    created += 1
  }

  for (let index = 0; index < tasks.length; index += 1) {
    const task = tasks[index]
    const match = matches[index]
    if (match?.action === 'skip' || task.dependsOnKeys.length === 0) continue
    const taskId = idsByKey.get(task.key)
    if (!taskId) continue
    const dependencyIds = task.dependsOnKeys
      .map((key) => idsByKey.get(key))
      .filter((dependencyId): dependencyId is string => !!dependencyId)
    await syncTaskDependencies(admin, taskId, dependencyIds)
    await admin.from('tasks').update({ depends_on_task_id: dependencyIds[0] ?? null }).eq('id', taskId)
  }

  await admin.from('activity_log').insert({
    user_id: userId,
    action: 'imported',
    entity_type: 'sprint',
    entity_id: sprintId,
    entity_name: plan.sprint.name,
    details: { created_tasks: created, skipped_tasks: skipped, project_id: projectId },
  })

  return { sprint_id: sprintId, created, skipped }
}
