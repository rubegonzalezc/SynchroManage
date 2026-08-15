import { createClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { revalidateTag } from 'next/cache'
import { NextResponse } from 'next/server'

function supabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

// POST - Completar sprint: active → completed
// Tareas no-done → siguiente sprint (planning, menor order_index) con is_carry_over=true
// Si no hay siguiente sprint → sprint_id = null (backlog)
//
// Body opcional:
//   bugAction: 'resolve_and_close' | 'ignore' (default: 'ignore')
//     - 'resolve_and_close': marca como resolved los bugs open/in_progress del sprint,
//       y cierra los que ya estaban resolved
//     - 'ignore': no toca los bugs del sprint
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabaseServer = await createServerClient()
    const { data: { user } } = await supabaseServer.auth.getUser()
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const { data: profile } = await supabaseServer
      .from('profiles')
      .select('role:roles(name)')
      .eq('id', user.id)
      .single()

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const roleName = (profile?.role as any)?.name
    if (!['admin', 'pm'].includes(roleName)) {
      return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
    }

    // Leer body — puede estar vacío si se llama sin body
    let bugAction: 'resolve_and_close' | 'ignore' = 'ignore'
    try {
      const body = await request.json()
      if (body?.bugAction === 'resolve_and_close') bugAction = 'resolve_and_close'
    } catch {
      // body vacío, usar default
    }

    const admin = supabaseAdmin()

    const { data: sprint, error: fetchError } = await admin
      .from('sprints')
      .select('id, project_id, status, order_index')
      .eq('id', id)
      .single()

    if (fetchError || !sprint) {
      return NextResponse.json({ error: 'Sprint no encontrado' }, { status: 404 })
    }

    if (sprint.status !== 'active') {
      return NextResponse.json({ error: 'Solo se puede completar un sprint activo' }, { status: 400 })
    }

    const { data: pendingTasks } = await admin
      .from('tasks')
      .select('id')
      .eq('sprint_id', id)
      .neq('status', 'done')

    const { data: nextSprint } = await admin
      .from('sprints')
      .select('id')
      .eq('project_id', sprint.project_id)
      .eq('status', 'planning')
      .gt('order_index', sprint.order_index)
      .order('order_index', { ascending: true })
      .limit(1)
      .single()

    const nextSprintId: string | null = nextSprint?.id ?? null

    if (pendingTasks && pendingTasks.length > 0) {
      const pendingIds = pendingTasks.map(t => t.id)
      await admin
        .from('tasks')
        .update({ sprint_id: nextSprintId, is_carry_over: true })
        .in('id', pendingIds)
    }

    // Gestionar bugs del sprint según la acción elegida
    const now = new Date().toISOString()
    let bugsAffected = 0

    if (bugAction === 'resolve_and_close') {
      // Cerrar bugs que ya estaban resolved
      const { data: resolvedBugs } = await admin
        .from('bugs')
        .select('id')
        .eq('sprint_id', id)
        .eq('status', 'resolved')

      if (resolvedBugs && resolvedBugs.length > 0) {
        await admin
          .from('bugs')
          .update({ status: 'closed', updated_at: now })
          .in('id', resolvedBugs.map(b => b.id))
        bugsAffected += resolvedBugs.length
      }

      // Marcar como resolved los bugs open/in_progress
      const { data: openBugs } = await admin
        .from('bugs')
        .select('id')
        .eq('sprint_id', id)
        .in('status', ['open', 'in_progress'])

      if (openBugs && openBugs.length > 0) {
        await admin
          .from('bugs')
          .update({ status: 'resolved', resolved_at: now, updated_at: now })
          .in('id', openBugs.map(b => b.id))
        bugsAffected += openBugs.length
      }
    } else {
      // 'ignore': solo cerrar los que ya estaban resolved (cierre natural al completar sprint)
      const { data: resolvedBugs } = await admin
        .from('bugs')
        .select('id')
        .eq('sprint_id', id)
        .eq('status', 'resolved')

      if (resolvedBugs && resolvedBugs.length > 0) {
        await admin
          .from('bugs')
          .update({ status: 'closed', updated_at: now })
          .in('id', resolvedBugs.map(b => b.id))
        bugsAffected += resolvedBugs.length
      }
    }

    const { data: updated, error } = await admin
      .from('sprints')
      .update({ status: 'completed', updated_at: now })
      .eq('id', id)
      .select('id, name, goal, start_date, end_date, status, order_index')
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })

    revalidateTag(`sprints-${sprint.project_id}`, 'max')
    revalidateTag(`project-${sprint.project_id}`, 'max')

    return NextResponse.json({
      sprint: updated,
      carried_over: pendingTasks?.length ?? 0,
      next_sprint_id: nextSprintId,
      bugs_affected: bugsAffected,
    })
  } catch (err) {
    console.error('Error completing sprint:', err)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
