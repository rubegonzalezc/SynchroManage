import { createClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { unstable_cache, revalidateTag } from 'next/cache'
import { NextResponse } from 'next/server'

function supabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

function getCachedSprints(projectId: string) {
  return unstable_cache(
    async () => {
      const admin = supabaseAdmin()
      const { data: sprints, error } = await admin
        .from('sprints')
        .select(`
          id, name, goal, start_date, end_date, status, order_index, created_at,
          tasks:tasks(id, status, is_carry_over)
        `)
        .eq('project_id', projectId)
        .order('order_index', { ascending: true })
        .order('created_at', { ascending: true })

      if (error) throw new Error(error.message)
      return sprints || []
    },
    [`sprints-${projectId}`],
    { tags: [`sprints-${projectId}`, `project-${projectId}`], revalidate: 60 }
  )()
}

// GET - Listar sprints de un proyecto
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabaseServer = await createServerClient()
    const { data: { user } } = await supabaseServer.auth.getUser()
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const sprints = await getCachedSprints(id)
    return NextResponse.json({ sprints })
  } catch (err) {
    console.error('Error fetching sprints:', err)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}

// POST - Crear sprint
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabaseServer = await createServerClient()
    const { data: { user } } = await supabaseServer.auth.getUser()
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    // Verificar rol: solo admin o pm
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

    const body = await request.json()
    const admin = supabaseAdmin()

    // Calcular order_index: máximo actual + 1
    const { data: lastSprint } = await admin
      .from('sprints')
      .select('order_index')
      .eq('project_id', id)
      .order('order_index', { ascending: false })
      .limit(1)
      .single()

    const orderIndex = (lastSprint?.order_index ?? -1) + 1

    const { data: sprint, error } = await admin
      .from('sprints')
      .insert({
        project_id: id,
        name: body.name,
        goal: body.goal || null,
        start_date: body.start_date,
        end_date: body.end_date,
        order_index: orderIndex,
        created_by: user.id,
      })
      .select('id, name, goal, start_date, end_date, status, order_index, created_at')
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })

    revalidateTag(`sprints-${id}`, 'max')
    revalidateTag(`project-${id}`, 'max')

    return NextResponse.json({ sprint }, { status: 201 })
  } catch (err) {
    console.error('Error creating sprint:', err)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
