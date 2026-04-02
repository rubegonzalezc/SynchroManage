import { createClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { revalidateTag } from 'next/cache'
import { NextResponse } from 'next/server'

function supabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

// POST - Iniciar sprint: planning → active (solo 1 activo por proyecto a la vez)
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabaseServer = await createServerClient()
    const { data: { user } } = await supabaseServer.auth.getUser()
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const { data: profile } = await supabaseServer
      .from('profiles')
      .select('role:roles(name)')
      .eq('id', user.id)
      .single()

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const roleName = (profile?.role as any)?.name
    if (!['admin', 'pm'].includes(roleName)) {
      return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
    }

    const admin = supabaseAdmin()

    const { data: sprint, error: fetchError } = await admin
      .from('sprints')
      .select('id, project_id, status')
      .eq('id', id)
      .single()

    if (fetchError || !sprint) {
      return NextResponse.json({ error: 'Sprint no encontrado' }, { status: 404 })
    }

    if (sprint.status !== 'planning') {
      return NextResponse.json({ error: 'Solo se puede iniciar un sprint en planificación' }, { status: 400 })
    }

    const { data: activeSprint } = await admin
      .from('sprints')
      .select('id, name')
      .eq('project_id', sprint.project_id)
      .eq('status', 'active')
      .single()

    if (activeSprint) {
      return NextResponse.json(
        { error: `Ya existe un sprint activo: "${activeSprint.name}". Complétalo antes de iniciar otro.` },
        { status: 400 }
      )
    }

    const { data: updated, error } = await admin
      .from('sprints')
      .update({ status: 'active', updated_at: new Date().toISOString() })
      .eq('id', id)
      .select('id, name, goal, start_date, end_date, status, order_index')
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })

    revalidateTag(`sprints-${sprint.project_id}`)
    revalidateTag(`project-${sprint.project_id}`)

    return NextResponse.json({ sprint: updated })
  } catch (err) {
    console.error('Error starting sprint:', err)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
