import { describe, expect, it } from 'vitest'
import {
  formatActivityRelativeDate,
  getTaskActivityDescription,
} from '@/lib/utils/activity-format'

describe('formatActivityRelativeDate', () => {
  it('devuelve Ahora para eventos recientes', () => {
    const now = new Date().toISOString()
    expect(formatActivityRelativeDate(now)).toBe('Ahora')
  })
})

describe('getTaskActivityDescription', () => {
  const base = {
    id: '1',
    entity_type: 'task',
    entity_id: 'task-1',
    entity_name: 'Login',
    created_at: new Date().toISOString(),
    user: null,
    details: null,
  }

  it('describe creación', () => {
    expect(getTaskActivityDescription({ ...base, action: 'created' })).toBe('creó la tarea')
  })

  it('describe cambio de estado con etiquetas en español', () => {
    expect(
      getTaskActivityDescription({
        ...base,
        action: 'status_changed',
        details: { from: 'todo', to: 'in_progress' },
      })
    ).toBe('cambió el estado de Por Hacer a En Progreso')
  })

  it('describe asignación', () => {
    expect(
      getTaskActivityDescription({
        ...base,
        action: 'assigned',
        details: { assignee_name: 'Ana López' },
      })
    ).toBe('asignó a Ana López')
  })

  it('describe cambio de sprint', () => {
    expect(
      getTaskActivityDescription({
        ...base,
        action: 'sprint_changed',
        details: {
          from_sprint_name: 'Sprint 1',
          to_sprint_name: 'Sprint 2',
        },
      })
    ).toBe('cambió el sprint de Sprint 1 a Sprint 2')
  })

  it('describe dependencias añadidas y removidas', () => {
    expect(
      getTaskActivityDescription({
        ...base,
        action: 'dependency_changed',
        details: {
          added: [{ task_number: 12, title: 'API auth' }],
          removed: [{ task_number: 8, title: 'Setup DB' }],
        },
      })
    ).toBe('actualizó dependencias (añadió: #12 API auth · quitó: #8 Setup DB)')
  })
})
