import { createClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { buildSprintOrderUpdates } from '@/lib/utils/reorder-sprint-tasks'
import { revalidateProjectTaskCaches } from '@/lib/utils/revalidate-project-task-cache'

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

/** Reordena HU-N dentro de un sprint (transaccional vía orden temporal negativo). */
export async function PATCH(request: Request) {
  try {
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
    const roleName = (profile?.role as any)?.name
    if (!['admin', 'pm', 'tech_lead'].includes(roleName)) {
      return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
    }

    const body = await request.json()
    const { projectId, sprintId, orderedTaskIds } = body as {
      projectId?: string
      sprintId?: string
      orderedTaskIds?: string[]
    }

    if (!projectId || !sprintId || !Array.isArray(orderedTaskIds) || orderedTaskIds.length === 0) {
      return NextResponse.json(
        { error: 'projectId, sprintId y orderedTaskIds son requeridos' },
        { status: 400 }
      )
    }

    const uniqueIds = new Set(orderedTaskIds)
    if (uniqueIds.size !== orderedTaskIds.length) {
      return NextResponse.json({ error: 'orderedTaskIds contiene IDs duplicados' }, { status: 400 })
    }

    const supabaseAdmin = getSupabaseAdmin()

    const { data: sprint, error: sprintError } = await supabaseAdmin
      .from('sprints')
      .select('id, project_id')
      .eq('id', sprintId)
      .single()

    if (sprintError || !sprint) {
      return NextResponse.json({ error: 'Sprint no encontrado' }, { status: 404 })
    }

    if (sprint.project_id !== projectId) {
      return NextResponse.json({ error: 'El sprint no pertenece al proyecto' }, { status: 400 })
    }

    const { data: sprintTasks, error: tasksError } = await supabaseAdmin
      .from('tasks')
      .select('id, sprint_id, project_id')
      .eq('sprint_id', sprintId)
      .eq('project_id', projectId)

    if (tasksError) {
      return NextResponse.json({ error: tasksError.message }, { status: 400 })
    }

    const sprintTaskIds = new Set((sprintTasks ?? []).map((task) => task.id))

    if (orderedTaskIds.length !== sprintTaskIds.size) {
      return NextResponse.json(
        { error: 'orderedTaskIds debe incluir todas las tareas del sprint' },
        { status: 400 }
      )
    }

    for (const taskId of orderedTaskIds) {
      if (!sprintTaskIds.has(taskId)) {
        return NextResponse.json(
          { error: 'Todas las tareas deben pertenecer al mismo sprint' },
          { status: 400 }
        )
      }
    }

    const updates = buildSprintOrderUpdates(orderedTaskIds)
    const now = new Date().toISOString()

    // Fase 1: valores temporales negativos para evitar conflicto con idx único (sprint_id, sprint_order)
    for (let i = 0; i < updates.length; i++) {
      const { error } = await supabaseAdmin
        .from('tasks')
        .update({ sprint_order: -(i + 1), updated_at: now })
        .eq('id', updates[i].id)

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 })
      }
    }

    // Fase 2: valores finales 1..N
    for (const update of updates) {
      const { error } = await supabaseAdmin
        .from('tasks')
        .update({ sprint_order: update.sprint_order, updated_at: now })
        .eq('id', update.id)

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 })
      }
    }

    revalidateProjectTaskCaches(projectId)

    return NextResponse.json({ updates })
  } catch (error) {
    console.error('Error reordering sprint tasks:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
