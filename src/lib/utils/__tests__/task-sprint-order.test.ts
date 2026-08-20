import { describe, expect, it } from 'vitest'
import {
  formatCarryOverLabel,
  formatSprintHuLabel,
  formatSprintTaskReferenceLabel,
  getSprintOrderUpdateAction,
  resolveSprintDisplayLabel,
} from '../task-sprint-order'

describe('getSprintOrderUpdateAction', () => {
  it('limpia el orden al quitar el sprint', () => {
    expect(getSprintOrderUpdateAction('sprint-a', null)).toBe('clear')
    expect(getSprintOrderUpdateAction('sprint-a', undefined)).toBe('clear')
  })

  it('no modifica el orden si el sprint no cambia', () => {
    expect(getSprintOrderUpdateAction('sprint-a', 'sprint-a')).toBe('unchanged')
    expect(getSprintOrderUpdateAction(null, null)).toBe('unchanged')
  })

  it('asigna nuevo orden al añadir o cambiar de sprint', () => {
    expect(getSprintOrderUpdateAction(null, 'sprint-b')).toBe('assign')
    expect(getSprintOrderUpdateAction('sprint-a', 'sprint-b')).toBe('assign')
  })
})

describe('formatSprintHuLabel', () => {
  it('formatea el orden como HU-N', () => {
    expect(formatSprintHuLabel(2)).toBe('HU-2')
    expect(formatSprintHuLabel(null)).toBeNull()
    expect(formatSprintHuLabel(0)).toBeNull()
    expect(formatSprintHuLabel('3')).toBe('HU-3')
    expect(formatSprintHuLabel('_')).toBeNull()
  })
})

describe('resolveSprintDisplayLabel', () => {
  const sprints = [
    { id: 's1', name: 'Sprint 1 — Auth', order_index: 0 },
    { id: 's5', name: 'Sprint 5 - _', order_index: 4 },
  ]

  it('usa order_index, no el nombre descriptivo', () => {
    expect(resolveSprintDisplayLabel('s5', sprints)).toBe('Sprint 5')
  })

  it('parsea Sprint N del nombre si falta order_index', () => {
    expect(resolveSprintDisplayLabel('s5', [{ id: 's5', name: 'Sprint 5 - _' }])).toBe('Sprint 5')
  })
})

describe('formatCarryOverLabel', () => {
  it('muestra la HU del sprint anterior', () => {
    expect(formatCarryOverLabel(2)).toBe('Sprint anterior HU-2')
    expect(formatCarryOverLabel(null)).toBeNull()
  })
})

describe('formatSprintTaskReferenceLabel', () => {
  const sprints = [
    { id: 's1', name: 'Sprint 1 — Auth', order_index: 0 },
    { id: 's2', name: 'Sprint 2', order_index: 1 },
    { id: 's5', name: 'Sprint 5 - _', order_index: 4 },
  ]

  it('muestra Sprint · HU-N cuando hay orden', () => {
    expect(
      formatSprintTaskReferenceLabel({
        sprintId: 's1',
        sprintOrder: 3,
        sprints,
      })
    ).toBe('Sprint 1 · HU-3')
  })

  it('ignora el nombre descriptivo con placeholder', () => {
    expect(
      formatSprintTaskReferenceLabel({
        sprintId: 's5',
        sprintOrder: 2,
        sprints,
      })
    ).toBe('Sprint 5 · HU-2')
  })

  it('muestra solo Sprint N sin orden (con # aparte)', () => {
    expect(
      formatSprintTaskReferenceLabel({
        sprintId: 's2',
        sprintOrder: null,
        sprints,
      })
    ).toBe('Sprint 2')
  })

  it('incluye #global en etiqueta cuando se solicita', () => {
    expect(
      formatSprintTaskReferenceLabel({
        sprintId: 's2',
        sprintOrder: null,
        taskNumber: 58,
        sprints,
        includeGlobalWhenNoOrder: true,
      })
    ).toBe('#58 · Sprint 2')
  })

  it('retorna null sin sprint', () => {
    expect(
      formatSprintTaskReferenceLabel({
        sprintId: null,
        sprintOrder: 3,
        sprints,
      })
    ).toBeNull()
  })
})
