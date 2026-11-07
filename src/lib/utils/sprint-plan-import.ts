/**
 * Valida un plan de sprint en JSON antes de escribir en la base.
 * La descripción se conserva tal cual (saltos de línea, **negrita** y *cursiva*).
 */

export const TASK_CATEGORIES = [
  'task',
  'feature',
  'hotfix',
  'fix',
  'improvement',
  'refactor',
  'docs',
  'test',
  'chore',
] as const

export const TASK_STATUSES = ['backlog', 'todo', 'in_progress', 'review', 'done'] as const
export const TASK_PRIORITIES = ['low', 'medium', 'high', 'urgent'] as const
export const SPRINT_STATUSES = ['planning', 'active', 'completed'] as const

const PLAN_KEYS = new Set(['project', 'sprint', 'tasks'])
const SPRINT_KEYS = new Set(['name', 'goal', 'start_date', 'end_date', 'status'])
const TASK_KEYS = new Set([
  'key',
  'title',
  'description',
  'category',
  'priority',
  'status',
  'complexity',
  'sprint_order',
  'assignees',
  'reviewer',
  'due_date',
  'depends_on',
  'branch_name',
  'auto_branch',
])

export interface ImportPerson {
  id: string
  full_name: string
  email: string | null
}

export interface PlanIssue {
  path: string
  message: string
}

export interface ResolvedPlanTask {
  key: string
  title: string
  description: string | null
  category: (typeof TASK_CATEGORIES)[number]
  priority: (typeof TASK_PRIORITIES)[number]
  status: (typeof TASK_STATUSES)[number]
  complexity: number | null
  sprintOrder: number | null
  assigneeIds: string[]
  assigneeNames: string[]
  reviewerId: string | null
  reviewerName: string | null
  dueDate: string | null
  dependsOnKeys: string[]
  branchName: string | null
  autoBranch: boolean
}

export interface ResolvedSprintPlan {
  projectName: string | null
  sprint: {
    name: string
    goal: string | null
    startDate: string
    endDate: string
    status: (typeof SPRINT_STATUSES)[number]
  }
  tasks: ResolvedPlanTask[]
}

export interface PrepareSprintPlanResult {
  errors: PlanIssue[]
  plan: ResolvedSprintPlan | null
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function normalizeName(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()
}

export function isIsoDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const [year, month, day] = value.split('-').map(Number)
  const date = new Date(Date.UTC(year, month - 1, day))
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day
}

export function resolvePerson(query: string, people: ImportPerson[]): { person?: ImportPerson; error?: string } {
  const trimmed = query.trim()
  if (!trimmed) return { error: 'el nombre está vacío' }

  const byEmail = people.filter((person) => person.email && person.email.toLowerCase() === trimmed.toLowerCase())
  if (byEmail.length === 1) return { person: byEmail[0] }
  if (byEmail.length > 1) return { error: `hay varias personas con el email «${trimmed}»` }

  const normalized = normalizeName(trimmed)
  const byFullName = people.filter((person) => normalizeName(person.full_name) === normalized)
  if (byFullName.length === 1) return { person: byFullName[0] }
  if (byFullName.length > 1) return { error: `hay varias personas llamadas «${trimmed}»` }

  const byFirstName = people.filter((person) => normalizeName(person.full_name).split(' ')[0] === normalized)
  if (byFirstName.length === 1) return { person: byFirstName[0] }
  if (byFirstName.length > 1) {
    const names = byFirstName.map((person) => person.full_name).join(', ')
    return { error: `«${trimmed}» es ambiguo. Usa el nombre completo: ${names}` }
  }

  const available = people.map((person) => person.full_name).join(', ') || 'ninguna'
  return { error: `no existe «${trimmed}». Personas disponibles: ${available}` }
}

function unknownKeys(record: Record<string, unknown>, allowed: Set<string>): string[] {
  return Object.keys(record).filter((key) => !allowed.has(key))
}

function findCycle(tasks: { key: string; dependsOnKeys: string[] }[]): string[] | null {
  const graph = new Map(tasks.map((task) => [task.key, task.dependsOnKeys]))
  const visiting = new Set<string>()
  const visited = new Set<string>()

  function walk(key: string, stack: string[]): string[] | null {
    if (visiting.has(key)) return [...stack, key]
    if (visited.has(key)) return null
    visiting.add(key)
    for (const next of graph.get(key) ?? []) {
      if (!graph.has(next)) continue
      const cycle = walk(next, [...stack, key])
      if (cycle) return cycle
    }
    visiting.delete(key)
    visited.add(key)
    return null
  }

  for (const key of graph.keys()) {
    const cycle = walk(key, [])
    if (cycle) return cycle
  }
  return null
}

export function prepareSprintPlan(input: unknown, people: ImportPerson[]): PrepareSprintPlanResult {
  const errors: PlanIssue[] = []

  if (!isRecord(input)) {
    return { errors: [{ path: '$', message: 'El plan debe ser un objeto JSON' }], plan: null }
  }

  for (const key of unknownKeys(input, PLAN_KEYS)) {
    const hint = key === 'points' ? ' La complejidad va en cada tarea como complexity (1 a 10).' : ''
    errors.push({ path: key, message: `Campo no reconocido.${hint}` })
  }

  const sprintRaw = input.sprint
  if (!isRecord(sprintRaw)) {
    errors.push({ path: 'sprint', message: 'Falta el objeto sprint' })
  } else {
    for (const key of unknownKeys(sprintRaw, SPRINT_KEYS)) {
      errors.push({ path: `sprint.${key}`, message: 'Campo no reconocido en el sprint' })
    }
  }

  if (!Array.isArray(input.tasks)) {
    errors.push({ path: 'tasks', message: 'Falta la lista de tareas' })
  } else if (input.tasks.length === 0) {
    errors.push({ path: 'tasks', message: 'El plan necesita al menos una tarea' })
  }

  if (!isRecord(sprintRaw) || !Array.isArray(input.tasks) || input.tasks.length === 0) {
    return { errors, plan: null }
  }

  const name = typeof sprintRaw.name === 'string' ? sprintRaw.name.trim() : ''
  if (!name) errors.push({ path: 'sprint.name', message: 'El sprint necesita un nombre' })

  const goal = typeof sprintRaw.goal === 'string' ? sprintRaw.goal.trim() : ''
  const startDate = typeof sprintRaw.start_date === 'string' ? sprintRaw.start_date : ''
  const endDate = typeof sprintRaw.end_date === 'string' ? sprintRaw.end_date : ''

  if (!isIsoDate(startDate)) {
    errors.push({ path: 'sprint.start_date', message: 'Usa una fecha válida YYYY-MM-DD' })
  }
  if (!isIsoDate(endDate)) {
    errors.push({ path: 'sprint.end_date', message: 'Usa una fecha válida YYYY-MM-DD' })
  }
  if (isIsoDate(startDate) && isIsoDate(endDate) && endDate <= startDate) {
    errors.push({ path: 'sprint.end_date', message: 'La fecha de fin debe ser posterior a la de inicio' })
  }

  let sprintStatus: (typeof SPRINT_STATUSES)[number] = 'planning'
  if (sprintRaw.status != null) {
    if (typeof sprintRaw.status === 'string' && (SPRINT_STATUSES as readonly string[]).includes(sprintRaw.status)) {
      sprintStatus = sprintRaw.status as (typeof SPRINT_STATUSES)[number]
    } else {
      errors.push({ path: 'sprint.status', message: `Usa uno de: ${SPRINT_STATUSES.join(', ')}` })
    }
  }

  const tasks: ResolvedPlanTask[] = []
  const seenKeys = new Set<string>()
  const seenOrders = new Set<number>()

  input.tasks.forEach((raw, index) => {
    const path = `tasks[${index}]`
    if (!isRecord(raw)) {
      errors.push({ path, message: 'Cada tarea debe ser un objeto' })
      return
    }

    for (const key of unknownKeys(raw, TASK_KEYS)) {
      const hint = key === 'points'
        ? ' Usa complexity, un entero de 1 a 10.'
        : ''
      errors.push({ path: `${path}.${key}`, message: `Campo no reconocido.${hint}` })
    }

    const key = typeof raw.key === 'string' ? raw.key.trim() : ''
    if (!/^[A-Za-z0-9][A-Za-z0-9_-]{0,40}$/.test(key)) {
      errors.push({ path: `${path}.key`, message: 'La clave es obligatoria (letras, números, guion). Ejemplo: HU-01' })
    } else if (seenKeys.has(key)) {
      errors.push({ path: `${path}.key`, message: `La clave «${key}» está repetida` })
    } else {
      seenKeys.add(key)
    }

    const title = typeof raw.title === 'string' ? raw.title.trim() : ''
    if (!title) errors.push({ path: `${path}.title`, message: 'La tarea necesita un título' })

    let description: string | null = null
    if (raw.description != null) {
      if (typeof raw.description !== 'string') {
        errors.push({ path: `${path}.description`, message: 'La descripción debe ser texto, con markdown inline si quieres' })
      } else if (raw.description.length > 20000) {
        errors.push({ path: `${path}.description`, message: 'La descripción supera 20000 caracteres' })
      } else {
        description = raw.description
      }
    }

    let category: ResolvedPlanTask['category'] = 'task'
    if (raw.category != null) {
      if (typeof raw.category === 'string' && (TASK_CATEGORIES as readonly string[]).includes(raw.category)) {
        category = raw.category as ResolvedPlanTask['category']
      } else {
        errors.push({ path: `${path}.category`, message: `Usa uno de: ${TASK_CATEGORIES.join(', ')}` })
      }
    }

    let priority: ResolvedPlanTask['priority'] = 'medium'
    if (raw.priority != null) {
      if (typeof raw.priority === 'string' && (TASK_PRIORITIES as readonly string[]).includes(raw.priority)) {
        priority = raw.priority as ResolvedPlanTask['priority']
      } else {
        errors.push({ path: `${path}.priority`, message: `Usa uno de: ${TASK_PRIORITIES.join(', ')}` })
      }
    }

    let status: ResolvedPlanTask['status'] = 'backlog'
    if (raw.status != null) {
      if (typeof raw.status === 'string' && (TASK_STATUSES as readonly string[]).includes(raw.status)) {
        status = raw.status as ResolvedPlanTask['status']
      } else {
        errors.push({ path: `${path}.status`, message: `Usa uno de: ${TASK_STATUSES.join(', ')}` })
      }
    }

    let complexity: number | null = null
    if (raw.complexity != null) {
      if (typeof raw.complexity === 'number' && Number.isInteger(raw.complexity) && raw.complexity >= 1 && raw.complexity <= 10) {
        complexity = raw.complexity
      } else {
        errors.push({ path: `${path}.complexity`, message: 'complexity debe ser un entero de 1 a 10' })
      }
    }

    let sprintOrder: number | null = null
    if (raw.sprint_order != null) {
      if (typeof raw.sprint_order === 'number' && Number.isInteger(raw.sprint_order) && raw.sprint_order > 0) {
        if (seenOrders.has(raw.sprint_order)) {
          errors.push({ path: `${path}.sprint_order`, message: `El orden ${raw.sprint_order} ya está usado en este plan` })
        } else {
          seenOrders.add(raw.sprint_order)
          sprintOrder = raw.sprint_order
        }
      } else {
        errors.push({ path: `${path}.sprint_order`, message: 'sprint_order debe ser un entero positivo (HU-1, HU-2…)' })
      }
    }

    const assigneeIds: string[] = []
    const assigneeNames: string[] = []
    if (raw.assignees != null) {
      if (!Array.isArray(raw.assignees) || raw.assignees.some((item) => typeof item !== 'string')) {
        errors.push({ path: `${path}.assignees`, message: 'assignees debe ser una lista de nombres o emails' })
      } else {
        raw.assignees.forEach((query, assigneeIndex) => {
          const resolved = resolvePerson(query, people)
          if (!resolved.person) {
            errors.push({ path: `${path}.assignees[${assigneeIndex}]`, message: resolved.error || 'Persona no encontrada' })
            return
          }
          if (!assigneeIds.includes(resolved.person.id)) {
            assigneeIds.push(resolved.person.id)
            assigneeNames.push(resolved.person.full_name)
          }
        })
      }
    }

    let reviewerId: string | null = null
    let reviewerName: string | null = null
    if (raw.reviewer != null && raw.reviewer !== '') {
      if (typeof raw.reviewer !== 'string') {
        errors.push({ path: `${path}.reviewer`, message: 'reviewer debe ser un nombre o email' })
      } else {
        const resolved = resolvePerson(raw.reviewer, people)
        if (!resolved.person) {
          errors.push({ path: `${path}.reviewer`, message: resolved.error || 'Persona no encontrada' })
        } else {
          reviewerId = resolved.person.id
          reviewerName = resolved.person.full_name
        }
      }
    }

    let dueDate: string | null = null
    if (raw.due_date != null && raw.due_date !== '') {
      if (typeof raw.due_date !== 'string' || !isIsoDate(raw.due_date)) {
        errors.push({ path: `${path}.due_date`, message: 'Usa una fecha válida YYYY-MM-DD' })
      } else {
        dueDate = raw.due_date
      }
    }

    const dependsOnKeys: string[] = []
    if (raw.depends_on != null) {
      if (!Array.isArray(raw.depends_on) || raw.depends_on.some((item) => typeof item !== 'string')) {
        errors.push({ path: `${path}.depends_on`, message: 'depends_on debe ser una lista de claves del mismo plan' })
      } else {
        for (const dependency of raw.depends_on) {
          const dependencyKey = dependency.trim()
          if (dependencyKey) dependsOnKeys.push(dependencyKey)
        }
      }
    }

    let branchName: string | null = null
    if (raw.branch_name != null && raw.branch_name !== '') {
      if (typeof raw.branch_name !== 'string') {
        errors.push({ path: `${path}.branch_name`, message: 'branch_name debe ser texto' })
      } else {
        branchName = raw.branch_name.trim()
      }
    }

    let autoBranch = false
    if (raw.auto_branch != null) {
      if (typeof raw.auto_branch !== 'boolean') {
        errors.push({ path: `${path}.auto_branch`, message: 'auto_branch debe ser true o false' })
      } else {
        autoBranch = raw.auto_branch
      }
    }

    tasks.push({
      key: key || `tarea-${index + 1}`,
      title,
      description,
      category,
      priority,
      status,
      complexity,
      sprintOrder,
      assigneeIds,
      assigneeNames,
      reviewerId,
      reviewerName,
      dueDate,
      dependsOnKeys,
      branchName,
      autoBranch: autoBranch && !branchName,
    })
  })

  const knownKeys = new Set(tasks.map((task) => task.key))
  tasks.forEach((task, index) => {
    task.dependsOnKeys.forEach((dependency) => {
      if (!knownKeys.has(dependency)) {
        errors.push({
          path: `tasks[${index}].depends_on`,
          message: `«${dependency}» no existe en este plan. Las dependencias solo apuntan a claves del mismo JSON`,
        })
      }
      if (dependency === task.key) {
        errors.push({ path: `tasks[${index}].depends_on`, message: 'Una tarea no puede depender de sí misma' })
      }
    })
  })

  const cycle = findCycle(tasks.map((task) => ({ key: task.key, dependsOnKeys: task.dependsOnKeys })))
  if (cycle) {
    errors.push({ path: 'tasks', message: `Dependencia circular: ${cycle.join(' → ')}` })
  }

  if (errors.length > 0 || !name || !isIsoDate(startDate) || !isIsoDate(endDate)) {
    return { errors, plan: null }
  }

  const projectName = typeof input.project === 'string' && input.project.trim() ? input.project.trim() : null

  return {
    errors: [],
    plan: {
      projectName,
      sprint: {
        name,
        goal: goal || null,
        startDate,
        endDate,
        status: sprintStatus,
      },
      tasks,
    },
  }
}

/** Rellena sprint_order vacío con el menor entero libre, sin pisar órdenes ya usados. */
export function fillMissingSprintOrders<T extends { sprintOrder: number | null }>(
  tasks: T[],
  occupied: number[] = []
): T[] {
  const used = new Set(occupied.filter((order) => order > 0))
  for (const task of tasks) {
    if (task.sprintOrder != null) used.add(task.sprintOrder)
  }

  let cursor = 1
  return tasks.map((task) => {
    if (task.sprintOrder != null) return task
    while (used.has(cursor)) cursor += 1
    const sprintOrder = cursor
    used.add(sprintOrder)
    cursor += 1
    return { ...task, sprintOrder }
  })
}

export type PlanImportAction = 'create' | 'update'

export interface StoredPlanTask {
  id: string
  title: string
  planKey: string | null
  sprintOrder: number | null
}

export function matchPlanTasks(
  tasks: { key: string; title: string }[],
  existing: StoredPlanTask[]
): { matches: { action: PlanImportAction; existingId: string | null }[]; errors: PlanIssue[] } {
  const errors: PlanIssue[] = []
  const used = new Set<string>()
  const byKey = new Map<string, StoredPlanTask[]>()

  for (const row of existing) {
    if (!row.planKey) continue
    const list = byKey.get(row.planKey) ?? []
    list.push(row)
    byKey.set(row.planKey, list)
  }

  const matches = tasks.map((task, index) => {
    const keyed = byKey.get(task.key) ?? []
    if (keyed.length > 1) {
      errors.push({
        path: `tasks[${index}].key`,
        message: `Hay más de una tarea con la clave «${task.key}» en el sprint.`,
      })
      return { action: 'create' as const, existingId: null }
    }
    if (keyed.length === 1) {
      used.add(keyed[0].id)
      return { action: 'update' as const, existingId: keyed[0].id }
    }

    const byTitle = existing.filter(
      (row) => !row.planKey && !used.has(row.id) && normalizeName(row.title) === normalizeName(task.title)
    )
    if (byTitle.length > 1) {
      errors.push({
        path: `tasks[${index}].title`,
        message: `Hay más de una tarea sin clave llamada «${task.title}». No se puede reimportar con seguridad.`,
      })
      return { action: 'create' as const, existingId: null }
    }
    if (byTitle.length === 1) {
      used.add(byTitle[0].id)
      return { action: 'update' as const, existingId: byTitle[0].id }
    }

    return { action: 'create' as const, existingId: null }
  })

  return { matches, errors }
}

const PLAN_KEY_PATTERN = /^[A-Za-z0-9][A-Za-z0-9_-]{0,40}$/

export function exportPlanKey(task: {
  planKey: string | null
  sprintOrder: number | null
  taskNumber: number | null
  id: string
}): string {
  if (task.planKey && PLAN_KEY_PATTERN.test(task.planKey)) return task.planKey
  if (task.sprintOrder != null) return `HU-${task.sprintOrder}`
  if (task.taskNumber != null) return `T-${task.taskNumber}`
  return `T-${task.id.replace(/-/g, '').slice(0, 8)}`
}

export interface SprintPlanExportTask {
  id: string
  title: string
  description: string | null
  category: string
  priority: string
  status: string
  complexity: number | null
  sprintOrder: number | null
  taskNumber: number | null
  planKey: string | null
  dueDate: string | null
  branchName: string | null
  assigneeIds: string[]
  reviewerId: string | null
  dependencyIds: string[]
}

function personLabel(person: ImportPerson, referenced: ImportPerson[]): string {
  const first = normalizeName(person.full_name).split(' ')[0]
  const collision = referenced.filter((other) => normalizeName(other.full_name).split(' ')[0] === first).length > 1
  if (collision && person.email) return person.email
  return person.full_name
}

function isoDateOrNull(value: string | null): string | null {
  if (!value) return null
  const date = value.slice(0, 10)
  return isIsoDate(date) ? date : null
}

export function buildSprintPlanExport(input: {
  projectName: string
  sprint: {
    name: string
    goal: string | null
    startDate: string
    endDate: string
    status: string
  }
  tasks: SprintPlanExportTask[]
  people: ImportPerson[]
}): Record<string, unknown> {
  const peopleById = new Map(input.people.map((person) => [person.id, person]))
  const ordered = [...input.tasks].sort((left, right) => {
    const leftOrder = left.sprintOrder ?? Number.MAX_SAFE_INTEGER
    const rightOrder = right.sprintOrder ?? Number.MAX_SAFE_INTEGER
    if (leftOrder !== rightOrder) return leftOrder - rightOrder
    return left.title.localeCompare(right.title, 'es')
  })
  const keyById = new Map(ordered.map((task) => [task.id, exportPlanKey(task)]))
  const referencedIds = new Set<string>()
  for (const task of ordered) {
    task.assigneeIds.forEach((id) => referencedIds.add(id))
    if (task.reviewerId) referencedIds.add(task.reviewerId)
  }
  const referenced = input.people.filter((person) => referencedIds.has(person.id))

  return {
    project: input.projectName,
    sprint: {
      name: input.sprint.name,
      goal: input.sprint.goal,
      start_date: isoDateOrNull(input.sprint.startDate),
      end_date: isoDateOrNull(input.sprint.endDate),
      status: input.sprint.status,
    },
    tasks: ordered.map((task) => {
      const assignees = task.assigneeIds
        .map((id) => peopleById.get(id))
        .filter((person): person is ImportPerson => !!person)
        .map((person) => personLabel(person, referenced))
      const reviewer = task.reviewerId ? peopleById.get(task.reviewerId) : null
      const dependsOn = task.dependencyIds
        .map((id) => keyById.get(id))
        .filter((key): key is string => !!key)

      const row: Record<string, unknown> = {
        key: keyById.get(task.id),
        title: task.title,
        description: task.description ?? '',
        category: task.category,
        priority: task.priority,
        status: task.status,
        sprint_order: task.sprintOrder,
        assignees,
        reviewer: reviewer ? personLabel(reviewer, referenced) : null,
        due_date: isoDateOrNull(task.dueDate),
        depends_on: dependsOn,
      }
      if (task.complexity != null && task.complexity >= 1 && task.complexity <= 10) {
        row.complexity = task.complexity
      }
      if (task.branchName) row.branch_name = task.branchName
      return row
    }),
  }
}

export function buildSprintPlanTemplate(projectName: string, people: ImportPerson[]): string {
  const assignee = people[0]?.full_name ?? 'Nombre Apellido'
  const reviewer = people[1]?.full_name ?? assignee
  return JSON.stringify({
    project: projectName,
    sprint: {
      name: 'Sprint — título corto',
      goal: 'Qué debe quedar listo al cerrar el sprint',
      start_date: '2026-11-09',
      end_date: '2026-11-20',
      status: 'planning',
    },
    tasks: [
      {
        key: 'HU-01',
        title: 'Título de la historia',
        description: '**Objetivo**\nDescribe el resultado.\n\n**Alcance**\n- Primer punto\n- Segundo punto\n\n*Nota:* la negrita y la cursiva se ven en el detalle.',
        category: 'feature',
        priority: 'high',
        status: 'todo',
        complexity: 5,
        sprint_order: 1,
        assignees: [assignee],
        reviewer,
        due_date: '2026-11-13',
        depends_on: [],
        auto_branch: true,
      },
    ],
  }, null, 2)
}
