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

export function normalizeSprintOrder(value: unknown): number | null {
  if (value == null) return null
  const order = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(order) || order <= 0 || !Number.isInteger(order)) return null
  return order
}

export function formatSprintHuLabel(sprintOrder: number | null | undefined): string | null {
  const order = normalizeSprintOrder(sprintOrder)
  if (order == null) return null
  return `HU-${order}`
}

export interface SprintNameRef {
  id: string
  name: string
  order_index?: number
}

export function resolveSprintName(
  sprintId: string | null | undefined,
  sprints: SprintNameRef[]
): string | null {
  if (!sprintId) return null
  return sprints.find((sprint) => sprint.id === sprintId)?.name ?? null
}

export function formatSprintNumberLabel(orderIndex: number): string {
  return `Sprint ${orderIndex + 1}`
}

/** Etiqueta corta para daily: `Sprint N` según order_index, no el nombre descriptivo del sprint. */
export function resolveSprintDisplayLabel(
  sprintId: string | null | undefined,
  sprints: SprintNameRef[],
  sprintName?: string | null
): string | null {
  if (!sprintId && !sprintName) return null

  const sprint = sprintId ? sprints.find((item) => item.id === sprintId) : undefined
  const name = sprintName ?? sprint?.name

  if (sprint?.order_index != null && sprint.order_index >= 0) {
    return formatSprintNumberLabel(sprint.order_index)
  }

  if (name) {
    const match = name.match(/^Sprint\s+(\d+)/i)
    if (match) return `Sprint ${match[1]}`
    return name
  }

  return null
}

/** Etiqueta local de sprint: `Sprint 1 · HU-3` o solo `Sprint 1` si no hay orden. */
export function formatSprintTaskReferenceLabel(options: {
  sprintId?: string | null
  sprintName?: string | null
  sprintOrder?: number | null
  sprints?: SprintNameRef[]
  taskNumber?: number | null
  /** Incluir #global en la etiqueta cuando no hay sprint_order (p. ej. sin # aparte). */
  includeGlobalWhenNoOrder?: boolean
}): string | null {
  const sprintLabel = resolveSprintDisplayLabel(
    options.sprintId,
    options.sprints ?? [],
    options.sprintName
  )

  if (!sprintLabel) return null

  const hu = formatSprintHuLabel(options.sprintOrder)
  if (hu) return `${sprintLabel} · ${hu}`

  if (options.includeGlobalWhenNoOrder && options.taskNumber != null) {
    return `#${options.taskNumber} · ${sprintLabel}`
  }

  return sprintLabel
}

export function formatCarryOverLabel(
  carryOverSprintOrder: number | null | undefined
): string | null {
  const hu = formatSprintHuLabel(carryOverSprintOrder)
  if (!hu) return null
  return `Sprint anterior ${hu}`
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

export interface CarryOverTaskRef {
  id: string
  sprint_order: number | null
}

/** Mueve tareas pendientes al siguiente sprint o backlog con carry-over y nuevo orden. */
export async function assignCarryOverTasks(
  supabaseAdmin: SupabaseAdmin,
  options: {
    tasks: CarryOverTaskRef[]
    nextSprintId: string | null
  }
): Promise<void> {
  const { tasks, nextSprintId } = options
  if (tasks.length === 0) return

  const now = new Date().toISOString()

  if (!nextSprintId) {
    for (const task of tasks) {
      const { error } = await supabaseAdmin
        .from('tasks')
        .update({
          sprint_id: null,
          sprint_order: null,
          is_carry_over: true,
          carry_over_sprint_order: task.sprint_order,
          updated_at: now,
        })
        .eq('id', task.id)

      if (error) throw new Error(error.message)
    }
    return
  }

  let nextOrder = await getNextSprintOrder(supabaseAdmin, nextSprintId)

  for (const task of tasks) {
    const { error } = await supabaseAdmin
      .from('tasks')
      .update({
        sprint_id: nextSprintId,
        sprint_order: nextOrder,
        is_carry_over: true,
        carry_over_sprint_order: task.sprint_order,
        updated_at: now,
      })
      .eq('id', task.id)

    if (error) throw new Error(error.message)
    nextOrder++
  }
}
