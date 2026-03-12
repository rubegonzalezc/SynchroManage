import { createClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// POST - Verificar tareas próximas a vencer y enviar notificaciones
export async function POST() {
  try {
    const supabaseServer = await createServerClient()
    const { data: { user } } = await supabaseServer.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Solo admin puede ejecutar esto manualmente
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('role:roles(name)')
      .eq('id', user.id)
      .single()

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const roleName = (profile?.role as any)?.name
    if (roleName !== 'admin') {
      return NextResponse.json({ error: 'Solo administradores' }, { status: 403 })
    }

    // Obtener la fecha de mañana
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const tomorrowStr = tomorrow.toISOString().split('T')[0]

    // Obtener tareas que vencen mañana y no están completadas
    const { data: tasks, error: tasksError } = await supabaseAdmin
      .from('tasks')
      .select(`
        id,
        title,
        task_number,
        due_date,
        assignee_id,
        project:projects(id, name, pm_id)
      `)
      .eq('due_date', tomorrowStr)
      .neq('status', 'done')

    if (tasksError) {
      return NextResponse.json({ error: tasksError.message }, { status: 400 })
    }

    const notifications: Array<{
      user_id: string
      type: string
      title: string
      message: string
      link: string
      task_id: string
      project_id: string
    }> = []

    for (const task of tasks || []) {
      const projectData = task.project as { id: string; name: string; pm_id: string }[] | { id: string; name: string; pm_id: string } | null
      const project = Array.isArray(projectData) ? projectData[0] : projectData
      if (!project) continue

      // Notificar al asignado
      if (task.assignee_id) {
        notifications.push({
          user_id: task.assignee_id,
          type: 'task_due_soon',
          title: 'Tarea próxima a vencer',
          message: `La tarea #${task.task_number} "${task.title}" vence mañana`,
          link: `/projects/${project.id}`,
          task_id: task.id,
          project_id: project.id,
        })
      }

      // Notificar al PM
      if (project.pm_id && project.pm_id !== task.assignee_id) {
        notifications.push({
          user_id: project.pm_id,
          type: 'task_due_soon',
          title: 'Tarea de tu proyecto próxima a vencer',
          message: `La tarea #${task.task_number} "${task.title}" en "${project.name}" vence mañana`,
          link: `/projects/${project.id}`,
          task_id: task.id,
          project_id: project.id,
        })
      }
    }

    // Insertar notificaciones evitando duplicados del mismo día
    if (notifications.length > 0) {
      const today = new Date().toISOString().split('T')[0]
      const { data: existing } = await supabaseAdmin
        .from('notifications')
        .select('user_id, task_id')
        .eq('type', 'task_due_soon')
        .gte('created_at', today)

      const existingSet = new Set(
        (existing || []).map(n => `${n.user_id}-${n.task_id}`)
      )

      const newNotifications = notifications.filter(
        n => !existingSet.has(`${n.user_id}-${n.task_id}`)
      )

      if (newNotifications.length > 0) {
        await supabaseAdmin.from('notifications').insert(newNotifications)
      }

      return NextResponse.json({
        success: true,
        tasksChecked: tasks?.length || 0,
        notificationsSent: newNotifications.length,
      })
    }

    return NextResponse.json({
      success: true,
      tasksChecked: tasks?.length || 0,
      notificationsSent: 0,
    })
  } catch (error) {
    console.error('Error checking due tasks:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
