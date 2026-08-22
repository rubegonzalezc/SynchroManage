import { createClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { PERMISSIONS } from '@/lib/types/roles'
import { resolveVisibleProjectScope } from '@/lib/utils/project-visibility'
import { resolveSprintOrderForCreate } from '@/lib/utils/task-sprint-order'
import { revalidateProjectTaskCaches } from '@/lib/utils/revalidate-project-task-cache'
import { fetchTaskDependencyRefs } from '@/lib/utils/task-dependency'
import {
  buildDuplicateTaskInsertPayload,
  isAllowedDuplicateTaskStatus,
  resolveDuplicateTaskStatus,
} from '@/lib/utils/duplicate-task'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SupabaseAdmin = any

function getSupabaseAdmin(): SupabaseAdmin {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

async function logActivityServer(
  supabaseAdmin: SupabaseAdmin,
  userId: string,
  action: string,
  entityType: string,
  entityId: string,
  entityName: string,
  details: Record<string, unknown>
) {
  try {
    await supabaseAdmin.from('activity_log').insert({
      user_id: userId,
      action,
      entity_type: entityType,
      entity_id: entityId,
      entity_name: entityName,
      details,
    })
  } catch (error) {
    console.error('Error logging activity:', error)
  }
}

async function canAccessProject(
  supabaseAdmin: SupabaseAdmin,
  userId: string,
  roleName: string | undefined,
  projectId: string
): Promise<boolean> {
  const scope = await resolveVisibleProjectScope(supabaseAdmin, userId, roleName)
  if (scope.mode === 'all') return true
  return scope.projectIds.includes(projectId)
}

function canCreateTasks(roleName: string | undefined): boolean {
  if (!roleName) return false
  return (PERMISSIONS.CREATE_TASKS as readonly string[]).includes(roleName)
}

/** Duplica una tarea en el mismo proyecto (sin bugs, dependencias, comentarios ni adjuntos). */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: sourceTaskId } = await params
    const supabaseServer = await createServerClient()
    const {
      data: { user },
    } = await supabaseServer.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { data: profile } = await supabaseServer
      .from('profiles')
      .select('role:roles(name)')
      .eq('id', user.id)
      .single()

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const roleName = (profile?.role as any)?.name as string | undefined

    if (!canCreateTasks(roleName)) {
      return NextResponse.json({ error: 'Sin permisos para duplicar tareas' }, { status: 403 })
    }

    let body: { status?: string } = {}
    try {
      const raw = await request.text()
      if (raw.trim()) {
        body = JSON.parse(raw) as { status?: string }
      }
    } catch {
      return NextResponse.json({ error: 'JSON inválido' }, { status: 400 })
    }

    if (body.status != null && !isAllowedDuplicateTaskStatus(body.status)) {
      return NextResponse.json(
        { error: 'status debe ser backlog o todo' },
        { status: 400 }
      )
    }

    const initialStatus = resolveDuplicateTaskStatus(body.status)
    const supabaseAdmin = getSupabaseAdmin()

    const { data: sourceTask, error: sourceError } = await supabaseAdmin
      .from('tasks')
      .select('id, project_id, title, description, category, priority, sprint_id, assignee_id')
      .eq('id', sourceTaskId)
      .single()

    if (sourceError || !sourceTask) {
      return NextResponse.json({ error: 'Tarea no encontrada' }, { status: 404 })
    }

    const hasProjectAccess = await canAccessProject(
      supabaseAdmin,
      user.id,
      roleName,
      sourceTask.project_id
    )
    if (!hasProjectAccess) {
      return NextResponse.json({ error: 'Sin permisos para este proyecto' }, { status: 403 })
    }

    const { data: taskAssignees } = await supabaseAdmin
      .from('task_assignees')
      .select('user_id')
      .eq('task_id', sourceTaskId)

    const assigneeIds = [
      ...new Set(
        (taskAssignees?.length
          ? taskAssignees.map((row: { user_id: string }) => row.user_id)
          : sourceTask.assignee_id
            ? [sourceTask.assignee_id]
            : []) as string[]
      ),
    ]

    const { data: maxPosData } = await supabaseAdmin
      .from('tasks')
      .select('position')
      .eq('project_id', sourceTask.project_id)
      .eq('status', initialStatus)
      .order('position', { ascending: false })
      .limit(1)
      .single()

    const newPosition = (maxPosData?.position ?? -1) + 1

    const sprintOrder = await resolveSprintOrderForCreate(supabaseAdmin, {
      sprintId: sourceTask.sprint_id,
      hasSprintOrderField: false,
    })

    const insertPayload = buildDuplicateTaskInsertPayload({
      source: sourceTask,
      status: initialStatus,
      position: newPosition,
      sprintOrder,
      primaryAssigneeId: assigneeIds[0] ?? null,
    })

    const { data: task, error: insertError } = await supabaseAdmin
      .from('tasks')
      .insert(insertPayload)
      .select(`
        *,
        assignee:profiles!assignee_id(id, full_name, avatar_url)
      `)
      .single()

    if (insertError || !task) {
      return NextResponse.json({ error: insertError?.message || 'Error al duplicar tarea' }, { status: 400 })
    }

    if (assigneeIds.length > 0) {
      const assigneeRecords = assigneeIds.map((userId) => ({
        task_id: task.id,
        user_id: userId,
      }))

      const { error: assigneesError } = await supabaseAdmin
        .from('task_assignees')
        .upsert(assigneeRecords, { onConflict: 'task_id,user_id', ignoreDuplicates: true })

      if (assigneesError) {
        console.error('Error inserting task_assignees on duplicate:', assigneesError)
      }
    }

    await logActivityServer(
      supabaseAdmin,
      user.id,
      'created',
      'task',
      task.id,
      task.title,
      {
        project_id: sourceTask.project_id,
        duplicated_from: sourceTaskId,
      }
    )

    let assignees: { id: string; full_name: string; avatar_url: string | null }[] = []
    if (assigneeIds.length > 0) {
      const { data: assigneesData } = await supabaseAdmin
        .from('profiles')
        .select('id, full_name, avatar_url')
        .in('id', assigneeIds)

      assignees = assigneesData || []
    }

    revalidateProjectTaskCaches(sourceTask.project_id, { assigneeIds })

    const dependencies = await fetchTaskDependencyRefs(supabaseAdmin, task.id)

    return NextResponse.json({
      task: {
        ...task,
        assignees,
        depends_on_task_ids: dependencies.map((dep) => dep.id),
        dependencies,
        depends_on: dependencies[0] ?? null,
        duplicated_from: sourceTaskId,
      },
    })
  } catch (error) {
    console.error('Error duplicating task:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
