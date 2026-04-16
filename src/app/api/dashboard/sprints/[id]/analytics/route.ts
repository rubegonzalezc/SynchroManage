import { createClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

function supabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

// Generates an array of YYYY-MM-DD strings between two dates (inclusive)
function dateRange(start: string, end: string): string[] {
  const dates: string[] = []
  const cur = new Date(start + 'T00:00:00')
  const last = new Date(end + 'T00:00:00')
  while (cur <= last) {
    dates.push(cur.toISOString().slice(0, 10))
    cur.setDate(cur.getDate() + 1)
  }
  return dates
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabaseServer = await createServerClient()
    const { data: { user } } = await supabaseServer.auth.getUser()
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const admin = supabaseAdmin()

    // ── 1. Load sprint ────────────────────────────────────────────────────────
    const { data: sprint, error: sprintErr } = await admin
      .from('sprints')
      .select('id, name, goal, start_date, end_date, status, order_index, project_id')
      .eq('id', id)
      .single()

    if (sprintErr || !sprint) {
      return NextResponse.json({ error: 'Sprint no encontrado' }, { status: 404 })
    }

    // ── 2. Tasks in this sprint ───────────────────────────────────────────────
    const { data: tasks } = await admin
      .from('tasks')
      .select('id, title, status, is_carry_over, created_at, updated_at')
      .eq('sprint_id', id)

    const sprintTasks = tasks || []
    const totalTasks = sprintTasks.length
    const doneTasks = sprintTasks.filter(t => t.status === 'done').length
    const carryOver = sprintTasks.filter(t => t.is_carry_over).length

    // ── 3. Burndown chart ─────────────────────────────────────────────────────
    // Strategy: use activity_log status_changed events to reconstruct daily
    // "remaining tasks" (tasks not yet done at end of each day).
    //
    // For completed sprints we use the actual end_date.
    // For active sprints we use today as the last day.
    const today = new Date().toISOString().slice(0, 10)
    const chartEnd = sprint.status === 'completed' ? sprint.end_date : today
    const days = dateRange(sprint.start_date, chartEnd)

    // Fetch all status_changed events for tasks in this sprint
    const taskIds = sprintTasks.map(t => t.id)

    let completionEvents: { entity_id: string; created_at: string; details: { to: string } }[] = []
    if (taskIds.length > 0) {
      const { data: events } = await admin
        .from('activity_log')
        .select('entity_id, created_at, details')
        .eq('action', 'status_changed')
        .in('entity_id', taskIds)
        .order('created_at', { ascending: true })

      completionEvents = (events || []).filter(
        e => (e.details as { to?: string })?.to === 'done'
      ) as typeof completionEvents
    }

    // For each task, find the earliest date it was marked done
    const taskDoneDate: Record<string, string> = {}
    for (const ev of completionEvents) {
      const d = ev.created_at.slice(0, 10)
      if (!taskDoneDate[ev.entity_id] || d < taskDoneDate[ev.entity_id]) {
        taskDoneDate[ev.entity_id] = d
      }
    }

    // Tasks currently done but with no activity log entry → treat as done on last day
    for (const t of sprintTasks) {
      if (t.status === 'done' && !taskDoneDate[t.id]) {
        taskDoneDate[t.id] = chartEnd
      }
    }

    // Build burndown: remaining = total - cumulative done up to that day
    const burndown = days.map(day => {
      const doneByDay = Object.values(taskDoneDate).filter(d => d <= day).length
      const ideal = totalTasks > 0
        ? Math.max(0, Math.round(totalTasks - (totalTasks / (days.length - 1 || 1)) * days.indexOf(day)))
        : 0
      return {
        date: day,
        remaining: Math.max(0, totalTasks - doneByDay),
        ideal,
      }
    })

    // ── 4. Velocity — completed sprints in same project ───────────────────────
    const { data: allSprints } = await admin
      .from('sprints')
      .select('id, name, status, order_index, start_date, end_date')
      .eq('project_id', sprint.project_id)
      .order('order_index', { ascending: true })

    const completedSprintIds = (allSprints || [])
      .filter(s => s.status === 'completed')
      .map(s => s.id)

    let velocityData: { sprintId: string; name: string; completed: number; total: number; carryOver: number }[] = []

    if (completedSprintIds.length > 0) {
      const { data: allSprintTasks } = await admin
        .from('tasks')
        .select('id, status, sprint_id, is_carry_over')
        .in('sprint_id', completedSprintIds)

      const sprintMap = new Map((allSprints || []).map(s => [s.id, s]))

      velocityData = completedSprintIds.map(sid => {
        const sTasks = (allSprintTasks || []).filter(t => t.sprint_id === sid)
        return {
          sprintId: sid,
          name: sprintMap.get(sid)?.name ?? sid,
          completed: sTasks.filter(t => t.status === 'done').length,
          total: sTasks.length,
          carryOver: sTasks.filter(t => t.is_carry_over).length,
        }
      })
    }

    // Include current sprint in velocity if active/completed
    if (sprint.status !== 'planning') {
      const alreadyIn = velocityData.some(v => v.sprintId === id)
      if (!alreadyIn) {
        velocityData.push({
          sprintId: id,
          name: sprint.name,
          completed: doneTasks,
          total: totalTasks,
          carryOver: carryOver,
        })
      }
    }

    // ── 5. Summary stats ──────────────────────────────────────────────────────
    const inProgress = sprintTasks.filter(t => t.status === 'in_progress').length
    const review = sprintTasks.filter(t => t.status === 'review').length
    const todo = sprintTasks.filter(t => t.status === 'todo').length
    const backlog = sprintTasks.filter(t => t.status === 'backlog').length

    // Days elapsed / remaining
    const startDate = new Date(sprint.start_date + 'T00:00:00')
    const endDate = new Date(sprint.end_date + 'T00:00:00')
    const todayDate = new Date(today + 'T00:00:00')
    const totalDays = Math.max(1, Math.round((endDate.getTime() - startDate.getTime()) / 86400000) + 1)
    const elapsedDays = Math.min(totalDays, Math.max(0, Math.round((todayDate.getTime() - startDate.getTime()) / 86400000) + 1))
    const remainingDays = Math.max(0, totalDays - elapsedDays)

    return NextResponse.json({
      sprint: {
        id: sprint.id,
        name: sprint.name,
        goal: sprint.goal,
        start_date: sprint.start_date,
        end_date: sprint.end_date,
        status: sprint.status,
      },
      summary: {
        totalTasks,
        doneTasks,
        inProgress,
        review,
        todo,
        backlog,
        carryOver,
        totalDays,
        elapsedDays,
        remainingDays,
        completionRate: totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0,
      },
      burndown,
      velocity: velocityData,
    })
  } catch (err) {
    console.error('Error fetching sprint analytics:', err)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
