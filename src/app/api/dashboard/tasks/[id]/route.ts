import { createClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { revalidateTag } from 'next/cache'
import { NextResponse } from 'next/server'
import { deduplicateRecipients } from '@/lib/utils/email-recipients'

// Helper para registrar actividad desde el servidor
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function logActivityServer(
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

// GET - Obtener tarea con comentarios y asignados múltiples
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabaseServer = await createServerClient()
    const { data: { user } } = await supabaseServer.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    const { data: task, error } = await supabaseAdmin
      .from('tasks')
      .select(`
        *,
        assignee:profiles(id, full_name, email, avatar_url),
        project:projects(id, name),
        sprint:sprints(id, name, status),
        comments(
          id, content, created_at, updated_at,
          user:profiles(id, full_name, avatar_url, role:roles(name))
        )
      `)
      .eq('id', id)
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    // Ordenar comentarios por fecha
    if (task.comments) {
      task.comments.sort((a: { created_at: string }, b: { created_at: string }) =>
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      )
    }

    // Obtener asignados desde task_assignees con datos de perfil
    const { data: taskAssignees } = await supabaseAdmin
      .from('task_assignees')
      .select('user_id, profiles:user_id(id, full_name, avatar_url)')
      .eq('task_id', id)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const assignees = (taskAssignees || [])
      .map((ta: any) => {
        const p = ta.profiles
        // Supabase may return profiles as object or array depending on FK relationship
        if (Array.isArray(p)) return p[0] || null
        return p
      })
      .filter(Boolean)

    return NextResponse.json({ task: { ...task, assignees } })
  } catch (error) {
    console.error('Error fetching task:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}

// PUT - Actualizar tarea con soporte multi-asignado
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
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

    // Obtener tarea actual para comparar cambios
    const { data: currentTask } = await supabaseAdmin
      .from('tasks')
      .select('title, status, assignee_id, project_id')
      .eq('id', id)
      .single()

    // Obtener asignados actuales desde task_assignees
    const { data: currentAssigneesData } = await supabaseAdmin
      .from('task_assignees')
      .select('user_id')
      .eq('task_id', id)

    const currentAssigneeIds = (currentAssigneesData || []).map(
      (a: { user_id: string }) => a.user_id
    )

    // Calcular diferencias: añadidos (B\A) y removidos (A\B)
    const addedIds = assigneeIds.filter(aid => !currentAssigneeIds.includes(aid))
    const removedIds = currentAssigneeIds.filter((cid: string) => !assigneeIds.includes(cid))

    // Mantener assignee_id sincronizado con el primer asignado (compatibilidad hacia atrás)
    const primaryAssigneeId = assigneeIds.length > 0 ? assigneeIds[0] : null

    // Actualizar la tarea
    const updatePayload: Record<string, unknown> = {
      title: body.title,
      description: body.description || null,
      status: body.status,
      priority: body.priority,
      category: body.category || 'task',
      assignee_id: primaryAssigneeId,
      due_date: body.due_date || null,
      updated_at: new Date().toISOString(),
    }
    if ('sprint_id' in body) updatePayload.sprint_id = body.sprint_id ?? null
    if ('is_carry_over' in body) updatePayload.is_carry_over = body.is_carry_over ?? false

    const { data: task, error } = await supabaseAdmin
      .from('tasks')
      .update(updatePayload)
      .eq('id', id)
      .select(`
        *,
        assignee:profiles(id, full_name, avatar_url)
      `)
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    // Sincronizar task_assignees: eliminar removidos
    if (removedIds.length > 0) {
      const { error: deleteError } = await supabaseAdmin
        .from('task_assignees')
        .delete()
        .eq('task_id', id)
        .in('user_id', removedIds)

      if (deleteError) {
        console.error('Error removing task_assignees:', deleteError)
      }
    }

    // Sincronizar task_assignees: insertar nuevos (ON CONFLICT DO NOTHING)
    if (addedIds.length > 0) {
      const newRecords = addedIds.map(userId => ({
        task_id: id,
        user_id: userId,
      }))

      const { error: insertError } = await supabaseAdmin
        .from('task_assignees')
        .upsert(newRecords, { onConflict: 'task_id,user_id', ignoreDuplicates: true })

      if (insertError) {
        console.error('Error inserting task_assignees:', insertError)
      }
    }

    // Registrar actividad de actualización
    if (currentTask) {
      // Si cambió el status
      if (currentTask.status !== body.status) {
        await logActivityServer(
          supabaseAdmin,
          user.id,
          'status_changed',
          'task',
          id,
          body.title,
          {
            project_id: currentTask.project_id,
            from: currentTask.status,
            to: body.status,
          }
        )
      } else {
        await logActivityServer(
          supabaseAdmin,
          user.id,
          'updated',
          'task',
          id,
          body.title,
          { project_id: currentTask.project_id }
        )
      }

      // Registrar actividad de desasignación para cada removido
      if (removedIds.length > 0) {
        // Obtener nombres de los removidos
        const { data: removedProfiles } = await supabaseAdmin
          .from('profiles')
          .select('id, full_name')
          .in('id', removedIds)

        for (const profile of removedProfiles || []) {
          await logActivityServer(
            supabaseAdmin,
            user.id,
            'unassigned',
            'task',
            id,
            body.title,
            {
              project_id: currentTask.project_id,
              unassigned_user_id: profile.id,
              unassigned_user_name: profile.full_name,
            }
          )
        }
      }
    }

    // Enviar notificaciones a nuevos asignados (B\A), no a los que ya estaban (A∩B)
    for (const assigneeId of addedIds) {
      if (assigneeId === user.id) continue // No notificar al usuario que hace la acción
      try {
        await supabaseAdmin.from('notifications').insert({
          user_id: assigneeId,
          from_user_id: user.id,
          type: 'task_assigned',
          title: 'Nueva tarea asignada',
          message: `Se te ha asignado la tarea "${task.title}"`,
          link: `/projects?task=${task.id}`,
          project_id: currentTask?.project_id || null,
        })
      } catch (notifError) {
        console.error('Error sending notification to new assignee:', notifError)
      }
    }

    // Enviar emails de asignación de tarea a nuevos asignados
    try {
      if (addedIds.length > 0) {
        // Fetch project name for the email
        const { data: projectData } = await supabaseAdmin
          .from('projects')
          .select('name')
          .eq('id', currentTask?.project_id)
          .single()

        const projectName = projectData?.name || ''

        // Fetch profiles with email for new assignees
        const { data: addedProfiles } = await supabaseAdmin
          .from('profiles')
          .select('id, full_name, email')
          .in('id', addedIds)

        if (addedProfiles) {
          const rawRecipients: Array<{ userId: string; email: string; fullName: string; role: string }> = []

          for (const profile of addedProfiles) {
            if (profile.email) {
              rawRecipients.push({
                userId: profile.id,
                email: profile.email,
                fullName: profile.full_name || '',
                role: 'Asignado',
              })
            }
          }

          const recipients = deduplicateRecipients(rawRecipients, user.id)

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

    if (currentTask?.project_id) {
      revalidateTag(`project-${currentTask.project_id}`, 'max')
    }

    return NextResponse.json({ task: { ...task, assignees } })
  } catch (error) {
    console.error('Error updating task:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}

// DELETE - Eliminar tarea
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabaseServer = await createServerClient()
    const { data: { user } } = await supabaseServer.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    // Obtener info de la tarea antes de eliminar
    const { data: taskToDelete } = await supabaseAdmin
      .from('tasks')
      .select('title, project_id')
      .eq('id', id)
      .single()

    const { error } = await supabaseAdmin
      .from('tasks')
      .delete()
      .eq('id', id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    // Registrar actividad
    if (taskToDelete) {
      await logActivityServer(
        supabaseAdmin,
        user.id,
        'deleted',
        'task',
        id,
        taskToDelete.title,
        { project_id: taskToDelete.project_id }
      )
      revalidateTag(`project-${taskToDelete.project_id}`, 'max')
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting task:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
