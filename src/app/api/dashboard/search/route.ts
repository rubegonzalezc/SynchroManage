import { createClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import type {
  DashboardSearchBug,
  DashboardSearchProject,
  DashboardSearchResponse,
  DashboardSearchTask,
  DashboardSearchUser,
} from '@/lib/types/search'
import {
  buildIlikePattern,
  emptySearchResponse,
  isSearchQueryValid,
  mergeSearchResultsById,
  normalizeSearchQuery,
  parseExactTaskNumber,
  parseSearchLimit,
} from '@/lib/utils/dashboard-search'
import {
  hasVisibleProjects,
  resolveVisibleProjectScope,
  type VisibleProjectScope,
} from '@/lib/utils/project-visibility'

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

function applyProjectScope<T extends { in: (column: string, values: string[]) => T }>(
  query: T,
  scope: VisibleProjectScope,
  column: string
): T | 'empty' {
  if (scope.mode === 'all') return query
  if (scope.projectIds.length === 0) return 'empty'
  return query.in(column, scope.projectIds)
}

function normalizeProjectRelation(raw: unknown): { id: string; name: string } | null {
  if (!raw) return null
  if (Array.isArray(raw)) {
    const item = raw[0]
    return item && typeof item === 'object' && 'id' in item && 'name' in item
      ? (item as { id: string; name: string })
      : null
  }
  if (typeof raw === 'object' && 'id' in raw && 'name' in raw) {
    return raw as { id: string; name: string }
  }
  return null
}

function normalizeSearchTask(row: Record<string, unknown>): DashboardSearchTask {
  return {
    id: String(row.id),
    task_number: (row.task_number as number | null) ?? null,
    title: String(row.title),
    status: String(row.status),
    project_id: String(row.project_id),
    project: normalizeProjectRelation(row.project),
  }
}

function normalizeSearchBug(row: Record<string, unknown>): DashboardSearchBug {
  return {
    id: String(row.id),
    title: String(row.title),
    status: String(row.status),
    severity: String(row.severity),
    project_id: String(row.project_id),
    project: normalizeProjectRelation(row.project),
  }
}

async function searchProjects(
  supabaseAdmin: ReturnType<typeof getSupabaseAdmin>,
  scope: VisibleProjectScope,
  ilikePattern: string,
  limit: number
): Promise<DashboardSearchProject[]> {
  let query = supabaseAdmin
    .from('projects')
    .select('id, name, status, type')
    .ilike('name', ilikePattern)
    .order('name', { ascending: true })
    .limit(limit)

  const scopedQuery = applyProjectScope(query, scope, 'id')
  if (scopedQuery === 'empty') return []

  const { data, error } = await scopedQuery
  if (error) throw new Error(error.message)
  return (data ?? []) as DashboardSearchProject[]
}

async function searchTasks(
  supabaseAdmin: ReturnType<typeof getSupabaseAdmin>,
  scope: VisibleProjectScope,
  queryText: string,
  ilikePattern: string,
  limit: number
): Promise<DashboardSearchTask[]> {
  const exactTaskNumber = parseExactTaskNumber(queryText)
  const select = 'id, task_number, title, status, project_id, project:projects(id, name)'

  let byTitleQuery = supabaseAdmin
    .from('tasks')
    .select(select)
    .ilike('title', ilikePattern)
    .order('task_number', { ascending: true })
    .limit(limit)

  const scopedByTitle = applyProjectScope(byTitleQuery, scope, 'project_id')
  if (scopedByTitle === 'empty') return []

  const { data: byTitle, error: titleError } = await scopedByTitle
  if (titleError) throw new Error(titleError.message)

  if (exactTaskNumber == null) {
    return (byTitle ?? []).map((row) => normalizeSearchTask(row as Record<string, unknown>))
  }

  let byNumberQuery = supabaseAdmin
    .from('tasks')
    .select(select)
    .eq('task_number', exactTaskNumber)
    .order('task_number', { ascending: true })
    .limit(limit)

  const scopedByNumber = applyProjectScope(byNumberQuery, scope, 'project_id')
  if (scopedByNumber === 'empty') {
    return (byTitle ?? []).map((row) => normalizeSearchTask(row as Record<string, unknown>))
  }

  const { data: byNumber, error: numberError } = await scopedByNumber
  if (numberError) throw new Error(numberError.message)

  return mergeSearchResultsById(
    (byTitle ?? []).map((row) => normalizeSearchTask(row as Record<string, unknown>)),
    (byNumber ?? []).map((row) => normalizeSearchTask(row as Record<string, unknown>)),
    limit
  )
}

async function searchBugs(
  supabaseAdmin: ReturnType<typeof getSupabaseAdmin>,
  scope: VisibleProjectScope,
  ilikePattern: string,
  limit: number
): Promise<DashboardSearchBug[]> {
  let query = supabaseAdmin
    .from('bugs')
    .select('id, title, status, severity, project_id, project:projects(id, name)')
    .ilike('title', ilikePattern)
    .order('created_at', { ascending: false })
    .limit(limit)

  const scopedQuery = applyProjectScope(query, scope, 'project_id')
  if (scopedQuery === 'empty') return []

  const { data, error } = await scopedQuery
  if (error) throw new Error(error.message)
  return (data ?? []).map((row) => normalizeSearchBug(row as Record<string, unknown>))
}

async function searchUsers(
  supabaseAdmin: ReturnType<typeof getSupabaseAdmin>,
  ilikePattern: string,
  limit: number
): Promise<DashboardSearchUser[]> {
  const select = 'id, full_name, email, avatar_url'

  const [byNameResult, byEmailResult] = await Promise.all([
    supabaseAdmin
      .from('profiles')
      .select(select)
      .ilike('full_name', ilikePattern)
      .order('full_name', { ascending: true })
      .limit(limit),
    supabaseAdmin
      .from('profiles')
      .select(select)
      .ilike('email', ilikePattern)
      .order('full_name', { ascending: true })
      .limit(limit),
  ])

  if (byNameResult.error) throw new Error(byNameResult.error.message)
  if (byEmailResult.error) throw new Error(byEmailResult.error.message)

  return mergeSearchResultsById(
    (byNameResult.data ?? []) as DashboardSearchUser[],
    (byEmailResult.data ?? []) as DashboardSearchUser[],
    limit
  )
}

/** Búsqueda unificada para command palette e integraciones (HU-02). */
export async function GET(request: Request) {
  try {
    const supabaseServer = await createServerClient()
    const {
      data: { user },
    } = await supabaseServer.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const url = new URL(request.url)
    const queryText = normalizeSearchQuery(url.searchParams.get('q'))
    const limit = parseSearchLimit(url.searchParams.get('limit'))

    if (!isSearchQueryValid(queryText)) {
      return NextResponse.json(emptySearchResponse())
    }

    const { data: profile } = await supabaseServer
      .from('profiles')
      .select('role:roles(name)')
      .eq('id', user.id)
      .single()

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const roleName = (profile?.role as any)?.name as string | undefined

    const supabaseAdmin = getSupabaseAdmin()
    const scope = await resolveVisibleProjectScope(supabaseAdmin, user.id, roleName)
    const ilikePattern = buildIlikePattern(queryText)

    const usersPromise = searchUsers(supabaseAdmin, ilikePattern, limit)

    if (!hasVisibleProjects(scope)) {
      const users = await usersPromise
      const response: DashboardSearchResponse = {
        tasks: [],
        projects: [],
        bugs: [],
        users,
      }
      return NextResponse.json(response)
    }

    const [projects, tasks, bugs, users] = await Promise.all([
      searchProjects(supabaseAdmin, scope, ilikePattern, limit),
      searchTasks(supabaseAdmin, scope, queryText, ilikePattern, limit),
      searchBugs(supabaseAdmin, scope, ilikePattern, limit),
      usersPromise,
    ])

    const response: DashboardSearchResponse = {
      tasks,
      projects,
      bugs,
      users,
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error in dashboard search:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
