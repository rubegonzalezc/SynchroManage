export interface TaskDependencyRef {
  id: string
  task_number: number | null
  title: string
  status: string
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SupabaseAdmin = any

/** Supabase puede devolver la relación como objeto, array o null. */
export function normalizeDependsOn(
  raw: unknown,
  dependsOnTaskId?: string | null
): TaskDependencyRef | null {
  if (!dependsOnTaskId) return null

  if (Array.isArray(raw)) {
    const item = raw.find(
      (entry): entry is TaskDependencyRef =>
        !!entry && typeof entry === 'object' && 'id' in entry && typeof (entry as TaskDependencyRef).title === 'string'
    )
    return item ?? null
  }

  if (raw && typeof raw === 'object' && 'id' in raw && 'title' in raw) {
    const task = raw as TaskDependencyRef
    return task.title ? task : null
  }

  return null
}

export function formatDependencyLabel(
  task: Pick<TaskDependencyRef, 'task_number' | 'title'>
): string {
  const parts: string[] = []
  if (task.task_number != null) parts.push(`#${task.task_number}`)
  if (task.title) parts.push(task.title)
  return parts.join(' ')
}

export const ADVANCED_TASK_STATUSES = ['in_progress', 'review', 'done'] as const

export type AdvancedTaskStatus = (typeof ADVANCED_TASK_STATUSES)[number]

export function isAdvancedTaskStatus(status: string): status is AdvancedTaskStatus {
  return (ADVANCED_TASK_STATUSES as readonly string[]).includes(status)
}

export function formatBlockedByDependencyMessage(
  dependencies: Array<Pick<TaskDependencyRef, 'task_number' | 'title'>>
): string {
  if (dependencies.length === 0) {
    return 'No puedes avanzar esta tarea hasta completar sus dependencias'
  }

  if (dependencies.length === 1) {
    return `No puedes avanzar esta tarea hasta completar ${formatDependencyLabel(dependencies[0])}`
  }

  const labels = dependencies.map((dep) => formatDependencyLabel(dep))
  const last = labels.pop()
  return `No puedes avanzar esta tarea hasta completar ${labels.join(', ')} y ${last}`
}

export function normalizeDependsOnTaskIds(body: {
  depends_on_task_ids?: unknown
  depends_on_task_id?: string | null
}): string[] | undefined {
  if (Array.isArray(body.depends_on_task_ids)) {
    return [...new Set(body.depends_on_task_ids.filter((id): id is string => typeof id === 'string' && id.length > 0))]
  }

  if ('depends_on_task_id' in body) {
    const single = body.depends_on_task_id
    return single ? [single] : []
  }

  return undefined
}

export async function fetchTaskDependencyIds(
  supabaseAdmin: SupabaseAdmin,
  taskId: string
): Promise<string[]> {
  const { data, error } = await supabaseAdmin
    .from('task_dependencies')
    .select('depends_on_task_id')
    .eq('task_id', taskId)
    .order('created_at', { ascending: true })

  if (error) {
    console.error('Error fetching task dependencies:', error)
    return []
  }

  return (data || []).map((row: { depends_on_task_id: string }) => row.depends_on_task_id)
}

export async function fetchTaskDependencyRefs(
  supabaseAdmin: SupabaseAdmin,
  taskId: string
): Promise<TaskDependencyRef[]> {
  const dependencyIds = await fetchTaskDependencyIds(supabaseAdmin, taskId)
  if (dependencyIds.length === 0) return []

  const { data, error } = await supabaseAdmin
    .from('tasks')
    .select('id, task_number, title, status')
    .in('id', dependencyIds)

  if (error || !data) return []

  const byId = new Map(data.map((task: TaskDependencyRef) => [task.id, task]))
  return dependencyIds
    .map((id) => byId.get(id))
    .filter((task): task is TaskDependencyRef => !!task)
}

export async function fetchProjectDependencyMap(
  supabaseAdmin: SupabaseAdmin,
  projectId: string
): Promise<Map<string, string[]>> {
  const { data: projectTasks } = await supabaseAdmin
    .from('tasks')
    .select('id')
    .eq('project_id', projectId)

  const taskIds = (projectTasks || []).map((task: { id: string }) => task.id)
  if (taskIds.length === 0) return new Map()

  const { data, error } = await supabaseAdmin
    .from('task_dependencies')
    .select('task_id, depends_on_task_id')
    .in('task_id', taskIds)
    .order('created_at', { ascending: true })

  if (error || !data) return new Map()

  const map = new Map<string, string[]>()
  for (const row of data as Array<{ task_id: string; depends_on_task_id: string }>) {
    const current = map.get(row.task_id) || []
    current.push(row.depends_on_task_id)
    map.set(row.task_id, current)
  }

  return map
}

async function dependencyReachable(
  supabaseAdmin: SupabaseAdmin,
  startTaskId: string,
  targetTaskId: string,
  cache: Map<string, string[]>
): Promise<boolean> {
  const visited = new Set<string>()
  const queue = [startTaskId]

  while (queue.length > 0) {
    const current = queue.shift()!
    if (current === targetTaskId) return true
    if (visited.has(current)) continue
    visited.add(current)

    let deps = cache.get(current)
    if (!deps) {
      deps = await fetchTaskDependencyIds(supabaseAdmin, current)
      cache.set(current, deps)
    }

    for (const depId of deps) {
      if (!visited.has(depId)) queue.push(depId)
    }
  }

  return false
}

export async function validateTaskDependencies(
  supabaseAdmin: SupabaseAdmin,
  options: {
    taskId: string | null
    dependsOnTaskIds: string[]
    projectId: string
  }
): Promise<string | null> {
  const { taskId, dependsOnTaskIds, projectId } = options
  const uniqueIds = [...new Set(dependsOnTaskIds)]

  if (uniqueIds.length === 0) return null

  if (taskId && uniqueIds.includes(taskId)) {
    return 'Una tarea no puede depender de sí misma'
  }

  const { data: depTasks, error } = await supabaseAdmin
    .from('tasks')
    .select('id, project_id')
    .in('id', uniqueIds)

  if (error || !depTasks || depTasks.length !== uniqueIds.length) {
    return 'Una o más tareas de dependencia no existen'
  }

  if (depTasks.some((task: { project_id: string }) => task.project_id !== projectId)) {
    return 'Las dependencias deben ser tareas del mismo proyecto'
  }

  if (!taskId) return null

  const cache = new Map<string, string[]>()
  for (const depId of uniqueIds) {
    if (await dependencyReachable(supabaseAdmin, depId, taskId, cache)) {
      return 'Dependencia circular detectada'
    }
  }

  return null
}

/** @deprecated Usar validateTaskDependencies */
export async function validateTaskDependency(
  supabaseAdmin: SupabaseAdmin,
  options: {
    taskId: string | null
    dependsOnTaskId: string | null
    projectId: string
  }
): Promise<string | null> {
  const { taskId, dependsOnTaskId, projectId } = options
  if (!dependsOnTaskId) return null
  return validateTaskDependencies(supabaseAdmin, {
    taskId,
    dependsOnTaskIds: [dependsOnTaskId],
    projectId,
  })
}

export async function syncTaskDependencies(
  supabaseAdmin: SupabaseAdmin,
  taskId: string,
  dependsOnTaskIds: string[]
): Promise<void> {
  const uniqueIds = [...new Set(dependsOnTaskIds)]

  const { data: currentRows, error: currentError } = await supabaseAdmin
    .from('task_dependencies')
    .select('depends_on_task_id')
    .eq('task_id', taskId)

  if (currentError) {
    throw new Error(currentError.message)
  }

  const currentIds = (currentRows || []).map((row: { depends_on_task_id: string }) => row.depends_on_task_id)
  const toAdd = uniqueIds.filter((id) => !currentIds.includes(id))
  const toRemove = currentIds.filter((id: string) => !uniqueIds.includes(id))

  if (toRemove.length > 0) {
    const { error: deleteError } = await supabaseAdmin
      .from('task_dependencies')
      .delete()
      .eq('task_id', taskId)
      .in('depends_on_task_id', toRemove)

    if (deleteError) throw new Error(deleteError.message)
  }

  if (toAdd.length > 0) {
    const { error: insertError } = await supabaseAdmin
      .from('task_dependencies')
      .insert(toAdd.map((dependsOnTaskId) => ({ task_id: taskId, depends_on_task_id: dependsOnTaskId })))

    if (insertError) throw new Error(insertError.message)
  }

  if (uniqueIds.length === 0) {
    await supabaseAdmin
      .from('tasks')
      .update({ depends_on_task_id: null })
      .eq('id', taskId)
  }
}

export async function assertTaskNotBlockedByDependency(
  supabaseAdmin: SupabaseAdmin,
  options: {
    taskId?: string
    dependsOnTaskId?: string | null
    dependsOnTaskIds?: string[]
    newStatus: string
  }
): Promise<string | null> {
  const { taskId, dependsOnTaskId, dependsOnTaskIds, newStatus } = options

  if (!isAdvancedTaskStatus(newStatus)) return null

  let dependencyIds = dependsOnTaskIds?.filter(Boolean) ?? []
  if (dependencyIds.length === 0 && taskId) {
    dependencyIds = await fetchTaskDependencyIds(supabaseAdmin, taskId)
  }
  if (dependencyIds.length === 0 && dependsOnTaskId) {
    dependencyIds = [dependsOnTaskId]
  }
  if (dependencyIds.length === 0) return null

  const { data: dependencyTasks, error } = await supabaseAdmin
    .from('tasks')
    .select('id, task_number, title, status')
    .in('id', dependencyIds)

  if (error || !dependencyTasks) {
    return 'Una o más tareas de dependencia no existen'
  }

  const pending = dependencyTasks.filter((task: TaskDependencyRef) => task.status !== 'done')
  if (pending.length === 0) return null

  return formatBlockedByDependencyMessage(pending)
}

type TaskDependencyLookup = Pick<TaskDependencyRef, 'id' | 'task_number' | 'title'> & {
  status?: string
}

export function resolveDependencyTask(
  dependsOnTaskId: string | null | undefined,
  dependsOnRaw: unknown,
  fallbackTasks?: TaskDependencyLookup[]
): TaskDependencyRef | null {
  if (!dependsOnTaskId) return null

  const normalized = normalizeDependsOn(dependsOnRaw, dependsOnTaskId)
  if (normalized) return normalized

  const fromList = fallbackTasks?.find((task) => task.id === dependsOnTaskId)
  if (fromList?.title) {
    return {
      id: fromList.id,
      task_number: fromList.task_number,
      title: fromList.title,
      status: fromList.status ?? 'backlog',
    }
  }

  return null
}

export function resolveDependencyTasks(
  dependsOnTaskIds: string[] | null | undefined,
  dependenciesRaw: unknown,
  fallbackTasks?: TaskDependencyLookup[]
): TaskDependencyRef[] {
  const ids = dependsOnTaskIds?.filter(Boolean) ?? []
  if (ids.length === 0) return []

  if (Array.isArray(dependenciesRaw)) {
    const refs = dependenciesRaw.filter(
      (entry): entry is TaskDependencyRef =>
        !!entry && typeof entry === 'object' && 'id' in entry && typeof (entry as TaskDependencyRef).title === 'string'
    )
    if (refs.length > 0) {
      const byId = new Map(refs.map((ref) => [ref.id, ref]))
      return ids.map((id) => byId.get(id)).filter((ref): ref is TaskDependencyRef => !!ref)
    }
  }

  return ids
    .map((id) => resolveDependencyTask(id, null, fallbackTasks))
    .filter((ref): ref is TaskDependencyRef => !!ref)
}

export function enrichTasksWithDependencies<
  T extends {
    id: string
    task_number: number | null
    title: string
    status: string
    depends_on_task_id?: string | null
  }
>(tasks: T[]): Array<T & { depends_on: TaskDependencyRef | null; dependencies: TaskDependencyRef[] }> {
  const byId = new Map(tasks.map((task) => [task.id, task]))

  return tasks.map((task) => {
    const dependencies = task.depends_on_task_id
      ? (() => {
          const dep = byId.get(task.depends_on_task_id)
          return dep
            ? [{
                id: dep.id,
                task_number: dep.task_number,
                title: dep.title,
                status: dep.status,
              }]
            : []
        })()
      : []

    return {
      ...task,
      depends_on: dependencies[0] ?? null,
      dependencies,
    }
  })
}

export function enrichTasksWithDependencyList<
  T extends {
    id: string
    task_number: number | null
    title: string
    status: string
    depends_on_task_id?: string | null
  }
>(
  tasks: T[],
  dependencyMap?: Map<string, string[]>
): Array<T & { depends_on: TaskDependencyRef | null; dependencies: TaskDependencyRef[]; depends_on_task_ids: string[] }> {
  const byId = new Map(tasks.map((task) => [task.id, task]))

  return tasks.map((task) => {
    const dependsOnTaskIds = dependencyMap?.get(task.id)
      ?? (task.depends_on_task_id ? [task.depends_on_task_id] : [])

    const dependencies = dependsOnTaskIds
      .map((depId) => byId.get(depId))
      .filter((dep): dep is T => !!dep)
      .map((dep) => ({
        id: dep.id,
        task_number: dep.task_number,
        title: dep.title,
        status: dep.status,
      }))

    return {
      ...task,
      depends_on_task_ids: dependsOnTaskIds,
      depends_on: dependencies[0] ?? null,
      dependencies,
    }
  })
}

export function getPendingDependencies(dependencies: TaskDependencyRef[]): TaskDependencyRef[] {
  return dependencies.filter((dep) => dep.status !== 'done')
}

export function formatTaskBlockedBadgeLabel(
  pendingDependencies: Array<Pick<TaskDependencyRef, 'task_number' | 'title'>>
): string {
  const [first, ...rest] = pendingDependencies
  if (!first) return ''

  const reference = first.task_number != null ? `#${first.task_number}` : first.title
  if (rest.length === 0) return `Bloqueada · ${reference}`

  return `Bloqueada · ${reference} +${rest.length}`
}

export function formatTaskBlockedTooltipTitle(
  pendingDependencies: Array<Pick<TaskDependencyRef, 'task_number' | 'title'>>
): string {
  return pendingDependencies.map((dep) => formatDependencyLabel(dep)).join('\n')
}

export function getDependencyBlockedMessageForStatus(
  dependencies: TaskDependencyRef[],
  newStatus: string
): string | null {
  if (!isAdvancedTaskStatus(newStatus)) return null

  const pending = getPendingDependencies(dependencies)
  if (pending.length === 0) return null

  return formatBlockedByDependencyMessage(pending)
}

export function resolveTaskDependenciesForMove(
  task: {
    dependencies?: TaskDependencyRef[]
    depends_on_task_ids?: string[]
    depends_on_task_id?: string | null
  },
  allTasks: TaskDependencyLookup[]
): TaskDependencyRef[] {
  if (task.dependencies && task.dependencies.length > 0) {
    return task.dependencies
  }

  const dependsOnTaskIds =
    task.depends_on_task_ids?.filter(Boolean)
    ?? (task.depends_on_task_id ? [task.depends_on_task_id] : [])

  return resolveDependencyTasks(dependsOnTaskIds, null, allTasks)
}
