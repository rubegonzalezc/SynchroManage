import { createClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// GET - Obtener tareas asignadas al usuario actual con datos de sprint y proyecto
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

    const { data: assigneeRecords, error } = await supabaseAdmin
      .from('task_assignees')
      .select(`
        task:tasks(
          id,
          task_number,
          title,
          description,
          status,
          priority,
          category,
          due_date,
          created_at,
          sprint_id,
          is_carry_over,
          project:projects(id, name, status, type, company:companies(id, name)),
          sprint:sprints(id, name, status)
        )
      `)
      .eq('user_id', user.id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    // Extraer las tareas del join, filtrar nulos y ordenar por fecha de creación desc
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const tasks = (assigneeRecords || [])
      .map((r: any) => r.task)
      .filter(Boolean)
      .sort((a: { created_at: string }, b: { created_at: string }) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )

    return NextResponse.json({ tasks })
  } catch (error) {
    console.error('Error fetching my tasks:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
