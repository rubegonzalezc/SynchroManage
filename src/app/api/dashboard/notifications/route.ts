import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { getApiUser } from '@/lib/auth/server'
import { createAdminClient } from '@/lib/supabase/admin'

function getRouteAdmin() {
  return createAdminClient()
}

export async function GET() {
  try {
    const user = await getApiUser()

    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { data: notifications, error } = await getRouteAdmin()
      .from('notifications')
      .select(`
        *,
        from_user:profiles!notifications_from_user_id_fkey(id, full_name, avatar_url)
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) {
      console.error('Error fetching notifications:', error)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    // Contar no leídas desde los datos ya obtenidos (evita segunda query)
    const unreadCount = (notifications || []).filter(n => !n.read).length

    return NextResponse.json({ notifications: notifications || [], unreadCount })
  } catch (error) {
    console.error('Error fetching notifications:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}

// Marcar notificaciones como leídas
export async function PATCH(request: Request) {
  try {
    const user = await getApiUser()

    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { notificationIds, markAll } = await request.json()

    if (markAll) {
      await getRouteAdmin()
        .from('notifications')
        .update({ read: true })
        .eq('user_id', user.id)
        .eq('read', false)
    } else if (notificationIds?.length) {
      await getRouteAdmin()
        .from('notifications')
        .update({ read: true })
        .eq('user_id', user.id)
        .in('id', notificationIds)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating notifications:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}

// Crear notificación (usado internamente) - usa service_role para bypass RLS
export async function POST(request: Request) {
  try {
    const user = await getApiUser()

    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const { user_id, type, title, message, link, comment_id, task_id, project_id } = body

    // No crear notificación si es para el mismo usuario
    if (user_id === user.id) {
      return NextResponse.json({ success: true, skipped: true })
    }

    // Usar service_role para crear notificaciones para otros usuarios
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    const { data: notification, error } = await supabaseAdmin
      .from('notifications')
      .insert({
        user_id,
        type,
        title,
        message,
        link,
        comment_id: comment_id || null,
        task_id: task_id || null,
        project_id: project_id || null,
        from_user_id: user.id,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating notification:', error)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ notification })
  } catch (error) {
    console.error('Error creating notification:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}

// Eliminar notificaciones (limpiar historial)
export async function DELETE(request: Request) {
  try {
    const user = await getApiUser()

    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const onlyRead = searchParams.get('onlyRead') === 'true'

    let query = getRouteAdmin()
      .from('notifications')
      .delete()
      .eq('user_id', user.id)

    if (onlyRead) {
      query = query.eq('read', true)
    }

    const { error } = await query

    if (error) {
      console.error('Error deleting notifications:', error)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting notifications:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
