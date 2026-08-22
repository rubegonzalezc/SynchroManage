import { describe, expect, it } from 'vitest'
import {
  buildDuplicateTaskInsertPayload,
  buildDuplicateTaskTitle,
  isAllowedDuplicateTaskStatus,
  resolveDuplicateTaskStatus,
} from '@/lib/utils/duplicate-task'

describe('buildDuplicateTaskTitle', () => {
  it('añade sufijo (copia) al título', () => {
    expect(buildDuplicateTaskTitle('Login OAuth')).toBe('Login OAuth (copia)')
  })

  it('no duplica el sufijo si ya existe', () => {
    expect(buildDuplicateTaskTitle('Login OAuth (copia)')).toBe('Login OAuth (copia)')
  })

  it('maneja título vacío', () => {
    expect(buildDuplicateTaskTitle('   ')).toBe('(copia)')
  })
})

describe('resolveDuplicateTaskStatus', () => {
  it('usa backlog por defecto', () => {
    expect(resolveDuplicateTaskStatus(undefined)).toBe('backlog')
    expect(resolveDuplicateTaskStatus('in_progress')).toBe('backlog')
  })

  it('acepta todo', () => {
    expect(resolveDuplicateTaskStatus('todo')).toBe('todo')
  })
})

describe('isAllowedDuplicateTaskStatus', () => {
  it('solo permite backlog y todo', () => {
    expect(isAllowedDuplicateTaskStatus('backlog')).toBe(true)
    expect(isAllowedDuplicateTaskStatus('todo')).toBe(true)
    expect(isAllowedDuplicateTaskStatus('done')).toBe(false)
  })
})

describe('buildDuplicateTaskInsertPayload', () => {
  const source = {
    project_id: 'proj-1',
    title: 'Historia base',
    description: 'Detalle',
    category: 'feature',
    priority: 'high',
    sprint_id: 'sprint-1',
  }

  it('copia campos permitidos y excluye dependencias y metadatos', () => {
    const payload = buildDuplicateTaskInsertPayload({
      source,
      status: 'backlog',
      position: 3,
      sprintOrder: 2,
      primaryAssigneeId: 'user-1',
    })

    expect(payload).toMatchObject({
      project_id: 'proj-1',
      title: 'Historia base (copia)',
      description: 'Detalle',
      category: 'feature',
      priority: 'high',
      sprint_id: 'sprint-1',
      sprint_order: 2,
      status: 'backlog',
      position: 3,
      assignee_id: 'user-1',
      reviewer_id: null,
      due_date: null,
      branch_name: null,
      complexity: null,
      depends_on_task_id: null,
    })
  })
})
