import { createClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// DELETE - Eliminar comentario (admin o autor del comentario)
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

    // Obtener el comentario para verificar permisos
    const { data: comment } = await supabaseAdmin
      .from('comments')
      .select('user_id')
      .eq('id', id)
      .single()

    if (!comment) {
      return NextResponse.json({ error: 'Comentario no encontrado' }, { status: 404 })
    }

    // Verificar si es admin o autor del comentario
    const { data: profile } = await supabaseServer
      .from('profiles')
      .select('role:roles(name)')
      .eq('id', user.id)
      .single()

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const isAdmin = (profile?.role as any)?.name === 'admin'
    const isAuthor = comment.user_id === user.id

    if (!isAdmin && !isAuthor) {
      return NextResponse.json({ error: 'No tienes permisos para eliminar este comentario' }, { status: 403 })
    }

    const { error } = await supabaseAdmin
      .from('comments')
      .delete()
      .eq('id', id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting comment:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
