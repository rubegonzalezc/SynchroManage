import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import { getAvailableMembers } from '../multi-select-developer'

/**
 * Feature: multi-role-multi-developer, Property 10: Exclusión de seleccionados en dropdown
 *
 * Validates: Requirements 4.4
 *
 * For any list of members and subset of selected IDs, the available options
 * must be exactly the members whose ID is not in the selected subset.
 */

type Member = { id: string; full_name: string; avatar_url: string | null }

// Generator: a single member with random id and full_name
const memberArb: fc.Arbitrary<Member> = fc.record({
  id: fc.uuid(),
  full_name: fc.string({ minLength: 1, maxLength: 50 }),
  avatar_url: fc.constant(null),
})

// Generator: list of members with unique ids
const membersArb: fc.Arbitrary<Member[]> = fc
  .array(memberArb, { minLength: 0, maxLength: 20 })
  .map((members) => {
    const seen = new Set<string>()
    return members.filter((m) => {
      if (seen.has(m.id)) return false
      seen.add(m.id)
      return true
    })
  })

describe('Feature: multi-role-multi-developer, Property 10: Exclusión de seleccionados en dropdown', () => {
  it('getAvailableMembers returns exactly the members whose ID is NOT in selectedIds', () => {
    fc.assert(
      fc.property(
        membersArb.chain((members) => {
          // Generate a random subset of member IDs as selectedIds
          const idsArb = fc
            .subarray(members.map((m) => m.id), { minLength: 0 })
          return fc.tuple(fc.constant(members), idsArb)
        }),
        ([members, selectedIds]) => {
          const result = getAvailableMembers(members, selectedIds)

          const selectedSet = new Set(selectedIds)
          const expected = members.filter((m) => !selectedSet.has(m.id))

          // Same length
          expect(result).toHaveLength(expected.length)

          // Same ids in same order (preserves original order)
          expect(result.map((m) => m.id)).toEqual(expected.map((m) => m.id))

          // No selected ID appears in the result
          for (const m of result) {
            expect(selectedSet.has(m.id)).toBe(false)
          }
        }
      ),
      { numRuns: 100 }
    )
  })

  it('getAvailableMembers returns all members when selectedIds is empty', () => {
    fc.assert(
      fc.property(membersArb, (members) => {
        const result = getAvailableMembers(members, [])

        expect(result).toHaveLength(members.length)
        expect(result.map((m) => m.id)).toEqual(members.map((m) => m.id))
      }),
      { numRuns: 100 }
    )
  })

  it('getAvailableMembers returns empty when all members are selected', () => {
    fc.assert(
      fc.property(membersArb, (members) => {
        const allIds = members.map((m) => m.id)
        const result = getAvailableMembers(members, allIds)

        expect(result).toHaveLength(0)
      }),
      { numRuns: 100 }
    )
  })
})
