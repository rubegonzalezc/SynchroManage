import { createClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

function getAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function logActivity(admin: any, userId: string, action: string, entityId: string, entityName: string, projectId: string, details?: Record<string, unknown>) {
  try {
    await admin.from('activity_log').insert({
      user_id: userId,
      action,
      entity_type: 'bug',
      entity_id: entityId,
      entity_name: entityName,
      details: { project_id: projectId, ...details },
    })
  } catch (err) {
    console.error('Error logging activity:', err)
  }
}

const BUG_SELECT = `
  id, title, description, steps_to_reproduce, severity, status, sprint_id, task_id, assignee_id, created_at, updated_at,
  sprint:sprints(id, name, status),
  task:tasks(id, task_number, title),
  assignee:profiles!bugs_assignee_id_fkey(id, full_name, avatar_url),
  reporter:profiles!bugs_reporter_id_fkey(id, full_name, avatar_url),
  attachments(id, file_name, file_size, file_type, file_url, created_at,
    uploaded_by:profiles!attachments_uploaded_by_id_fkey(id, full_name, avatar_url)
  ),
  comments(
    id, content, created_at,
    user:profiles(id, full_name, avatar_url, role:roles(name))
  )
`

// GET - Obtener bug con comentarios
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabaseServer = await createServerClient()
    const { data: { user } } = await supabaseServer.auth.getUser()
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const admin = getAdmin()
    const { data: bug, error } = await admin.from('bugs').select(BUG_SELECT).eq('id', id).single()

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })

    if (bug.comments) {
      bug.comments.sort((a: { created_at: string }, b: { created_at: string }) =>
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      )
    }

    return NextResponse.json({ bug })
  } catch (err) {
    console.error('Error fetching bug:', err)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}

// PUT - Actualizar bug
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabaseServer = await createServerClient()
    const { data: { user } } = await supabaseServer.auth.getUser()
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const body = await request.json()
    const admin = getAdmin()

    // Obtener estado actual para comparar cambios
    const { data: currentBug } = await admin
      .from('bugs')
      .select('title, status, severity, assignee_id, project_id')
      .eq('id', id)
      .single()

    const updatePayload: Record<string, unknown> = { updated_at: new Date().toISOString() }
    if ('title' in body) updatePayload.title = body.title
    if ('description' in body) updatePayload.description = body.description || null
    if ('steps_to_reproduce' in body) updatePayload.steps_to_reproduce = body.steps_to_reproduce || null
    if ('severity' in body) updatePayload.severity = body.severity
    if ('status' in body) {
      updatePayload.status = body.status
      // Registrar cuándo se marcó como resuelto para el cierre automático
      if (body.status === 'resolved' && currentBug?.status !== 'resolved') {
        updatePayload.resolved_at = new Date().toISOString()
      } else if (body.status !== 'resolved') {
        updatePayload.resolved_at = null
      }
    }
    if ('sprint_id' in body) updatePayload.sprint_id = body.sprint_id || null
    if ('task_id' in body) updatePayload.task_id = body.task_id || null
    if ('assignee_id' in body) updatePayload.assignee_id = body.assignee_id || null

    const { data: bug, error } = await admin
      .from('bugs')
      .update(updatePayload)
      .eq('id', id)
      .select(BUG_SELECT)
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })

    const projectId = currentBug?.project_id || ''
    const bugTitle = body.title || currentBug?.title || ''

    // Auditoría: cambio de estado
    if (currentBug && 'status' in body && currentBug.status !== body.status) {
      await logActivity(admin, user.id, 'status_changed', id, bugTitle, projectId, {
        from: currentBug.status,
        to: body.status,
      })
    }

    // Auditoría: cambio de severidad
    if (currentBug && 'severity' in body && currentBug.severity !== body.severity) {
      await logActivity(admin, user.id, 'updated', id, bugTitle, projectId, {
        field: 'severity',
        from: currentBug.severity,
        to: body.severity,
      })
    }

    // Auditoría: cambio de asignado
    const newAssigneeId = 'assignee_id' in body ? (body.assignee_id || null) : undefined
    const oldAssigneeId = currentBug?.assignee_id || null

    if (newAssigneeId !== undefined && newAssigneeId !== oldAssigneeId) {
      if (newAssigneeId) {
        const { data: assigneeProfile } = await admin.from('profiles').select('full_name').eq('id', newAssigneeId).single()
        await logActivity(admin, user.id, 'assigned', id, bugTitle, projectId, {
          assignee_id: newAssigneeId,
          assignee_name: assigneeProfile?.full_name || '',
        })
        // Notificación al nuevo asignado
        if (newAssigneeId !== user.id) {
          const { data: reporter } = await admin.from('profiles').select('full_name').eq('id', user.id).single()
          await admin.from('notifications').insert({
            user_id: newAssigneeId,
            from_user_id: user.id,
            type: 'task_assigned',
            title: 'Bug asignado',
            message: `${reporter?.full_name || 'Alguien'} te asignó el bug "${bugTitle}"`,
            link: `/projects/${projectId}?tab=bugs`,
            project_id: projectId,
          })
        }
      } else if (oldAssigneeId) {
        // Desasignado
        const { data: oldProfile } = await admin.from('profiles').select('full_name').eq('id', oldAssigneeId).single()
        await logActivity(admin, user.id, 'unassigned', id, bugTitle, projectId, {
          unassigned_user_id: oldAssigneeId,
          unassigned_user_name: oldProfile?.full_name || '',
        })
      }
    }

    // Auditoría general si no hubo cambios específicos ya registrados
    const hasSpecificLog = (currentBug && 'status' in body && currentBug.status !== body.status) ||
      (currentBug && 'severity' in body && currentBug.severity !== body.severity) ||
      (newAssigneeId !== undefined && newAssigneeId !== oldAssigneeId)

    if (!hasSpecificLog) {
      await logActivity(admin, user.id, 'updated', id, bugTitle, projectId)
    }

    return NextResponse.json({ bug })
  } catch (err) {
    console.error('Error updating bug:', err)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}

// DELETE - Eliminar bug
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabaseServer = await createServerClient()
    const { data: { user } } = await supabaseServer.auth.getUser()
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const admin = getAdmin()

    // Obtener info antes de eliminar para la auditoría
    const { data: bugToDelete } = await admin
      .from('bugs')
      .select('title, project_id')
      .eq('id', id)
      .single()

    const { error } = await admin.from('bugs').delete().eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 400 })

    // Auditoría: eliminación
    if (bugToDelete) {
      await logActivity(admin, user.id, 'deleted', id, bugToDelete.title, bugToDelete.project_id)
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Error deleting bug:', err)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
