import { describe, it, expect } from 'vitest'
import {
  deduplicateRecipients,
  getNewAssigneeIds,
} from '../email-recipients'

describe('deduplicateRecipients', () => {
  it('returns empty array for empty input', () => {
    expect(deduplicateRecipients([], 'user-1')).toEqual([])
  })

  it('excludes the currentUserId', () => {
    const recipients = [
      { userId: 'u1', email: 'a@b.com', fullName: 'Alice', role: 'PM' },
    ]
    expect(deduplicateRecipients(recipients, 'u1')).toEqual([])
  })

  it('returns a single entry for a unique recipient', () => {
    const recipients = [
      { userId: 'u2', email: 'b@b.com', fullName: 'Bob', role: 'Dev' },
    ]
    const result = deduplicateRecipients(recipients, 'u1')
    expect(result).toEqual([
      { userId: 'u2', email: 'b@b.com', fullName: 'Bob', roles: ['Dev'] },
    ])
  })

  it('consolidates roles for duplicate userIds', () => {
    const recipients = [
      { userId: 'u2', email: 'b@b.com', fullName: 'Bob', role: 'PM' },
      { userId: 'u2', email: 'b@b.com', fullName: 'Bob', role: 'Dev' },
    ]
    const result = deduplicateRecipients(recipients, 'u1')
    expect(result).toHaveLength(1)
    expect(result[0].roles).toEqual(['PM', 'Dev'])
  })

  it('does not duplicate the same role', () => {
    const recipients = [
      { userId: 'u2', email: 'b@b.com', fullName: 'Bob', role: 'PM' },
      { userId: 'u2', email: 'b@b.com', fullName: 'Bob', role: 'PM' },
    ]
    const result = deduplicateRecipients(recipients, 'u1')
    expect(result[0].roles).toEqual(['PM'])
  })

  it('handles multiple distinct users', () => {
    const recipients = [
      { userId: 'u2', email: 'b@b.com', fullName: 'Bob', role: 'PM' },
      { userId: 'u3', email: 'c@c.com', fullName: 'Carol', role: 'Dev' },
    ]
    const result = deduplicateRecipients(recipients, 'u1')
    expect(result).toHaveLength(2)
  })
})

describe('getNewAssigneeIds', () => {
  it('returns empty array when newIds is empty', () => {
    expect(getNewAssigneeIds(['a', 'b'], [])).toEqual([])
  })

  it('returns all newIds when currentIds is empty', () => {
    expect(getNewAssigneeIds([], ['a', 'b'])).toEqual(['a', 'b'])
  })

  it('returns only IDs not in currentIds', () => {
    expect(getNewAssigneeIds(['a', 'b'], ['b', 'c', 'd'])).toEqual([
      'c',
      'd',
    ])
  })

  it('returns empty when all newIds already exist', () => {
    expect(getNewAssigneeIds(['a', 'b'], ['a', 'b'])).toEqual([])
  })
})
