import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import { computeNotificationRecipients } from '../notification-diff'

/**
 * Feature: multi-role-multi-developer, Property 8: Notificaciones a nuevos asignados
 *
 * Validates: Requirements 3.7
 *
 * For any update where B differs from A, exactly one notification is sent
 * to each user in B\A and none to A∩B. The current user (who made the change)
 * is excluded from notifications.
 */

/** Arbitrary: array of unique UUIDs */
const uniqueUuidsArb = (constraints?: { minLength?: number; maxLength?: number }) =>
  fc
    .array(fc.uuid(), {
      minLength: constraints?.minLength ?? 0,
      maxLength: constraints?.maxLength ?? 15,
    })
    .map((ids) => [...new Set(ids)])

describe('Feature: multi-role-multi-developer, Property 8: Notificaciones a nuevos asignados', () => {
  it('recipients equals (B\\A) minus currentUserId', () => {
    fc.assert(
      fc.property(
        uniqueUuidsArb(),
        uniqueUuidsArb(),
        fc.uuid(),
        (currentIds, newIds, currentUserId) => {
          const currentSet = new Set(currentIds)

          const recipients = computeNotificationRecipients(currentIds, newIds, currentUserId)

          // Expected: users in B \ A, excluding currentUserId
          const expectedRecipients = newIds.filter(
            (id) => !currentSet.has(id) && id !== currentUserId
          )

          expect(new Set(recipients)).toEqual(new Set(expectedRecipients))
          expect(recipients).toHaveLength(expectedRecipients.length)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('no user in A∩B receives a notification', () => {
    fc.assert(
      fc.property(
        uniqueUuidsArb(),
        uniqueUuidsArb(),
        fc.uuid(),
        (currentIds, newIds, currentUserId) => {
          const currentSet = new Set(currentIds)
          const newSet = new Set(newIds)

          const recipients = computeNotificationRecipients(currentIds, newIds, currentUserId)
          const recipientSet = new Set(recipients)

          // Intersection: users in both A and B
          const intersection = currentIds.filter((id) => newSet.has(id))

          for (const id of intersection) {
            expect(recipientSet.has(id)).toBe(false)
          }
        }
      ),
      { numRuns: 100 }
    )
  })

  it('currentUserId is never in recipients even if in B\\A', () => {
    fc.assert(
      fc.property(
        uniqueUuidsArb(),
        uniqueUuidsArb({ minLength: 1 }),
        (currentIds, newIds) => {
          // Force currentUserId to be one of the new assignees not in current
          const currentSet = new Set(currentIds)
          const newOnly = newIds.filter((id) => !currentSet.has(id))

          if (newOnly.length === 0) return // skip trivial case

          const currentUserId = newOnly[0]
          const recipients = computeNotificationRecipients(currentIds, newIds, currentUserId)

          expect(recipients).not.toContain(currentUserId)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('each recipient appears exactly once (no duplicates)', () => {
    fc.assert(
      fc.property(
        uniqueUuidsArb(),
        uniqueUuidsArb(),
        fc.uuid(),
        (currentIds, newIds, currentUserId) => {
          const recipients = computeNotificationRecipients(currentIds, newIds, currentUserId)

          expect(new Set(recipients).size).toBe(recipients.length)
        }
      ),
      { numRuns: 100 }
    )
  })
})
