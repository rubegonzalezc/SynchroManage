import { describe, expect, it } from 'vitest'
import {
  formatBlockedByOpenBugsMessage,
  getOpenBugsBlockedMessageForStatus,
  groupBlockingBugsByTaskId,
  isBlockingBugStatus,
} from '@/lib/utils/task-open-bugs'

describe('isBlockingBugStatus', () => {
  it('identifica estados bloqueantes', () => {
    expect(isBlockingBugStatus('open')).toBe(true)
    expect(isBlockingBugStatus('in_progress')).toBe(true)
    expect(isBlockingBugStatus('resolved')).toBe(false)
    expect(isBlockingBugStatus('closed')).toBe(false)
  })
})

describe('formatBlockedByOpenBugsMessage', () => {
  it('incluye títulos de bugs', () => {
    expect(
      formatBlockedByOpenBugsMessage([
        { title: 'Login roto' },
        { title: 'Error API' },
      ])
    ).toContain('Login roto')
  })
})

describe('getOpenBugsBlockedMessageForStatus', () => {
  const bugs = [{
    id: 'b1',
    title: 'Login roto',
    status: 'open',
    project_id: 'p1',
  }]

  it('bloquea solo al pasar a done', () => {
    expect(getOpenBugsBlockedMessageForStatus(bugs, 'done')).toContain('Login roto')
    expect(getOpenBugsBlockedMessageForStatus(bugs, 'review')).toBeNull()
    expect(getOpenBugsBlockedMessageForStatus([], 'done')).toBeNull()
  })
})

describe('groupBlockingBugsByTaskId', () => {
  it('agrupa bugs abiertos por tarea', () => {
    const grouped = groupBlockingBugsByTaskId([
      { id: 'b1', title: 'Bug 1', status: 'open', task_id: 't1', project_id: 'p1' },
      { id: 'b2', title: 'Bug 2', status: 'resolved', task_id: 't1', project_id: 'p1' },
      { id: 'b3', title: 'Bug 3', status: 'in_progress', task_id: 't2', project_id: 'p1' },
    ])

    expect(grouped.t1).toHaveLength(1)
    expect(grouped.t2).toHaveLength(1)
    expect(grouped.t1[0].title).toBe('Bug 1')
  })
})
