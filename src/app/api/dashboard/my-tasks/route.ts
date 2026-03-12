import { createClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// GET - Obtener tareas asignadas al usuario actual
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

    // Query task_assignees to find all tasks assigned to the current user
    const { data: assigneeRecords, error: assigneesError } = await supabaseAdmin
      .from('task_assignees')
      .select('task_id')
      .eq('user_id', user.id)

    if (assigneesError) {
      return NextResponse.json({ error: assigneesError.message }, { status: 400 })
    }

    const taskIds = (assigneeRecords || []).map((r: { task_id: string }) => r.task_id)

    // If no tasks assigned, return empty array
    if (taskIds.length === 0) {
      return NextResponse.json({ tasks: [] })
    }

    // Fetch the full task data for those task IDs
    const { data: tasks, error } = await supabaseAdmin
      .from('tasks')
      .select(`
        id,
        task_number,
        title,
        description,
        status,
        priority,
        category,
        due_date,
        created_at,
        project:projects(id, name, status)
      `)
      .in('id', taskIds)
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ tasks })
  } catch (error) {
    console.error('Error fetching my tasks:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
