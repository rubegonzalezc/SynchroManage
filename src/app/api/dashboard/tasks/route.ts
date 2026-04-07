import { createClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { revalidateTag } from 'next/cache'
import { NextResponse } from 'next/server'
import { deduplicateRecipients } from '@/lib/utils/email-recipients'

// Helper para registrar actividad desde el servidor
async function logActivityServer(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabaseAdmin: any,
  userId: string,
  action: string,
  entityType: string,
  entityId?: string,
  entityName?: string,
  details?: Record<string, unknown>
) {
  try {
    await supabaseAdmin.from('activity_log').insert({
      user_id: userId,
      action,
      entity_type: entityType,
      entity_id: entityId || null,
      entity_name: entityName || null,
      details: details || null,
    })
  } catch (error) {
    console.error('Error logging activity:', error)
  }
}

// POST - Crear tarea
export async function POST(request: Request) {
  try {
    const supabaseServer = await createServerClient()
    const { data: { user } } = await supabaseServer.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await request.json()

    // Normalizar assignee_ids: soportar assignee_ids[] o assignee_id (string) para compatibilidad
    let assigneeIds: string[] = []
    if (Array.isArray(body.assignee_ids)) {
      assigneeIds = body.assignee_ids
    } else if (typeof body.assignee_id === 'string' && body.assignee_id) {
      assigneeIds = [body.assignee_id]
    }
    // Deduplicar IDs
    assigneeIds = [...new Set(assigneeIds)]

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    // Obtener la posición máxima actual para el status
    const { data: maxPosData } = await supabaseAdmin
      .from('tasks')
      .select('position')
      .eq('project_id', body.project_id)
      .eq('status', body.status || 'backlog')
      .order('position', { ascending: false })
      .limit(1)
      .single()

    const newPosition = (maxPosData?.position ?? -1) + 1

    // Mantener assignee_id sincronizado con el primer asignado (compatibilidad hacia atrás)
    const primaryAssigneeId = assigneeIds.length > 0 ? assigneeIds[0] : null

    const { data: task, error } = await supabaseAdmin
      .from('tasks')
      .insert({
        project_id: body.project_id,
        title: body.title,
        description: body.description || null,
        status: body.status || 'backlog',
        priority: body.priority || 'medium',
        category: body.category || 'task',
        assignee_id: primaryAssigneeId,
        reviewer_id: body.reviewer_id || null,
        due_date: body.due_date || null,
        position: newPosition,
        sprint_id: body.sprint_id || null,
        branch_name: body.branch_name || null,
        complexity: body.complexity ?? null,
      })
      .select(`
        *,
        assignee:profiles!assignee_id(id, full_name, avatar_url)
      `)
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    // Si el frontend pidió autocompletar, aplicamos el número oficial de la DB en 1 ms extra
    if (body.auto_branch && task && task.task_number) {
      const slug = (task.title || '')
        .toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
      
      const generatedBranch = `${task.category || 'task'}/${slug}-${task.task_number}`
      
      // Enviar actualización muy rápida a la base de datos
      await supabaseAdmin.from('tasks').update({ branch_name: generatedBranch }).eq('id', task.id)
      
      // Actualizar la variable que devolvemos en el JSON
      task.branch_name = generatedBranch
    }

    // Insertar registros en task_assignees para cada asignado (ON CONFLICT DO NOTHING via upsert)
    if (assigneeIds.length > 0) {
      const assigneeRecords = assigneeIds.map(userId => ({
        task_id: task.id,
        user_id: userId,
      }))

      const { error: assigneesError } = await supabaseAdmin
        .from('task_assignees')
        .upsert(assigneeRecords, { onConflict: 'task_id,user_id', ignoreDuplicates: true })

      if (assigneesError) {
        console.error('Error inserting task_assignees:', assigneesError)
      }
    }

    // Registrar actividad
    await logActivityServer(
      supabaseAdmin,
      user.id,
      'created',
      'task',
      task.id,
      task.title,
      { project_id: body.project_id }
    )

    // Si se asignó revisor al crear, registrar en auditoría
    if (body.reviewer_id) {
      const { data: reviewerProfile } = await supabaseAdmin
        .from('profiles')
        .select('full_name')
        .eq('id', body.reviewer_id)
        .single()

      await logActivityServer(
        supabaseAdmin,
        user.id,
        'reviewer_assigned',
        'task',
        task.id,
        task.title,
        {
          project_id: body.project_id,
          reviewer_id: body.reviewer_id,
          reviewer_name: reviewerProfile?.full_name || '',
        }
      )
    }

    // Enviar notificaciones a todos los asignados
    for (const assigneeId of assigneeIds) {
      if (assigneeId === user.id) continue // No notificar al creador si se asignó a sí mismo
      try {
        await supabaseAdmin.from('notifications').insert({
          user_id: assigneeId,
          from_user_id: user.id,
          type: 'task_assigned',
          title: 'Nueva tarea asignada',
          message: `Se te ha asignado la tarea "${task.title}"`,
          link: `/projects?task=${task.id}`,
          project_id: body.project_id,
        })
      } catch (notifError) {
        console.error('Error sending notification to assignee:', notifError)
      }
    }

    // Notificar al revisor si se asignó uno al crear
    if (body.reviewer_id && body.reviewer_id !== user.id) {
      try {
        await supabaseAdmin.from('notifications').insert({
          user_id: body.reviewer_id,
          from_user_id: user.id,
          type: 'task_assigned',
          title: 'Te asignaron como Revisor (QA)',
          message: `Eres el revisor de la tarea "${task.title}"`,
          link: `/projects?task=${task.id}`,
          project_id: body.project_id,
        })
      } catch (notifError) {
        console.error('Error sending notification to reviewer:', notifError)
      }
    }

    // Enviar emails de asignación de tarea
    try {
      if (assigneeIds.length > 0) {
        // Fetch project name for the email
        const { data: projectData } = await supabaseAdmin
          .from('projects')
          .select('name')
          .eq('id', body.project_id)
          .single()

        const projectName = projectData?.name || ''

        // Fetch profiles with email for assignees
        const { data: assigneeProfiles } = await supabaseAdmin
          .from('profiles')
          .select('id, full_name, email')
          .in('id', assigneeIds)

        if (assigneeProfiles) {
          // Build recipients list
          const rawRecipients: Array<{ userId: string; email: string; fullName: string; role: string }> = []

          for (const profile of assigneeProfiles) {
            if (profile.email) {
              rawRecipients.push({
                userId: profile.id,
                email: profile.email,
                fullName: profile.full_name || '',
                role: 'Asignado',
              })
            }
          }

          // Deduplicate and exclude the creator
          const recipients = deduplicateRecipients(rawRecipients, user.id)

          // Send email to each unique recipient
          for (const recipient of recipients) {
            await supabaseAdmin.functions.invoke('send-email', {
              body: {
                to: recipient.email,
                subject: `Nueva tarea asignada: ${task.title}`,
                type: 'task_assigned',
                data: {
                  recipientName: recipient.fullName,
                  taskName: task.title,
                  projectName: projectName,
                  priority: task.priority,
                  taskUrl: `${process.env.NEXT_PUBLIC_APP_URL}/projects?task=${task.id}`,
                },
              },
            })
          }
        }
      }
    } catch (emailError) {
      console.error('Error sending task assignment emails:', emailError)
    }

    // Obtener asignados completos para la respuesta
    let assignees: { id: string; full_name: string; avatar_url: string | null }[] = []
    if (assigneeIds.length > 0) {
      const { data: assigneesData } = await supabaseAdmin
        .from('profiles')
        .select('id, full_name, avatar_url')
        .in('id', assigneeIds)

      assignees = assigneesData || []
    }

    revalidateTag(`project-${body.project_id}`, 'max')

    return NextResponse.json({ task: { ...task, assignees } })
  } catch (error) {
    console.error('Error creating task:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}



// PATCH - Actualizar posición/status de tareas (para drag & drop)
export async function PATCH(request: Request) {
  try {
    const supabaseServer = await createServerClient()
    const { data: { user } } = await supabaseServer.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const { taskId, status, position } = body

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    // Obtener tarea actual para comparar status
    const { data: currentTask } = await supabaseAdmin
      .from('tasks')
      .select('status, title, project_id')
      .eq('id', taskId)
      .single()

    const { data: task, error } = await supabaseAdmin
      .from('tasks')
      .update({
        status,
        position,
        updated_at: new Date().toISOString(),
      })
      .eq('id', taskId)
      .select(`
        *,
        assignee:profiles!assignee_id(id, full_name, avatar_url)
      `)
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    // Obtener asignados desde task_assignees para la respuesta
    const { data: assigneesData } = await supabaseAdmin
      .from('task_assignees')
      .select('user_id, profiles:user_id(id, full_name, avatar_url)')
      .eq('task_id', taskId)

    const assignees = (assigneesData || []).map(
      (a: { profiles: { id: string; full_name: string; avatar_url: string | null }[] }) => a.profiles[0]
    ).filter(Boolean)

    // Registrar actividad si cambió el status
    if (currentTask && currentTask.status !== status) {
      await logActivityServer(
        supabaseAdmin,
        user.id,
        'status_changed',
        'task',
        taskId,
        currentTask.title,
        { 
          project_id: currentTask.project_id,
          from: currentTask.status,
          to: status,
        }
      )
    }

    return NextResponse.json({ task: { ...task, assignees } })
  } catch (error) {
    console.error('Error updating task position:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
