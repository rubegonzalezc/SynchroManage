import { createClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

interface TaskRow {
  id: string
  status: string
  is_carry_over: boolean
}

function getRoleName(role: unknown): string {
  if (!role) return ''
  if (Array.isArray(role)) return (role[0] as { name: string })?.name || ''
  return (role as { name: string })?.name || ''
}

export async function GET() {
  try {
    const supabaseServer = await createServerClient()
    const { data: { user } } = await supabaseServer.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { data: currentProfile } = await supabaseServer
      .from('profiles')
      .select('role:roles(name)')
      .eq('id', user.id)
      .single()

    const roleName = getRoleName(currentProfile?.role)
    if (!['admin', 'pm'].includes(roleName)) {
      return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    // Obtener todos los perfiles
    const { data: allProfiles } = await supabaseAdmin
      .from('profiles')
      .select('id, full_name, avatar_url, role:roles(name)')

    if (!allProfiles || allProfiles.length === 0) {
      return NextResponse.json({ stats: [] })
    }

    const userIds = allProfiles.map(p => p.id)

    // Fuente 1: task_assignees (asignaciones modernas)
    const { data: taskAssignees } = await supabaseAdmin
      .from('task_assignees')
      .select('user_id, task:tasks(id, status, is_carry_over)')
      .in('user_id', userIds)

    // Fuente 2: assignee_id legacy
    const { data: legacyTasks } = await supabaseAdmin
      .from('tasks')
      .select('id, status, is_carry_over, assignee_id')
      .in('assignee_id', userIds)

    // Set de task_ids cubiertos por task_assignees
    const coveredTaskIds = new Set<string>()
    for (const ta of (taskAssignees || [])) {
      const task = ta.task as unknown as TaskRow | null
      if (task?.id) coveredTaskIds.add(task.id)
    }

    // Set de todos los task_ids asignados (task_assignees + legacy)
    const assignedTaskIds = new Set<string>(coveredTaskIds)
    for (const task of (legacyTasks || [])) {
      if (task.assignee_id) assignedTaskIds.add(task.id)
    }

    // Tareas sin asignar: ni en task_assignees ni con assignee_id
    const { data: unassignedTasks } = await supabaseAdmin
      .from('tasks')
      .select('id, task_number, title, status, priority, category, due_date, project:projects(id, name, type)')
      .is('assignee_id', null)

    // Filtrar las que tampoco están en task_assignees
    const { data: allTaskAssigneeIds } = await supabaseAdmin
      .from('task_assignees')
      .select('task_id')

    const taskIdsWithAssignees = new Set((allTaskAssigneeIds || []).map(t => t.task_id))

    const trulyUnassigned = (unassignedTasks || []).filter(t => !taskIdsWithAssignees.has(t.id))

    // Total de tareas únicas en la base de datos
    const { count: totalTasksCount } = await supabaseAdmin
      .from('tasks')
      .select('*', { count: 'exact', head: true })

    // Totales globales por status (conteo de tareas únicas, no por asignación)
    const [
      { count: globalDone },
      { count: globalInProgress },
      { count: globalReview },
      { count: globalTodo },
      { count: globalBacklog },
      { count: globalCarryOver },
      { count: bugsOpen },
      { count: bugsInProgress },
      { count: bugsResolved },
      { count: bugsClosed },
      { data: openBugsList },
    ] = await Promise.all([
      supabaseAdmin.from('tasks').select('*', { count: 'exact', head: true }).eq('status', 'done'),
      supabaseAdmin.from('tasks').select('*', { count: 'exact', head: true }).eq('status', 'in_progress'),
      supabaseAdmin.from('tasks').select('*', { count: 'exact', head: true }).eq('status', 'review'),
      supabaseAdmin.from('tasks').select('*', { count: 'exact', head: true }).eq('status', 'todo'),
      supabaseAdmin.from('tasks').select('*', { count: 'exact', head: true }).eq('status', 'backlog'),
      supabaseAdmin.from('tasks').select('*', { count: 'exact', head: true }).eq('is_carry_over', true),
      supabaseAdmin.from('bugs').select('*', { count: 'exact', head: true }).eq('status', 'open'),
      supabaseAdmin.from('bugs').select('*', { count: 'exact', head: true }).eq('status', 'in_progress'),
      supabaseAdmin.from('bugs').select('*', { count: 'exact', head: true }).eq('status', 'resolved'),
      supabaseAdmin.from('bugs').select('*', { count: 'exact', head: true }).eq('status', 'closed'),
      supabaseAdmin.from('bugs').select('id, title, severity, status, created_at, project:projects(id, name), task:tasks(id, task_number, title), assignee:profiles!bugs_assignee_id_fkey(id, full_name, avatar_url)').in('status', ['open', 'in_progress']).order('created_at', { ascending: false }),
    ])

    const globalTotals = {
      done: globalDone ?? 0,
      in_progress: globalInProgress ?? 0,
      review: globalReview ?? 0,
      pending: globalTodo ?? 0,
      backlog: globalBacklog ?? 0,
      carry_over: globalCarryOver ?? 0,
    }

    const bugTotals = {
      open: bugsOpen ?? 0,
      in_progress: bugsInProgress ?? 0,
      resolved: bugsResolved ?? 0,
      closed: bugsClosed ?? 0,
      total: (bugsOpen ?? 0) + (bugsInProgress ?? 0) + (bugsResolved ?? 0) + (bugsClosed ?? 0),
    }

    // Inicializar mapa
    const statsMap: Record<string, {
      done: number; pending: number; in_progress: number; review: number; backlog: number; carry_over: number; total: number;
      bugs_open: number; bugs_in_progress: number; bugs_resolved: number; bugs_total: number
    }> = {}
    for (const uid of userIds) {
      statsMap[uid] = { done: 0, pending: 0, in_progress: 0, review: 0, backlog: 0, carry_over: 0, total: 0, bugs_open: 0, bugs_in_progress: 0, bugs_resolved: 0, bugs_total: 0 }
    }

    // Bugs por asignado
    const { data: bugsByAssignee } = await supabaseAdmin
      .from('bugs')
      .select('assignee_id, status')
      .in('assignee_id', userIds)

    for (const bug of (bugsByAssignee || [])) {
      if (!bug.assignee_id || !statsMap[bug.assignee_id]) continue
      statsMap[bug.assignee_id].bugs_total++
      if (bug.status === 'open') statsMap[bug.assignee_id].bugs_open++
      else if (bug.status === 'in_progress') statsMap[bug.assignee_id].bugs_in_progress++
      else if (bug.status === 'resolved') statsMap[bug.assignee_id].bugs_resolved++
    }

    for (const ta of (taskAssignees || [])) {
      const task = ta.task as unknown as TaskRow | null
      if (!task) continue
      accumulate(statsMap, ta.user_id, task)
    }

    for (const task of (legacyTasks || [])) {
      if (!task.assignee_id || coveredTaskIds.has(task.id)) continue
      accumulate(statsMap, task.assignee_id, task as TaskRow)
    }

    // Incluir solo usuarios que tienen al menos 1 tarea o bug
    const stats = allProfiles
      .filter(p => statsMap[p.id]?.total > 0 || statsMap[p.id]?.bugs_total > 0)
      .map(p => ({
        user: {
          id: p.id,
          full_name: p.full_name,
          avatar_url: p.avatar_url,
          role: getRoleName(p.role),
        },
        ...statsMap[p.id],
      }))

    stats.sort((a, b) => b.done - a.done)

    return NextResponse.json({ stats, unassigned: trulyUnassigned, totalTasks: totalTasksCount ?? 0, globalTotals, bugTotals, openBugs: openBugsList || [] })
  } catch (error) {
    console.error('Error fetching task report:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}

function accumulate(
  map: Record<string, { done: number; pending: number; in_progress: number; review: number; backlog: number; carry_over: number; total: number; bugs_open: number; bugs_in_progress: number; bugs_resolved: number; bugs_total: number }>,
  userId: string,
  task: TaskRow
) {
  if (!map[userId]) return
  map[userId].total++
  if (task.status === 'done') map[userId].done++
  else if (task.status === 'in_progress') map[userId].in_progress++
  else if (task.status === 'review') map[userId].review++
  else if (task.status === 'backlog') map[userId].backlog++
  else map[userId].pending++ // todo
  if (task.is_carry_over) map[userId].carry_over++
}
