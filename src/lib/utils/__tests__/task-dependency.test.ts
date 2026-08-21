import { describe, expect, it } from 'vitest'
import {
  formatBlockedByDependencyMessage,
  formatTaskBlockedBadgeLabel,
  formatTaskBlockedTooltipTitle,
  getDependencyBlockedMessageForStatus,
  getPendingDependencies,
  isAdvancedTaskStatus,
  resolveDependencyTasks,
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
  it('incluye número y título de una dependencia', () => {
    expect(
      formatBlockedByDependencyMessage([{ task_number: 56, title: 'Configurar impresora' }])
    ).toBe('No puedes avanzar esta tarea hasta completar #56 Configurar impresora')
  })

  it('lista varias dependencias pendientes', () => {
    expect(
      formatBlockedByDependencyMessage([
        { task_number: 56, title: 'Configurar impresora' },
        { task_number: 57, title: 'Validar red' },
      ])
    ).toBe('No puedes avanzar esta tarea hasta completar #56 Configurar impresora y #57 Validar red')
  })
})

describe('getDependencyBlockedMessageForStatus', () => {
  const pendingDep = { id: '1', task_number: 56, title: 'Configurar impresora', status: 'todo' }
  const doneDep = { id: '2', task_number: 57, title: 'Validar red', status: 'done' }

  it('bloquea columnas avanzadas con dependencias pendientes', () => {
    expect(getDependencyBlockedMessageForStatus([pendingDep], 'in_progress')).toBe(
      'No puedes avanzar esta tarea hasta completar #56 Configurar impresora'
    )
    expect(getDependencyBlockedMessageForStatus([pendingDep], 'review')).toContain('Configurar impresora')
    expect(getDependencyBlockedMessageForStatus([pendingDep], 'done')).toContain('Configurar impresora')
  })

  it('permite backlog y todo aunque haya dependencias pendientes', () => {
    expect(getDependencyBlockedMessageForStatus([pendingDep], 'backlog')).toBeNull()
    expect(getDependencyBlockedMessageForStatus([pendingDep], 'todo')).toBeNull()
  })

  it('permite columnas avanzadas si todas las dependencias están completadas', () => {
    expect(getDependencyBlockedMessageForStatus([doneDep], 'in_progress')).toBeNull()
    expect(getDependencyBlockedMessageForStatus([pendingDep, doneDep], 'review')).toContain('Configurar impresora')
    expect(getDependencyBlockedMessageForStatus([doneDep], 'done')).toBeNull()
  })
})

describe('formatTaskBlockedBadgeLabel', () => {
  it('muestra referencia única con #global', () => {
    expect(
      formatTaskBlockedBadgeLabel([{ task_number: 56, title: 'Configurar impresora' }])
    ).toBe('Bloqueada · #56')
  })

  it('muestra conteo cuando hay varias dependencias pendientes', () => {
    expect(
      formatTaskBlockedBadgeLabel([
        { task_number: 56, title: 'Configurar impresora' },
        { task_number: 57, title: 'Validar red' },
      ])
    ).toBe('Bloqueada · 2 tareas')
  })
})

describe('formatTaskBlockedTooltipTitle', () => {
  it('lista todas las dependencias en líneas separadas', () => {
    expect(
      formatTaskBlockedTooltipTitle([
        { task_number: 56, title: 'Configurar impresora' },
        { task_number: 57, title: 'Validar red' },
      ])
    ).toBe('#56 Configurar impresora\n#57 Validar red')
  })
})

describe('getPendingDependencies', () => {
  it('filtra dependencias no completadas', () => {
    const pending = getPendingDependencies([
      { id: '1', task_number: 56, title: 'A', status: 'done' },
      { id: '2', task_number: 57, title: 'B', status: 'todo' },
    ])
    expect(pending).toHaveLength(1)
    expect(pending[0]?.task_number).toBe(57)
  })
})

describe('resolveDependencyTasks', () => {
  it('prioriza el estado actualizado de projectTasks sobre dependencies cacheadas', () => {
    const result = resolveDependencyTasks(
      ['dep-1'],
      [{ id: 'dep-1', task_number: 56, title: 'Configurar impresora', status: 'todo' }],
      [{ id: 'dep-1', task_number: 56, title: 'Configurar impresora', status: 'done' }]
    )

    expect(result).toHaveLength(1)
    expect(result[0]?.status).toBe('done')
  })
})
