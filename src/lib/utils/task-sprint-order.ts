// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SupabaseAdmin = any

export type SprintOrderUpdateAction = 'clear' | 'assign' | 'unchanged'

/** Determina si hay que recalcular sprint_order al cambiar sprint_id. */
export function getSprintOrderUpdateAction(
  currentSprintId: string | null | undefined,
  newSprintId: string | null | undefined
): SprintOrderUpdateAction {
  const current = currentSprintId ?? null
  const next = newSprintId ?? null

  if (next === current) return 'unchanged'
  if (next === null) return 'clear'
  return 'assign'
}

/** Siguiente orden disponible en un sprint (MAX + 1). No recompacta huecos. */
export async function getNextSprintOrder(
  supabaseAdmin: SupabaseAdmin,
  sprintId: string
): Promise<number> {
  const { data, error } = await supabaseAdmin
    .from('tasks')
    .select('sprint_order')
    .eq('sprint_id', sprintId)
    .not('sprint_order', 'is', null)
    .order('sprint_order', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) {
    throw new Error(error.message)
  }

  return (data?.sprint_order ?? 0) + 1
}

export async function resolveSprintOrderForUpdate(
  supabaseAdmin: SupabaseAdmin,
  options: {
    currentSprintId: string | null | undefined
    newSprintId: string | null | undefined
  }
): Promise<number | null | undefined> {
  const action = getSprintOrderUpdateAction(
    options.currentSprintId,
    options.newSprintId
  )

  if (action === 'unchanged') return undefined
  if (action === 'clear') return null

  return getNextSprintOrder(supabaseAdmin, options.newSprintId as string)
}
