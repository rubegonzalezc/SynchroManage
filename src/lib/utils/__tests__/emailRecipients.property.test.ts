import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import {
  deduplicateRecipients,
  getNewAssigneeIds,
} from '../email-recipients'

/**
 * Feature: email-notifications-resend, Property 2: deduplication with role consolidation and self-exclusion
 *
 * Validates: Requirements 2.5, 2.6, 3.4, 3.5
 *
 * For any list of recipients where the same userId appears multiple times
 * (with different roles), and given a currentUserId, the function
 * deduplicateRecipients must return a list where:
 * (a) each userId appears exactly once,
 * (b) roles from duplicate entries are consolidated into an array,
 * (c) the currentUserId does not appear in the result.
 */

/** Arbitrary: a single recipient entry */
const recipientArb = fc.record({
  userId: fc.constantFrom('u1', 'u2', 'u3', 'u4', 'u5'),
  email: fc.emailAddress(),
  fullName: fc.string({ minLength: 1, maxLength: 30 }),
  role: fc.constantFrom('PM', 'Tech Lead', 'Developer', 'Stakeholder'),
})

/** Arbitrary: list of recipients with potential duplicates */
const recipientsListArb = fc.array(recipientArb, { minLength: 0, maxLength: 20 })

/** Arbitrary: currentUserId from the same pool */
const currentUserIdArb = fc.constantFrom('u1', 'u2', 'u3', 'u4', 'u5')

describe('Feature: email-notifications-resend, Property 2: deduplication with role consolidation and self-exclusion', () => {
  it('(a) each userId appears exactly once in the output', () => {
    fc.assert(
      fc.property(recipientsListArb, currentUserIdArb, (recipients, currentUserId) => {
        const result = deduplicateRecipients(recipients, currentUserId)
        const userIds = result.map((r) => r.userId)
        expect(new Set(userIds).size).toBe(userIds.length)
      }),
      { numRuns: 100 }
    )
  })

  it('(b) all roles for a userId are consolidated into the roles array', () => {
    fc.assert(
      fc.property(recipientsListArb, currentUserIdArb, (recipients, currentUserId) => {
        const result = deduplicateRecipients(recipients, currentUserId)

        for (const entry of result) {
          // Collect all roles from the input for this userId
          const expectedRoles = [
            ...new Set(
              recipients
                .filter((r) => r.userId === entry.userId)
                .map((r) => r.role)
            ),
          ]
          // Every expected role must be present in the consolidated roles
          for (const role of expectedRoles) {
            expect(entry.roles).toContain(role)
          }
          // No extra roles should be present
          expect(entry.roles).toHaveLength(expectedRoles.length)
        }
      }),
      { numRuns: 100 }
    )
  })

  it('(c) currentUserId does not appear in the result', () => {
    fc.assert(
      fc.property(recipientsListArb, currentUserIdArb, (recipients, currentUserId) => {
        const result = deduplicateRecipients(recipients, currentUserId)
        const userIds = result.map((r) => r.userId)
        expect(userIds).not.toContain(currentUserId)
      }),
      { numRuns: 100 }
    )
  })
})


/**
 * Feature: email-notifications-resend, Property 3: only new assignees receive email
 *
 * Validates: Requirements 3.2
 *
 * For any pair of sets of assignee IDs (current A and new B), the function
 * getNewAssigneeIds must return exactly B \ A (set difference).
 * Users in A ∩ B must not appear in the result.
 */

/** Arbitrary: array of unique user IDs */
const uniqueIdsArb = (constraints?: { minLength?: number; maxLength?: number }) =>
  fc
    .array(fc.uuid(), {
      minLength: constraints?.minLength ?? 0,
      maxLength: constraints?.maxLength ?? 15,
    })
    .map((ids) => [...new Set(ids)])

describe('Feature: email-notifications-resend, Property 3: only new assignees receive email', () => {
  it('result is exactly B \\ A (set difference)', () => {
    fc.assert(
      fc.property(uniqueIdsArb(), uniqueIdsArb(), (currentIds, newIds) => {
        const currentSet = new Set(currentIds)
        const result = getNewAssigneeIds(currentIds, newIds)

        const expected = newIds.filter((id) => !currentSet.has(id))

        expect(new Set(result)).toEqual(new Set(expected))
        expect(result).toHaveLength(expected.length)
      }),
      { numRuns: 100 }
    )
  })

  it('users in A ∩ B do not appear in the result', () => {
    fc.assert(
      fc.property(uniqueIdsArb(), uniqueIdsArb(), (currentIds, newIds) => {
        const currentSet = new Set(currentIds)
        const newSet = new Set(newIds)
        const result = getNewAssigneeIds(currentIds, newIds)
        const resultSet = new Set(result)

        // Intersection: users in both A and B
        const intersection = currentIds.filter((id) => newSet.has(id))

        for (const id of intersection) {
          expect(resultSet.has(id)).toBe(false)
        }
      }),
      { numRuns: 100 }
    )
  })

  it('every element in the result is in B but not in A', () => {
    fc.assert(
      fc.property(uniqueIdsArb(), uniqueIdsArb(), (currentIds, newIds) => {
        const currentSet = new Set(currentIds)
        const newSet = new Set(newIds)
        const result = getNewAssigneeIds(currentIds, newIds)

        for (const id of result) {
          expect(newSet.has(id)).toBe(true)
          expect(currentSet.has(id)).toBe(false)
        }
      }),
      { numRuns: 100 }
    )
  })
})
