import { createClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// POST - Crear comentario
export async function POST(request: Request) {
  try {
    const supabaseServer = await createServerClient()
    const { data: { user } } = await supabaseServer.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await request.json()

    if (!body.content) {
      return NextResponse.json({ error: 'El contenido es requerido' }, { status: 400 })
    }

    if (!body.project_id && !body.task_id && !body.bug_id) {
      return NextResponse.json({ error: 'Se requiere project_id, task_id o bug_id' }, { status: 400 })
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    const { data: comment, error } = await supabaseAdmin
      .from('comments')
      .insert({
        content: body.content,
        user_id: user.id,
        project_id: body.project_id || null,
        task_id: body.task_id || null,
        bug_id: body.bug_id || null,
        is_stakeholder_message: body.is_stakeholder_message || false,
      })
      .select(`
        id, content, created_at, updated_at, is_stakeholder_message,
        user:profiles(id, full_name, avatar_url, role:roles(name))
      `)
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ comment })
  } catch (error) {
    console.error('Error creating comment:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
