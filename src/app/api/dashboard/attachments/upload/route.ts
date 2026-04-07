import { createClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

const ALLOWED_TYPES = [
  'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
]

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

export async function POST(request: Request) {
  try {
    const supabaseServer = await createServerClient()
    const { data: { user } } = await supabaseServer.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const taskId = formData.get('task_id') as string | null
    const projectId = formData.get('project_id') as string | null
    const bugId = formData.get('bug_id') as string | null

    if (!file) {
      return NextResponse.json({ error: 'No se proporcionó archivo' }, { status: 400 })
    }

    if (!taskId && !projectId && !bugId) {
      return NextResponse.json({ error: 'Se requiere task_id, project_id o bug_id' }, { status: 400 })
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: 'Tipo de archivo no permitido. Solo imágenes, PDF, Word y Excel.' }, { status: 400 })
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: 'El archivo excede el límite de 10MB' }, { status: 400 })
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    // Generar path único
    const timestamp = Date.now()
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
    const folder = taskId ? `tasks/${taskId}` : bugId ? `bugs/${bugId}` : `projects/${projectId}`
    const filePath = `attachments/${folder}/${timestamp}_${sanitizedName}`

    // Subir archivo a Storage
    const arrayBuffer = await file.arrayBuffer()
    const { error: uploadError } = await supabaseAdmin.storage
      .from('uploads')
      .upload(filePath, arrayBuffer, {
        contentType: file.type,
        upsert: false,
      })

    if (uploadError) {
      console.error('Upload error:', uploadError)
      return NextResponse.json({ error: uploadError.message }, { status: 400 })
    }

    // Obtener URL pública
    const { data: urlData } = supabaseAdmin.storage
      .from('uploads')
      .getPublicUrl(filePath)

    // Guardar registro en la tabla attachments
    const { data: attachment, error: dbError } = await supabaseAdmin
      .from('attachments')
      .insert({
        task_id: taskId || null,
        project_id: projectId || null,
        bug_id: bugId || null,
        uploaded_by_id: user.id,
        file_name: file.name,
        file_size: file.size,
        file_type: file.type,
        file_url: urlData.publicUrl,
        storage_path: filePath,
      })
      .select(`
        id, file_name, file_size, file_type, file_url, created_at,
        uploaded_by:profiles(id, full_name, avatar_url)
      `)
      .single()

    if (dbError) {
      // Si falla el registro en DB, eliminar el archivo subido
      await supabaseAdmin.storage.from('uploads').remove([filePath])
      return NextResponse.json({ error: dbError.message }, { status: 400 })
    }

    // Registrar actividad
    const entityType = taskId ? 'task' : 'project'
    const entityId = taskId || projectId
    
    // Obtener nombre de la entidad
    let entityName = file.name
    if (taskId) {
      const { data: task } = await supabaseAdmin.from('tasks').select('title, project_id').eq('id', taskId).single()
      if (task) {
        entityName = task.title
        await supabaseAdmin.from('activity_log').insert({
          user_id: user.id,
          action: 'attached',
          entity_type: entityType,
          entity_id: entityId,
          entity_name: entityName,
          details: { project_id: task.project_id, file_name: file.name },
        })
      }
    } else if (projectId) {
      const { data: project } = await supabaseAdmin.from('projects').select('name').eq('id', projectId).single()
      entityName = project?.name || 'Proyecto'
      await supabaseAdmin.from('activity_log').insert({
        user_id: user.id,
        action: 'attached',
        entity_type: entityType,
        entity_id: entityId,
        entity_name: entityName,
        details: { project_id: projectId, file_name: file.name },
      })
    }

    return NextResponse.json({ attachment }, { status: 201 })
  } catch (error) {
    console.error('Error uploading attachment:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
