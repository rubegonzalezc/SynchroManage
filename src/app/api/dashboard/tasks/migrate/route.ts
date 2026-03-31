import { createClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// POST - Mudar tareas a otro proyecto (para migración a CC)
export async function POST(request: Request) {
  try {
    const supabaseServer = await createServerClient()
    const { data: { user } } = await supabaseServer.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const { task_ids, target_project_id } = body

    if (!task_ids?.length || !target_project_id) {
      return NextResponse.json({ error: 'Faltan parámetros' }, { status: 400 })
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    // Obtener la posición máxima actual en el proyecto destino
    const { data: maxPosData } = await supabaseAdmin
      .from('tasks')
      .select('position')
      .eq('project_id', target_project_id)
      .order('position', { ascending: false })
      .limit(1)
      .single()

    let nextPosition = (maxPosData?.position ?? -1) + 1

    // Mover cada tarea al proyecto destino manteniendo su estado original
    for (const taskId of task_ids) {
      // Obtener el estado actual de la tarea
      const { data: currentTask } = await supabaseAdmin
        .from('tasks')
        .select('status')
        .eq('id', taskId)
        .single()

      await supabaseAdmin
        .from('tasks')
        .update({
          project_id: target_project_id,
          position: nextPosition,
          updated_at: new Date().toISOString(),
          // Mantener el estado original de la tarea
          status: currentTask?.status || 'backlog',
        })
        .eq('id', taskId)
      nextPosition++
    }

    // Registrar actividad
    await supabaseAdmin.from('activity_log').insert({
      user_id: user.id,
      action: 'migrated',
      entity_type: 'tasks',
      entity_id: target_project_id,
      entity_name: `${task_ids.length} tarea(s) migrada(s)`,
      details: { task_ids, target_project_id },
    })

    return NextResponse.json({ success: true, migrated: task_ids.length })
  } catch (error) {
    console.error('Error migrating tasks:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
