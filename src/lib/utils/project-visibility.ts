// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SupabaseAdmin = any

export type VisibleProjectScope =
  | { mode: 'all' }
  | { mode: 'ids'; projectIds: string[] }

/** IDs de proyectos visibles según rol (misma lógica que GET /api/dashboard/projects). */
export async function resolveVisibleProjectScope(
  supabaseAdmin: SupabaseAdmin,
  userId: string,
  roleName: string | undefined
): Promise<VisibleProjectScope> {
  if (roleName === 'admin') {
    return { mode: 'all' }
  }

  if (!roleName) {
    return { mode: 'ids', projectIds: [] }
  }

  if (roleName === 'pm') {
    const { data, error } = await supabaseAdmin
      .from('projects')
      .select('id')
      .eq('pm_id', userId)

    if (error) throw new Error(error.message)
    return { mode: 'ids', projectIds: (data ?? []).map((row: { id: string }) => row.id) }
  }

  if (roleName === 'tech_lead') {
    const { data: memberProjects, error: memberError } = await supabaseAdmin
      .from('project_members')
      .select('project_id')
      .eq('user_id', userId)

    if (memberError) throw new Error(memberError.message)

    const memberProjectIds = (memberProjects ?? []).map((row: { project_id: string }) => row.project_id)

    const { data: leadProjects, error: leadError } = await supabaseAdmin
      .from('projects')
      .select('id')
      .eq('tech_lead_id', userId)

    if (leadError) throw new Error(leadError.message)

    const projectIds = [
      ...new Set([
        ...(leadProjects ?? []).map((row: { id: string }) => row.id),
        ...memberProjectIds,
      ]),
    ]

    return { mode: 'ids', projectIds }
  }

  if (roleName === 'developer' || roleName === 'stakeholder') {
    const { data: memberProjects, error } = await supabaseAdmin
      .from('project_members')
      .select('project_id')
      .eq('user_id', userId)

    if (error) throw new Error(error.message)

    return {
      mode: 'ids',
      projectIds: (memberProjects ?? []).map((row: { project_id: string }) => row.project_id),
    }
  }

  return { mode: 'ids', projectIds: [] }
}

export function hasVisibleProjects(scope: VisibleProjectScope): boolean {
  return scope.mode === 'all' || scope.projectIds.length > 0
}
