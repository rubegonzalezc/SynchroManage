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

async function getRole(supabaseServer: Awaited<ReturnType<typeof createServerClient>>, userId: string) {
  const { data } = await supabaseServer.from('profiles').select('role:roles(name)').eq('id', userId).single()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data?.role as any)?.name as string | undefined
}

// PATCH - Actualizar sprint (nombre, objetivo, fechas)
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabaseServer = await createServerClient()
    const { data: { user } } = await supabaseServer.auth.getUser()
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const role = await getRole(supabaseServer, user.id)
    if (!role || !['admin', 'pm'].includes(role)) {
      return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
    }

    const body = await request.json()
    const admin = supabaseAdmin()

    const { data: sprint, error } = await admin
      .from('sprints')
      .update({
        name: body.name,
        goal: body.goal ?? null,
        start_date: body.start_date,
        end_date: body.end_date,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select('id, name, goal, start_date, end_date, status, order_index, project_id')
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })

    revalidateTag(`sprints-${sprint.project_id}`)
    revalidateTag(`project-${sprint.project_id}`)

    return NextResponse.json({ sprint })
  } catch (err) {
    console.error('Error updating sprint:', err)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}

// DELETE - Eliminar sprint (solo si está en planning)
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabaseServer = await createServerClient()
    const { data: { user } } = await supabaseServer.auth.getUser()
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const role = await getRole(supabaseServer, user.id)
    if (!role || !['admin', 'pm'].includes(role)) {
      return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
    }

    const admin = supabaseAdmin()

    const { data: sprint } = await admin.from('sprints').select('status, project_id').eq('id', id).single()
    if (sprint?.status !== 'planning') {
      return NextResponse.json({ error: 'Solo se pueden eliminar sprints en estado planificación' }, { status: 400 })
    }

    await admin.from('tasks').update({ sprint_id: null }).eq('sprint_id', id)

    const { error } = await admin.from('sprints').delete().eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 400 })

    revalidateTag(`sprints-${sprint.project_id}`)
    revalidateTag(`project-${sprint.project_id}`)

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Error deleting sprint:', err)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
