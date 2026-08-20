import { describe, expect, it } from 'vitest'
import {
  buildSprintFilterOptions,
  filterTasksBySprint,
  formatSprintTaskDependencyLabel,
  formatSprintTaskDependencyTooltip,
  matchesSprintTaskSearch,
  resolveCurrentSprintId,
} from '@/lib/utils/sprint-task-select'
import type { SprintOption, SprintTaskOption } from '@/lib/utils/sprint-task-select'

const sprints: SprintOption[] = [
  { id: 's1', name: 'Sprint 1 — Auth', status: 'completed', order_index: 0 },
  { id: 's2', name: 'Sprint 2', status: 'active', order_index: 1 },
  { id: 's3', name: 'Sprint 3', status: 'planning', order_index: 2 },
]

const tasks: SprintTaskOption[] = [
  {
    id: 't1',
    task_number: 58,
    title: 'Selector de dependencias',
    status: 'todo',
    sprint_id: 's1',
    sprint_order: 3,
  },
  {
    id: 't2',
    task_number: 72,
    title: 'Otra HU-3',
    status: 'todo',
    sprint_id: 's2',
    sprint_order: 3,
  },
  {
    id: 't3',
    task_number: 10,
    title: 'Tarea en backlog',
    status: 'backlog',
    sprint_id: null,
    sprint_order: null,
  },
]

describe('resolveCurrentSprintId', () => {
  it('usa currentSprintId explícito', () => {
    expect(resolveCurrentSprintId(sprints, 's1')).toBe('s1')
  })

  it('cae al sprint activo si no hay currentSprintId', () => {
    expect(resolveCurrentSprintId(sprints)).toBe('s2')
  })
})

describe('buildSprintFilterOptions', () => {
  it('incluye sprint actual, backlog, otros sprints y todos', () => {
    const options = buildSprintFilterOptions(sprints, 's2')
    expect(options.map((o) => o.label)).toEqual([
      'Sprint 2 (actual)',
      'Backlog',
      'Sprint 1 — Auth',
      'Sprint 3',
      'Todos',
    ])
  })
})

describe('filterTasksBySprint', () => {
  it('filtra por sprint actual', () => {
    const result = filterTasksBySprint(tasks, 'current', 's2')
    expect(result.map((t) => t.id)).toEqual(['t2'])
  })

  it('filtra backlog', () => {
    const result = filterTasksBySprint(tasks, 'backlog', 's2')
    expect(result.map((t) => t.id)).toEqual(['t3'])
  })

  it('filtra sprint concreto', () => {
    const result = filterTasksBySprint(tasks, { sprintId: 's1' }, 's2')
    expect(result.map((t) => t.id)).toEqual(['t1'])
  })

  it('muestra todos', () => {
    const result = filterTasksBySprint(tasks, 'all', 's2')
    expect(result).toHaveLength(3)
  })
})

describe('matchesSprintTaskSearch', () => {
  const task = tasks[0]

  it('busca por título', () => {
    expect(matchesSprintTaskSearch(task, 'dependencias')).toBe(true)
  })

  it('busca por #global', () => {
    expect(matchesSprintTaskSearch(task, '#58')).toBe(true)
    expect(matchesSprintTaskSearch(task, '58')).toBe(true)
  })

  it('busca por HU-N sin confundir sprints', () => {
    expect(matchesSprintTaskSearch(task, 'HU-3')).toBe(true)
    expect(matchesSprintTaskSearch(tasks[1], 'HU-3')).toBe(true)
  })

  it('busca por número de orden', () => {
    expect(matchesSprintTaskSearch(task, '3')).toBe(true)
  })
})

describe('formatSprintTaskDependencyLabel', () => {
  it('formatea Sprint · HU · Título', () => {
    expect(formatSprintTaskDependencyLabel(tasks[0], sprints)).toBe(
      'Sprint 1 · HU-3 · Selector de dependencias'
    )
  })

  it('formatea backlog', () => {
    expect(formatSprintTaskDependencyLabel(tasks[2], sprints)).toBe(
      'Backlog · Tarea en backlog'
    )
  })
})

describe('formatSprintTaskDependencyTooltip', () => {
  it('muestra #global en tooltip', () => {
    expect(formatSprintTaskDependencyTooltip(tasks[0])).toBe('#58')
  })
})
