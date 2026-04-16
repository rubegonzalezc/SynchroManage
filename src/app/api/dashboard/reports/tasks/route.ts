import { createClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

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

export async function GET(req: NextRequest) {
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

    // Date range filters from query params
    const { searchParams } = new URL(req.url)
    const dateFrom = searchParams.get('dateFrom') // YYYY-MM-DD
    const dateTo = searchParams.get('dateTo')     // YYYY-MM-DD

    // Helper to apply date filters to a query builder
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    function applyDateFilter<T extends { gte: (col: string, val: string) => T; lte: (col: string, val: string) => T }>(query: T): T {
      if (dateFrom) query = query.gte('created_at', `${dateFrom}T00:00:00.000Z`)
      if (dateTo) query = query.lte('created_at', `${dateTo}T23:59:59.999Z`)
      return query
    }

    // Obtener todos los perfiles
    const { data: allProfiles } = await supabaseAdmin
      .from('profiles')
      .select('id, full_name, avatar_url, role:roles(name)')

    if (!allProfiles || allProfiles.length === 0) {
      return NextResponse.json({ stats: [] })
    }

    const userIds = allProfiles.map(p => p.id)

    // Fuente 1: task_assignees (asignaciones modernas)
    let taQuery = supabaseAdmin
      .from('task_assignees')
      .select('user_id, task:tasks(id, status, is_carry_over, created_at)')
      .in('user_id', userIds)

    if (dateFrom || dateTo) {
      // Filter via tasks join — we filter after fetching
    }

    const { data: taskAssignees } = await taQuery

    // Fuente 2: assignee_id legacy
    let legacyQuery = supabaseAdmin
      .from('tasks')
      .select('id, status, is_carry_over, assignee_id, created_at')
      .in('assignee_id', userIds)

    if (dateFrom) legacyQuery = legacyQuery.gte('created_at', `${dateFrom}T00:00:00.000Z`)
    if (dateTo) legacyQuery = legacyQuery.lte('created_at', `${dateTo}T23:59:59.999Z`)

    const { data: legacyTasks } = await legacyQuery

    // Filter task_assignees by date if needed
    const filteredTaskAssignees = (taskAssignees || []).filter(ta => {
      const task = ta.task as unknown as (TaskRow & { created_at?: string }) | null
      if (!task) return false
      if (dateFrom && task.created_at && task.created_at < `${dateFrom}T00:00:00.000Z`) return false
      if (dateTo && task.created_at && task.created_at > `${dateTo}T23:59:59.999Z`) return false
      return true
    })

    // Set de task_ids cubiertos por task_assignees
    const coveredTaskIds = new Set<string>()
    for (const ta of filteredTaskAssignees) {
      const task = ta.task as unknown as TaskRow | null
      if (task?.id) coveredTaskIds.add(task.id)
    }

    // Tareas sin asignar
    let unassignedQuery = supabaseAdmin
      .from('tasks')
      .select('id, task_number, title, status, priority, category, due_date, created_at, project:projects(id, name, type)')
      .is('assignee_id', null)

    if (dateFrom) unassignedQuery = unassignedQuery.gte('created_at', `${dateFrom}T00:00:00.000Z`)
    if (dateTo) unassignedQuery = unassignedQuery.lte('created_at', `${dateTo}T23:59:59.999Z`)

    const { data: unassignedTasks } = await unassignedQuery

    const { data: allTaskAssigneeIds } = await supabaseAdmin
      .from('task_assignees')
      .select('task_id')

    const taskIdsWithAssignees = new Set((allTaskAssigneeIds || []).map(t => t.task_id))
    const trulyUnassigned = (unassignedTasks || []).filter(t => !taskIdsWithAssignees.has(t.id))

    // Total de tareas únicas
    let totalQuery = supabaseAdmin.from('tasks').select('*', { count: 'exact', head: true })
    if (dateFrom) totalQuery = totalQuery.gte('created_at', `${dateFrom}T00:00:00.000Z`)
    if (dateTo) totalQuery = totalQuery.lte('created_at', `${dateTo}T23:59:59.999Z`)
    const { count: totalTasksCount } = await totalQuery

    // Totales globales por status
    const buildTaskCount = (status: string) => {
      let q = supabaseAdmin.from('tasks').select('*', { count: 'exact', head: true }).eq('status', status)
      if (dateFrom) q = q.gte('created_at', `${dateFrom}T00:00:00.000Z`)
      if (dateTo) q = q.lte('created_at', `${dateTo}T23:59:59.999Z`)
      return q
    }
    const buildCarryOverCount = () => {
      let q = supabaseAdmin.from('tasks').select('*', { count: 'exact', head: true }).eq('is_carry_over', true)
      if (dateFrom) q = q.gte('created_at', `${dateFrom}T00:00:00.000Z`)
      if (dateTo) q = q.lte('created_at', `${dateTo}T23:59:59.999Z`)
      return q
    }
    const buildBugCount = (status: string) => {
      let q = supabaseAdmin.from('bugs').select('*', { count: 'exact', head: true }).eq('status', status)
      if (dateFrom) q = q.gte('created_at', `${dateFrom}T00:00:00.000Z`)
      if (dateTo) q = q.lte('created_at', `${dateTo}T23:59:59.999Z`)
      return q
    }
    const buildOpenBugsList = () => {
      let q = supabaseAdmin
        .from('bugs')
        .select('id, title, severity, status, created_at, project:projects(id, name), task:tasks(id, task_number, title), assignee:profiles!bugs_assignee_id_fkey(id, full_name, avatar_url)')
        .in('status', ['open', 'in_progress'])
        .order('created_at', { ascending: false })
      if (dateFrom) q = q.gte('created_at', `${dateFrom}T00:00:00.000Z`)
      if (dateTo) q = q.lte('created_at', `${dateTo}T23:59:59.999Z`)
      return q
    }

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
      buildTaskCount('done'),
      buildTaskCount('in_progress'),
      buildTaskCount('review'),
      buildTaskCount('todo'),
      buildTaskCount('backlog'),
      buildCarryOverCount(),
      buildBugCount('open'),
      buildBugCount('in_progress'),
      buildBugCount('resolved'),
      buildBugCount('closed'),
      buildOpenBugsList(),
    ])

    // Suppress unused variable warning
    void applyDateFilter

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
    let bugsAssigneeQuery = supabaseAdmin
      .from('bugs')
      .select('assignee_id, status, created_at')
      .in('assignee_id', userIds)
    if (dateFrom) bugsAssigneeQuery = bugsAssigneeQuery.gte('created_at', `${dateFrom}T00:00:00.000Z`)
    if (dateTo) bugsAssigneeQuery = bugsAssigneeQuery.lte('created_at', `${dateTo}T23:59:59.999Z`)

    const { data: bugsByAssignee } = await bugsAssigneeQuery

    for (const bug of (bugsByAssignee || [])) {
      if (!bug.assignee_id || !statsMap[bug.assignee_id]) continue
      statsMap[bug.assignee_id].bugs_total++
      if (bug.status === 'open') statsMap[bug.assignee_id].bugs_open++
      else if (bug.status === 'in_progress') statsMap[bug.assignee_id].bugs_in_progress++
      else if (bug.status === 'resolved') statsMap[bug.assignee_id].bugs_resolved++
    }

    for (const ta of filteredTaskAssignees) {
      const task = ta.task as unknown as TaskRow | null
      if (!task) continue
      accumulate(statsMap, ta.user_id, task)
    }

    for (const task of (legacyTasks || [])) {
      if (!task.assignee_id || coveredTaskIds.has(task.id)) continue
      accumulate(statsMap, task.assignee_id, task as TaskRow)
    }

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
  else map[userId].pending++
  if (task.is_carry_over) map[userId].carry_over++
}
