import { createClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import {
  hasVisibleProjects,
  resolveVisibleProjectScope,
  type VisibleProjectScope,
} from '@/lib/utils/project-visibility'

const TRIAGE_ROLES = new Set(['admin', 'pm', 'tech_lead'])

function getAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function logActivity(admin: any, userId: string, action: string, entityId: string, entityName: string, projectId: string, details?: Record<string, unknown>) {
  try {
    await admin.from('activity_log').insert({
      user_id: userId,
      action,
      entity_type: 'bug',
      entity_id: entityId,
      entity_name: entityName,
      details: { project_id: projectId, ...details },
    })
  } catch (err) {
    console.error('Error logging activity:', err)
  }
}

const BUG_SELECT = `
  id, title, description, steps_to_reproduce, severity, status, sprint_id, task_id, assignee_id, created_at, updated_at,
  sprint:sprints(id, name, status),
  task:tasks(id, task_number, title),
  assignee:profiles!bugs_assignee_id_fkey(id, full_name, avatar_url),
  reporter:profiles!bugs_reporter_id_fkey(id, full_name, avatar_url),
  attachments(id, file_name, file_size, file_type, file_url, created_at,
    uploaded_by:profiles!attachments_uploaded_by_id_fkey(id, full_name, avatar_url)
  )
`

const GLOBAL_BUG_SELECT = `
  id, project_id, title, severity, status, created_at, updated_at,
  project:projects(id, name),
  task:tasks(id, task_number, title),
  assignee:profiles!bugs_assignee_id_fkey(id, full_name, avatar_url)
`

function applyProjectScope<T extends { in: (column: string, values: string[]) => T }>(
  query: T,
  scope: VisibleProjectScope,
  column: string
): T | 'empty' {
  if (scope.mode === 'all') return query
  if (scope.projectIds.length === 0) return 'empty'
  return query.in(column, scope.projectIds)
}

async function getGlobalBugs(
  admin: ReturnType<typeof getAdmin>,
  scope: VisibleProjectScope,
  filters: {
    severity?: string | null
    status?: string | null
    projectId?: string | null
    assigneeId?: string | null
  }
) {
  let query = admin.from('bugs').select(GLOBAL_BUG_SELECT).order('created_at', { ascending: false })

  const scoped = applyProjectScope(query, scope, 'project_id')
  if (scoped === 'empty') return []

  query = scoped

  if (filters.projectId) {
    if (scope.mode === 'ids' && !scope.projectIds.includes(filters.projectId)) {
      return []
    }
    query = query.eq('project_id', filters.projectId)
  }

  if (filters.severity) query = query.eq('severity', filters.severity)
  if (filters.status) query = query.eq('status', filters.status)

  if (filters.assigneeId === 'unassigned') {
    query = query.is('assignee_id', null)
  } else if (filters.assigneeId) {
    query = query.eq('assignee_id', filters.assigneeId)
  }

  const { data: bugs, error } = await query
  if (error) throw new Error(error.message)
  return bugs || []
}

// GET - Listar bugs de un proyecto o vista global de triage
export async function GET(request: Request) {
  try {
    const supabaseServer = await createServerClient()
    const { data: { user } } = await supabaseServer.auth.getUser()
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const url = new URL(request.url)
    const projectId = url.searchParams.get('project_id')

    if (!projectId) {
      const { data: profile } = await supabaseServer
        .from('profiles')
        .select('role:roles(name)')
        .eq('id', user.id)
        .single()

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const roleName = (profile?.role as any)?.name as string | undefined
      if (!roleName || !TRIAGE_ROLES.has(roleName)) {
        return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
      }

      const admin = getAdmin()
      const scope = await resolveVisibleProjectScope(admin, user.id, roleName)

      if (!hasVisibleProjects(scope)) {
        return NextResponse.json({ bugs: [] })
      }

      const bugs = await getGlobalBugs(admin, scope, {
        severity: url.searchParams.get('severity'),
        status: url.searchParams.get('status'),
        projectId: url.searchParams.get('project_id_filter'),
        assigneeId: url.searchParams.get('assignee_id'),
      })

      return NextResponse.json({ bugs })
    }

    const admin = getAdmin()
    const { data: bugs, error } = await admin
      .from('bugs')
      .select(BUG_SELECT)
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json({ bugs: bugs || [] })
  } catch (err) {
    console.error('Error fetching bugs:', err)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}

// POST - Crear bug
export async function POST(request: Request) {
  try {
    const supabaseServer = await createServerClient()
    const { data: { user } } = await supabaseServer.auth.getUser()
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const body = await request.json()
    const { project_id, title, description, steps_to_reproduce, severity, sprint_id, task_id, assignee_id } = body

    if (!project_id || !title) {
      return NextResponse.json({ error: 'project_id y title son requeridos' }, { status: 400 })
    }

    const admin = getAdmin()
    const { data: bug, error } = await admin
      .from('bugs')
      .insert({
        project_id,
        title,
        description: description || null,
        steps_to_reproduce: steps_to_reproduce || null,
        severity: severity || 'medium',
        status: 'open',
        sprint_id: sprint_id || null,
        task_id: task_id || null,
        assignee_id: assignee_id || null,
        reporter_id: user.id,
      })
      .select(BUG_SELECT)
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })

    // Auditoría: creación
    await logActivity(admin, user.id, 'created', bug.id, title, project_id, {
      severity: severity || 'medium',
      assignee_id: assignee_id || null,
    })

    // Notificación al asignado
    if (assignee_id && assignee_id !== user.id) {
      // Obtener nombre del reporter
      const { data: reporter } = await admin.from('profiles').select('full_name').eq('id', user.id).single()
      await admin.from('notifications').insert({
        user_id: assignee_id,
        from_user_id: user.id,
        type: 'task_assigned',
        title: 'Bug asignado',
        message: `${reporter?.full_name || 'Alguien'} te asignó el bug "${title}"`,
        link: `/projects/${project_id}?tab=bugs`,
        project_id,
      })
    }

    return NextResponse.json({ bug }, { status: 201 })
  } catch (err) {
    console.error('Error creating bug:', err)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
