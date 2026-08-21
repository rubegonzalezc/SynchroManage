import { describe, expect, it } from 'vitest'
import {
  compareTasksBySprintOrder,
  getSprintGroupCollapseKey,
  groupTasksBySprint,
  sortTasksBySprintOrder,
} from '@/lib/utils/task-list-sprint-groups'

const sprints = [
  { id: 's1', name: 'Sprint 1 — Auth', order_index: 0 },
  { id: 's2', name: 'Sprint 2', order_index: 1 },
]

const tasks = [
  { id: 't1', sprint_id: 's1', sprint_order: 3, task_number: 10, title: 'C' },
  { id: 't2', sprint_id: 's1', sprint_order: 1, task_number: 8, title: 'A' },
  { id: 't3', sprint_id: null, sprint_order: null, task_number: 5, title: 'Backlog' },
  { id: 't4', sprint_id: 's2', sprint_order: 2, task_number: 12, title: 'S2' },
]

describe('sortTasksBySprintOrder', () => {
  it('ordena por sprint_order ascendente', () => {
    const sorted = sortTasksBySprintOrder(
      tasks.filter((task) => task.sprint_id === 's1')
    )
    expect(sorted.map((task) => task.id)).toEqual(['t2', 't1'])
  })
})

describe('compareTasksBySprintOrder', () => {
  it('usa task_number como desempate', () => {
    expect(
      compareTasksBySprintOrder(
        { sprint_order: null, task_number: 2 },
        { sprint_order: null, task_number: 5 }
      )
    ).toBeLessThan(0)
  })
})

describe('groupTasksBySprint', () => {
  it('agrupa backlog y sprints con orden interno por sprint_order', () => {
    const groups = groupTasksBySprint(tasks, sprints)

    expect(groups.map((group) => group.label)).toEqual(['Backlog', 'Sprint 1', 'Sprint 2'])
    expect(groups[0].tasks.map((task) => task.id)).toEqual(['t3'])
    expect(groups[1].tasks.map((task) => task.id)).toEqual(['t2', 't1'])
    expect(groups[2].tasks.map((task) => task.id)).toEqual(['t4'])
  })

  it('incluye sección backlog aunque esté vacía', () => {
    const groups = groupTasksBySprint(
      tasks.filter((task) => task.sprint_id === 's2'),
      sprints
    )

    expect(groups[0]).toMatchObject({ id: null, label: 'Backlog', tasks: [] })
  })
})

describe('getSprintGroupCollapseKey', () => {
  it('genera clave estable para backlog', () => {
    expect(getSprintGroupCollapseKey(null)).toBe('backlog')
    expect(getSprintGroupCollapseKey('s1')).toBe('s1')
  })
})
