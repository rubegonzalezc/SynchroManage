import { createClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// GET - Obtener reuniones del usuario
export async function GET() {
  try {
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

    // Obtener IDs de reuniones donde el usuario es asistente
    const { data: attendeeRecords } = await supabaseAdmin
      .from('meeting_attendees')
      .select('meeting_id')
      .eq('user_id', user.id)

    const attendeeMeetingIds = attendeeRecords?.map(r => r.meeting_id) || []

    // Obtener reuniones donde el usuario es organizador o asistente
    let query = supabaseAdmin
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
      .gte('end_time', new Date().toISOString())
      .order('start_time', { ascending: true })

    // Filtrar por organizador o asistente
    if (attendeeMeetingIds.length > 0) {
      query = query.or(`organizer_id.eq.${user.id},id.in.(${attendeeMeetingIds.join(',')})`)
    } else {
      query = query.eq('organizer_id', user.id)
    }

    const { data: meetings, error } = await query

    if (error) {
      console.error('Error fetching meetings:', error)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ meetings })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}


// POST - Crear reunión
export async function POST(request: Request) {
  try {
    const supabaseServer = await createServerClient()
    const { data: { user } } = await supabaseServer.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const { title, description, project_id, start_time, end_time, meeting_link, attendee_ids } = body

    if (!title || !start_time || !end_time) {
      return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 })
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    // Crear la reunión
    const { data: meeting, error: meetingError } = await supabaseAdmin
      .from('meetings')
      .insert({
        title,
        description,
        project_id: project_id || null,
        organizer_id: user.id,
        start_time,
        end_time,
        meeting_link,
      })
      .select()
      .single()

    if (meetingError) {
      return NextResponse.json({ error: meetingError.message }, { status: 400 })
    }

    // Añadir al organizador como asistente confirmado
    await supabaseAdmin.from('meeting_attendees').insert({
      meeting_id: meeting.id,
      user_id: user.id,
      response: 'in_person',
      responded_at: new Date().toISOString(),
    })

    // Añadir otros asistentes
    if (attendee_ids && attendee_ids.length > 0) {
      // Filtrar al organizador si está en la lista
      const otherAttendees = attendee_ids.filter((id: string) => id !== user.id)
      
      if (otherAttendees.length > 0) {
        const attendeesData = otherAttendees.map((userId: string) => ({
          meeting_id: meeting.id,
          user_id: userId,
          response: 'pending',
        }))

        await supabaseAdmin.from('meeting_attendees').insert(attendeesData)
      }

      // Obtener nombre del organizador
      const { data: organizer } = await supabaseAdmin
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .single()

      // Enviar notificaciones a los asistentes (excepto al organizador)
      if (otherAttendees.length > 0) {
        const notifications = otherAttendees.map((userId: string) => ({
          user_id: userId,
          type: 'meeting_invite',
          title: 'Nueva invitación a reunión',
          message: `${organizer?.full_name || 'Alguien'} te invitó a "${title}"`,
          link: '/my-tasks',
          meeting_id: meeting.id,
          from_user_id: user.id,
        }))

        await supabaseAdmin.from('notifications').insert(notifications)
      }
    }

    return NextResponse.json({ meeting }, { status: 201 })
  } catch (error) {
    console.error('Error creating meeting:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
