import { NextResponse } from 'next/server'
import { getApiUser } from '@/lib/auth/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { buildSprintPlanExport, type ImportPerson, type SprintPlanExportTask } from '@/lib/utils/sprint-plan-import'

function planFileName(name: string): string {
  const slug = name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
  return `${slug || 'sprint'}.json`
}

async function requirePlanner() {
  const user = await getApiUser()
  if (!user) return { error: NextResponse.json({ error: 'No autorizado' }, { status: 401 }) }

  const admin = createAdminClient()
  const { data: profile } = await admin
    .from('profiles')
    .select('role:roles(name)')
    .eq('id', user.id)
    .single()

  const role = profile?.role as { name?: string } | { name?: string }[] | null
  const roleName = Array.isArray(role) ? role[0]?.name : role?.name
  if (!roleName || !['admin', 'pm'].includes(roleName)) {
    return { error: NextResponse.json({ error: 'Solo un admin o PM puede descargar el plan' }, { status: 403 }) }
  }

  return { admin }
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string; sprintId: string }> }
) {
  try {
    const { id, sprintId } = await params
    const authResult = await requirePlanner()
    if ('error' in authResult && authResult.error) return authResult.error
    const admin = authResult.admin
    if (!admin) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const { data: project, error: projectError } = await admin
      .from('projects')
      .select('id, name')
      .eq('id', id)
      .maybeSingle()
    if (projectError) throw new Error(projectError.message)
    if (!project) return NextResponse.json({ error: 'Proyecto no encontrado' }, { status: 404 })

    const { data: sprint, error: sprintError } = await admin
      .from('sprints')
      .select('id, name, goal, start_date, end_date, status')
      .eq('id', sprintId)
      .eq('project_id', id)
      .maybeSingle()
    if (sprintError) throw new Error(sprintError.message)
    if (!sprint) return NextResponse.json({ error: 'Sprint no encontrado' }, { status: 404 })

    const { data: taskRows, error: tasksError } = await admin
      .from('tasks')
      .select('id, title, description, category, priority, status, complexity, sprint_order, task_number, plan_key, due_date, branch_name, reviewer_id, assignee_id')
      .eq('sprint_id', sprintId)
    if (tasksError) throw new Error(tasksError.message)

    const tasks = taskRows || []
    const taskIds = tasks.map((task) => task.id)

    const [{ data: assigneeRows, error: assigneesError }, { data: dependencyRows, error: dependenciesError }, { data: profileRows, error: profilesError }] = await Promise.all([
      taskIds.length === 0
        ? Promise.resolve({ data: [], error: null })
        : admin.from('task_assignees').select('task_id, user_id').in('task_id', taskIds),
      taskIds.length === 0
        ? Promise.resolve({ data: [], error: null })
        : admin.from('task_dependencies').select('task_id, depends_on_task_id').in('task_id', taskIds),
      admin.from('profiles').select('id, full_name, email'),
    ])
    if (assigneesError) throw new Error(assigneesError.message)
    if (dependenciesError) throw new Error(dependenciesError.message)
    if (profilesError) throw new Error(profilesError.message)

    const people: ImportPerson[] = (profileRows || []).map((profile) => ({
      id: profile.id,
      full_name: profile.full_name || profile.email || 'Sin nombre',
      email: profile.email,
    }))
    const sprintTaskIds = new Set(taskIds)

    const exportTasks: SprintPlanExportTask[] = tasks.map((task) => {
      const assigneeIds = (assigneeRows || [])
        .filter((row: { task_id: string }) => row.task_id === task.id)
        .map((row: { user_id: string }) => row.user_id)
      if (assigneeIds.length === 0 && task.assignee_id) assigneeIds.push(task.assignee_id)

      return {
        id: task.id,
        title: task.title,
        description: task.description,
        category: task.category,
        priority: task.priority,
        status: task.status,
        complexity: task.complexity,
        sprintOrder: task.sprint_order,
        taskNumber: task.task_number,
        planKey: task.plan_key,
        dueDate: task.due_date,
        branchName: task.branch_name,
        assigneeIds,
        reviewerId: task.reviewer_id,
        dependencyIds: (dependencyRows || [])
          .filter((row: { task_id: string; depends_on_task_id: string }) => row.task_id === task.id && sprintTaskIds.has(row.depends_on_task_id))
          .map((row: { depends_on_task_id: string }) => row.depends_on_task_id),
      }
    })

    const document = buildSprintPlanExport({
      projectName: project.name,
      sprint: {
        name: sprint.name,
        goal: sprint.goal,
        startDate: sprint.start_date,
        endDate: sprint.end_date,
        status: sprint.status,
      },
      tasks: exportTasks,
      people,
    })

    const filename = planFileName(sprint.name)
    return new NextResponse(JSON.stringify(document, null, 2), {
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    console.error('Error exporting sprint plan:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
