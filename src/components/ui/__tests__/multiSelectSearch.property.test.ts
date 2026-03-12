import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import { filterMembersBySearch } from '../multi-select-developer'

/**
 * Feature: multi-role-multi-developer, Property 9: Búsqueda case-insensitive en selector
 *
 * Validates: Requirements 4.2
 *
 * For any list of users and search string, the filter must return exactly
 * the users whose full_name contains the search string case-insensitively.
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

describe('Feature: multi-role-multi-developer, Property 9: Búsqueda case-insensitive en selector', () => {
  it('filterMembersBySearch returns exactly the members whose full_name contains the query case-insensitively', () => {
    fc.assert(
      fc.property(membersArb, fc.string({ minLength: 1, maxLength: 20 }), (members, searchQuery) => {
        const result = filterMembersBySearch(members, searchQuery)

        // Manual reference filter: case-insensitive substring match
        // Must mirror the function's trim() behavior — whitespace-only queries return all members
        if (!searchQuery.trim()) {
          expect(result).toHaveLength(members.length)
          expect(result.map((m) => m.id)).toEqual(members.map((m) => m.id))
          return
        }
        const query = searchQuery.toLowerCase()
        const expected = members.filter((m) =>
          m.full_name.toLowerCase().includes(query)
        )

        // Same length
        expect(result).toHaveLength(expected.length)

        // Same ids in same order
        expect(result.map((m) => m.id)).toEqual(expected.map((m) => m.id))
      }),
      { numRuns: 100 }
    )
  })

  it('filterMembersBySearch returns all members when search query is empty or whitespace', () => {
    const whitespaceArb = fc.array(fc.constant(' '), { minLength: 0, maxLength: 5 }).map((arr) => arr.join(''))
    fc.assert(
      fc.property(membersArb, whitespaceArb, (members, whitespace) => {
        const result = filterMembersBySearch(members, whitespace)
        expect(result).toHaveLength(members.length)
        expect(result.map((m) => m.id)).toEqual(members.map((m) => m.id))
      }),
      { numRuns: 100 }
    )
  })
})
