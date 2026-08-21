import { describe, expect, it } from 'vitest'
import {
  buildSprintOrderUpdates,
  moveTaskInOrderedList,
  reorderTaskInOrderedList,
} from '@/lib/utils/reorder-sprint-tasks'

describe('buildSprintOrderUpdates', () => {
  it('asigna sprint_order 1..N en el orden recibido', () => {
    expect(buildSprintOrderUpdates(['a', 'b', 'c'])).toEqual([
      { id: 'a', sprint_order: 1 },
      { id: 'b', sprint_order: 2 },
      { id: 'c', sprint_order: 3 },
    ])
  })
})

describe('moveTaskInOrderedList', () => {
  const ids = ['a', 'b', 'c', 'd']

  it('sube una tarea', () => {
    expect(moveTaskInOrderedList(ids, 'c', 'up')).toEqual(['a', 'c', 'b', 'd'])
  })

  it('baja una tarea', () => {
    expect(moveTaskInOrderedList(ids, 'b', 'down')).toEqual(['a', 'c', 'b', 'd'])
  })

  it('no mueve la primera hacia arriba', () => {
    expect(moveTaskInOrderedList(ids, 'a', 'up')).toBeNull()
  })

  it('no mueve la última hacia abajo', () => {
    expect(moveTaskInOrderedList(ids, 'd', 'down')).toBeNull()
  })
})

describe('reorderTaskInOrderedList', () => {
  it('reordena con drag & drop', () => {
    expect(reorderTaskInOrderedList(['a', 'b', 'c'], 'c', 'a')).toEqual(['c', 'a', 'b'])
  })

  it('devuelve null si los IDs no están en la lista', () => {
    expect(reorderTaskInOrderedList(['a', 'b'], 'x', 'a')).toBeNull()
  })
})
