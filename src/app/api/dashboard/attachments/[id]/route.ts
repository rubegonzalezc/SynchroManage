import { createClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// DELETE - Eliminar archivo adjunto
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

    // Obtener el attachment para verificar permisos y obtener storage_path
    const { data: attachment, error: fetchError } = await supabaseAdmin
      .from('attachments')
      .select('uploaded_by_id, storage_path, file_name, task_id, project_id')
      .eq('id', id)
      .single()

    if (fetchError || !attachment) {
      return NextResponse.json({ error: 'Archivo no encontrado' }, { status: 404 })
    }

    // Verificar que el usuario sea el que subió el archivo o sea admin
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('role:roles(name)')
      .eq('id', user.id)
      .single()

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const roleName = (profile?.role as any)?.name
    if (attachment.uploaded_by_id !== user.id && roleName !== 'admin' && roleName !== 'pm') {
      return NextResponse.json({ error: 'No tienes permisos para eliminar este archivo' }, { status: 403 })
    }

    // Eliminar de Storage
    if (attachment.storage_path) {
      await supabaseAdmin.storage.from('uploads').remove([attachment.storage_path])
    }

    // Eliminar registro de DB
    const { error: deleteError } = await supabaseAdmin
      .from('attachments')
      .delete()
      .eq('id', id)

    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 400 })
    }

    // Registrar actividad
    const entityType = attachment.task_id ? 'task' : 'project'
    const entityId = attachment.task_id || attachment.project_id
    let projectId = attachment.project_id

    if (attachment.task_id) {
      const { data: task } = await supabaseAdmin.from('tasks').select('title, project_id').eq('id', attachment.task_id).single()
      projectId = task?.project_id || null
      await supabaseAdmin.from('activity_log').insert({
        user_id: user.id,
        action: 'detached',
        entity_type: entityType,
        entity_id: entityId,
        entity_name: task?.title || attachment.file_name,
        details: { project_id: projectId, file_name: attachment.file_name },
      })
    } else if (projectId) {
      const { data: project } = await supabaseAdmin.from('projects').select('name').eq('id', projectId).single()
      await supabaseAdmin.from('activity_log').insert({
        user_id: user.id,
        action: 'detached',
        entity_type: entityType,
        entity_id: entityId,
        entity_name: project?.name || attachment.file_name,
        details: { project_id: projectId, file_name: attachment.file_name },
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting attachment:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
