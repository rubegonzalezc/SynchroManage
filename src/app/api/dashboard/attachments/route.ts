import { createClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// GET - Obtener archivos adjuntos de una tarea o proyecto
export async function GET(request: Request) {
  try {
    const supabaseServer = await createServerClient()
    const { data: { user } } = await supabaseServer.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const taskId = searchParams.get('task_id')
    const projectId = searchParams.get('project_id')
    const bugId = searchParams.get('bug_id')

    if (!taskId && !projectId && !bugId) {
      return NextResponse.json({ error: 'Se requiere task_id, project_id o bug_id' }, { status: 400 })
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    let query = supabaseAdmin
      .from('attachments')
      .select(`
        id, file_name, file_size, file_type, file_url, created_at,
        uploaded_by:profiles(id, full_name, avatar_url)
      `)
      .order('created_at', { ascending: false })

    if (taskId) {
      query = query.eq('task_id', taskId)
    } else if (bugId) {
      query = query.eq('bug_id', bugId)
    } else if (projectId) {
      query = query.eq('project_id', projectId).is('task_id', null).is('bug_id', null)
    }

    const { data: attachments, error } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ attachments })
  } catch (error) {
    console.error('Error fetching attachments:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
