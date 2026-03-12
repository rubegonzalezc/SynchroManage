import { createClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// GET - Obtener detalle de reunión
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

    const { data: meeting, error } = await supabaseAdmin
      .from('meetings')
      .select(`
        id,
        title,
        description,
        start_time,
        end_time,
        meeting_link,
        created_at,
        project:projects(id, name),
        organizer:profiles!meetings_organizer_id_fkey(id, full_name, avatar_url),
        attendees:meeting_attendees(
          id,
          response,
          responded_at,
          user:profiles(id, full_name, avatar_url)
        )
      `)
      .eq('id', id)
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ meeting })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}

// PUT - Actualizar respuesta de asistencia o editar reunión
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
    const { response, title, description, start_time, end_time, meeting_link, project_id } = body

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    // Si es una actualización de respuesta de asistencia
    if (response !== undefined) {
      if (!['pending', 'in_person', 'virtual', 'declined', 'maybe'].includes(response)) {
        return NextResponse.json({ error: 'Respuesta inválida' }, { status: 400 })
      }

      // Actualizar respuesta del asistente
      const { error } = await supabaseAdmin
        .from('meeting_attendees')
        .update({ response, responded_at: new Date().toISOString() })
        .eq('meeting_id', id)
        .eq('user_id', user.id)

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 })
      }

      // Notificar al organizador
      const { data: meeting } = await supabaseAdmin
        .from('meetings')
        .select('organizer_id, title')
        .eq('id', id)
        .single()

      const { data: responder } = await supabaseAdmin
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .single()

      const responseLabels: Record<string, string> = {
        in_person: 'asistirá presencialmente',
        virtual: 'asistirá virtualmente',
        declined: 'no asistirá',
        maybe: 'no está seguro si asistirá',
      }

      if (meeting && response !== 'pending') {
        await supabaseAdmin.from('notifications').insert({
          user_id: meeting.organizer_id,
          type: 'meeting_response',
          title: 'Respuesta a invitación',
          message: `${responder?.full_name || 'Alguien'} ${responseLabels[response]} a "${meeting.title}"`,
          link: '/my-tasks',
          meeting_id: id,
          from_user_id: user.id,
        })
      }

      return NextResponse.json({ success: true })
    }

    // Si es una edición de la reunión (solo el organizador)
    const { data: meeting } = await supabaseAdmin
      .from('meetings')
      .select('organizer_id, title, attendees:meeting_attendees(user_id)')
      .eq('id', id)
      .single()

    if (!meeting || meeting.organizer_id !== user.id) {
      return NextResponse.json({ error: 'No autorizado para editar esta reunión' }, { status: 403 })
    }

    // Actualizar la reunión
    const updateData: Record<string, unknown> = {}
    if (title !== undefined) updateData.title = title
    if (description !== undefined) updateData.description = description
    if (start_time !== undefined) updateData.start_time = start_time
    if (end_time !== undefined) updateData.end_time = end_time
    if (meeting_link !== undefined) updateData.meeting_link = meeting_link
    if (project_id !== undefined) updateData.project_id = project_id || null

    const { error: updateError } = await supabaseAdmin
      .from('meetings')
      .update(updateData)
      .eq('id', id)

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 400 })
    }

    // Obtener nombre del organizador
    const { data: organizer } = await supabaseAdmin
      .from('profiles')
      .select('full_name')
      .eq('id', user.id)
      .single()

    // Notificar a todos los participantes (excepto al organizador)
    const attendeeIds = (meeting.attendees || [])
      .map((a: { user_id: string }) => a.user_id)
      .filter((attendeeId: string) => attendeeId !== user.id)

    if (attendeeIds.length > 0) {
      const notifications = attendeeIds.map((attendeeId: string) => ({
        user_id: attendeeId,
        type: 'meeting_updated',
        title: 'Reunión actualizada',
        message: `${organizer?.full_name || 'El organizador'} actualizó la reunión "${title || meeting.title}"`,
        link: '/my-tasks',
        meeting_id: id,
        from_user_id: user.id,
      }))

      await supabaseAdmin.from('notifications').insert(notifications)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}

// DELETE - Eliminar reunión
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

    // Verificar que el usuario es el organizador y obtener datos para notificación
    const { data: meeting } = await supabaseAdmin
      .from('meetings')
      .select('organizer_id, title, attendees:meeting_attendees(user_id)')
      .eq('id', id)
      .single()

    if (!meeting || meeting.organizer_id !== user.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    // Obtener nombre del organizador
    const { data: organizer } = await supabaseAdmin
      .from('profiles')
      .select('full_name')
      .eq('id', user.id)
      .single()

    // Notificar a todos los participantes (excepto al organizador) antes de eliminar
    const attendeeIds = (meeting.attendees || [])
      .map((a: { user_id: string }) => a.user_id)
      .filter((attendeeId: string) => attendeeId !== user.id)

    if (attendeeIds.length > 0) {
      const notifications = attendeeIds.map((attendeeId: string) => ({
        user_id: attendeeId,
        type: 'meeting_cancelled',
        title: 'Reunión cancelada',
        message: `${organizer?.full_name || 'El organizador'} canceló la reunión "${meeting.title}"`,
        link: '/my-tasks',
        from_user_id: user.id,
      }))

      await supabaseAdmin.from('notifications').insert(notifications)
    }

    // Eliminar la reunión (los attendees se eliminan por CASCADE)
    const { error } = await supabaseAdmin
      .from('meetings')
      .delete()
      .eq('id', id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
