import { createClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { unstable_cache } from 'next/cache'
import { NextResponse } from 'next/server'

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

async function fetchMyTasks(userId: string) {
  return unstable_cache(
    async () => {
      const supabaseAdmin = getSupabaseAdmin()

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
            complexity,
            branch_name,
            project:projects(id, name, status, type, company:companies(id, name)),
            sprint:sprints(id, name, goal, start_date, end_date, status, order_index)
          )
        `)
        .eq('user_id', userId)

      if (error) throw new Error(error.message)

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const tasks = (assigneeRecords || [])
        .map((r: any) => r.task)
        .filter(Boolean)
        .sort((a: { created_at: string }, b: { created_at: string }) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )

      const taskIds = tasks.map((t: { id: string }) => t.id)
      let bugCountByTask: Record<string, number> = {}
      if (taskIds.length > 0) {
        const { data: openBugs } = await supabaseAdmin
          .from('bugs')
          .select('task_id')
          .in('task_id', taskIds)
          .in('status', ['open', 'in_progress'])
        for (const bug of (openBugs || [])) {
          if (bug.task_id) bugCountByTask[bug.task_id] = (bugCountByTask[bug.task_id] || 0) + 1
        }
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return tasks.map((t: any) => ({ ...t, open_bugs_count: bugCountByTask[t.id] ?? 0 }))
    },
    [`my-tasks-${userId}`],
    { tags: [`my-tasks-${userId}`, 'tasks'], revalidate: 60 }
  )()
}

// GET - Obtener tareas asignadas al usuario actual con datos de sprint y proyecto
export async function GET() {
  try {
    const supabaseServer = await createServerClient()
    const { data: { user } } = await supabaseServer.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const tasks = await fetchMyTasks(user.id)
    return NextResponse.json({ tasks })
  } catch (error) {
    console.error('Error fetching my tasks:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
