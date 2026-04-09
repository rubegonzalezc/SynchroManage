import { createClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// GET - Obtener comentarios del proyecto
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const stakeholderOnly = searchParams.get('stakeholder') === 'true'
    
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

    // Obtener el rol del usuario actual
    const { data: currentUserProfile } = await supabaseAdmin
      .from('profiles')
      .select('role:roles(name)')
      .eq('id', user.id)
      .single()

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const currentUserRole = (currentUserProfile?.role as any)?.name

    // Si es stakeholder o se piden solo mensajes de stakeholder
    if (currentUserRole === 'stakeholder' || stakeholderOnly) {
      // Obtener solo comentarios marcados como stakeholder_message
      const { data: comments, error } = await supabaseAdmin
        .from('comments')
        .select(`
          id, content, created_at, updated_at, is_stakeholder_message,
          user:profiles(id, full_name, avatar_url, role:roles(name))
        `)
        .eq('project_id', id)
        .is('task_id', null)
        .is('bug_id', null)
        .eq('is_stakeholder_message', true)
        .order('created_at', { ascending: true })

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 })
      }

      // Si es stakeholder, filtrar para mostrar solo sus mensajes y los del PM/admin
      if (currentUserRole === 'stakeholder') {
        const { data: project } = await supabaseAdmin
          .from('projects')
          .select('pm_id')
          .eq('id', id)
          .single()

        const pmId = project?.pm_id

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const filteredComments = comments?.filter((c: any) => {
          const commentUserId = c.user?.id
          const commentUserRole = c.user?.role?.name
          
          if (commentUserId === user.id) return true
          if (commentUserId === pmId) return true
          if (commentUserRole === 'admin') return true
          if (commentUserRole === 'pm') return true
          
          return false
        })

        return NextResponse.json({ comments: filteredComments })
      }

      return NextResponse.json({ comments })
    }

    // Para otros roles, obtener comentarios normales (no stakeholder messages, solo del proyecto directo)
    const { data: comments, error } = await supabaseAdmin
      .from('comments')
      .select(`
        id, content, created_at, updated_at, is_stakeholder_message,
        user:profiles(id, full_name, avatar_url, role:roles(name))
      `)
      .eq('project_id', id)
      .is('task_id', null)
      .is('bug_id', null)
      .or('is_stakeholder_message.is.null,is_stakeholder_message.eq.false')
      .order('created_at', { ascending: true })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ comments })
  } catch (error) {
    console.error('Error fetching comments:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
