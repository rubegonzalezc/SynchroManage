import { describe, expect, it } from 'vitest'
import {
  formatCarryOverLabel,
  formatSprintHuLabel,
  getSprintOrderUpdateAction,
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
  })
})

describe('formatCarryOverLabel', () => {
  it('muestra la HU del sprint anterior', () => {
    expect(formatCarryOverLabel(2)).toBe('Sprint anterior HU-2')
    expect(formatCarryOverLabel(null)).toBeNull()
  })
})
