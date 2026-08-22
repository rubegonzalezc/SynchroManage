import { createClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// GET - Obtener actividad reciente
export async function GET(request: Request) {
  try {
    const supabaseServer = await createServerClient()
    const { data: { user } } = await supabaseServer.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const parsedLimit = parseInt(searchParams.get('limit') || '10', 10)
    const limit = Number.isFinite(parsedLimit)
      ? Math.min(Math.max(parsedLimit, 1), 50)
      : 10
    const projectId = searchParams.get('project_id')
    const entityId = searchParams.get('entity_id')
    const entityType = searchParams.get('entity_type')

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    let query = supabaseAdmin
      .from('activity_log')
      .select(`
        *,
        user:profiles(id, full_name, avatar_url)
      `)
      .order('created_at', { ascending: false })
      .limit(limit)

    // Filtrar por entidad (p. ej. historial de una tarea)
    if (entityId && entityType) {
      query = query.eq('entity_type', entityType).eq('entity_id', entityId)
    } else if (projectId) {
      // Filtrar por proyecto si se especifica
      query = query.or(
        `and(entity_type.eq.project,entity_id.eq.${projectId}),details->>project_id.eq.${projectId}`
      )
    }

    const { data: activities, error } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ activities })
  } catch (error) {
    console.error('Error fetching activity:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}

// POST - Registrar actividad
export async function POST(request: Request) {
  try {
    const supabaseServer = await createServerClient()
    const { data: { user } } = await supabaseServer.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await request.json()

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    const { data: activity, error } = await supabaseAdmin
      .from('activity_log')
      .insert({
        user_id: user.id,
        action: body.action,
        entity_type: body.entity_type,
        entity_id: body.entity_id || null,
        entity_name: body.entity_name || null,
        details: body.details || null,
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ activity })
  } catch (error) {
    console.error('Error creating activity:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
