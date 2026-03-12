import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import { getVisibleAssignees, getOverflowCount } from '../avatar-stack'

/**
 * Feature: multi-role-multi-developer, Property 11: AvatarStack muestra indicador de exceso
 *
 * Validates: Requirements 6.1, 6.2
 *
 * For any list of N assignees and maxVisible M, the component must render
 * min(N, M) avatars and show "+{N-M}" if N > M.
 */

type Assignee = { id: string; full_name: string; avatar_url: string | null }

const assigneeArb: fc.Arbitrary<Assignee> = fc.record({
  id: fc.uuid(),
  full_name: fc.string({ minLength: 1, maxLength: 50 }),
  avatar_url: fc.constant(null),
})

const assigneesArb: fc.Arbitrary<Assignee[]> = fc
  .array(assigneeArb, { minLength: 0, maxLength: 20 })
  .map((assignees) => {
    const seen = new Set<string>()
    return assignees.filter((a) => {
      if (seen.has(a.id)) return false
      seen.add(a.id)
      return true
    })
  })

const maxVisibleArb: fc.Arbitrary<number> = fc.integer({ min: 1, max: 10 })

describe('Feature: multi-role-multi-developer, Property 11: AvatarStack muestra indicador de exceso', () => {
  it('getVisibleAssignees returns min(N, M) items', () => {
    fc.assert(
      fc.property(assigneesArb, maxVisibleArb, (assignees, maxVisible) => {
        const result = getVisibleAssignees(assignees, maxVisible)
        const N = assignees.length
        const M = maxVisible

        expect(result).toHaveLength(Math.min(N, M))

        // Visible assignees are the first min(N, M) from the original list
        for (let i = 0; i < result.length; i++) {
          expect(result[i].id).toBe(assignees[i].id)
        }
      }),
      { numRuns: 100 }
    )
  })

  it('getOverflowCount returns N-M when N > M, and 0 otherwise', () => {
    fc.assert(
      fc.property(assigneesArb, maxVisibleArb, (assignees, maxVisible) => {
        const N = assignees.length
        const M = maxVisible
        const overflow = getOverflowCount(N, M)

        if (N > M) {
          expect(overflow).toBe(N - M)
        } else {
          expect(overflow).toBe(0)
        }
      }),
      { numRuns: 100 }
    )
  })
})
