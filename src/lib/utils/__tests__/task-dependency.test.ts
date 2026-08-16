import { describe, expect, it } from 'vitest'
import {
  formatBlockedByDependencyMessage,
  isAdvancedTaskStatus,
} from '../task-dependency'

describe('isAdvancedTaskStatus', () => {
  it('identifica estados que requieren dependencia completada', () => {
    expect(isAdvancedTaskStatus('in_progress')).toBe(true)
    expect(isAdvancedTaskStatus('review')).toBe(true)
    expect(isAdvancedTaskStatus('done')).toBe(true)
  })

  it('permite backlog y todo sin validar dependencia', () => {
    expect(isAdvancedTaskStatus('backlog')).toBe(false)
    expect(isAdvancedTaskStatus('todo')).toBe(false)
  })
})

describe('formatBlockedByDependencyMessage', () => {
  it('incluye número y título de la dependencia', () => {
    expect(
      formatBlockedByDependencyMessage({ task_number: 56, title: 'Configurar impresora' })
    ).toBe('No puedes avanzar esta tarea hasta completar #56 Configurar impresora')
  })
})
