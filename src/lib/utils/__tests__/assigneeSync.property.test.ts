import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import { computeAssigneeSync } from '../assignee-sync'

/**
 * Feature: multi-role-multi-developer, Property 7: Sincronización de asignados al actualizar
 *
 * Validates: Requirements 3.3
 *
 * For sets A (current) and B (new), after syncing, task_assignees must contain
 * exactly B. A∩B remain, A\B are deleted, B\A are inserted.
 */

/** Arbitrary: array of unique UUIDs */
const uniqueUuidsArb = (constraints?: { minLength?: number; maxLength?: number }) =>
  fc
    .array(fc.uuid(), {
      minLength: constraints?.minLength ?? 0,
      maxLength: constraints?.maxLength ?? 15,
    })
    .map((ids) => [...new Set(ids)])

describe('Feature: multi-role-multi-developer, Property 7: Sincronización de asignados al actualizar', () => {
  it('added equals B\\A, removed equals A\\B, and final equals B', () => {
    fc.assert(
      fc.property(uniqueUuidsArb(), uniqueUuidsArb(), (currentIds, newIds) => {
        const currentSet = new Set(currentIds)
        const newSet = new Set(newIds)

        const result = computeAssigneeSync(currentIds, newIds)

        // added should be exactly B \ A
        const expectedAdded = newIds.filter((id) => !currentSet.has(id))
        expect(new Set(result.added)).toEqual(new Set(expectedAdded))
        expect(result.added).toHaveLength(expectedAdded.length)

        // removed should be exactly A \ B
        const expectedRemoved = currentIds.filter((id) => !newSet.has(id))
        expect(new Set(result.removed)).toEqual(new Set(expectedRemoved))
        expect(result.removed).toHaveLength(expectedRemoved.length)

        // final should be exactly B
        expect(new Set(result.final)).toEqual(newSet)
        expect(result.final).toHaveLength(newSet.size)
      }),
      { numRuns: 100 }
    )
  })

  it('elements in A∩B are neither in added nor removed', () => {
    fc.assert(
      fc.property(uniqueUuidsArb(), uniqueUuidsArb(), (currentIds, newIds) => {
        const currentSet = new Set(currentIds)
        const newSet = new Set(newIds)

        const result = computeAssigneeSync(currentIds, newIds)

        // Intersection: elements in both A and B
        const intersection = currentIds.filter((id) => newSet.has(id))

        const addedSet = new Set(result.added)
        const removedSet = new Set(result.removed)

        for (const id of intersection) {
          expect(addedSet.has(id)).toBe(false)
          expect(removedSet.has(id)).toBe(false)
        }

        // Also verify intersection elements are in the final set
        for (const id of intersection) {
          expect(new Set(result.final).has(id)).toBe(true)
        }
      }),
      { numRuns: 100 }
    )
  })
})
