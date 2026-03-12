import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import { getPrimaryRole, ROLE_HIERARCHY, type RoleName } from '../roles'

/**
 * Feature: multi-role-multi-developer, Property 2: El rol primario es el de mayor jerarquía
 *
 * Validates: Requirements 1.4
 *
 * For any non-empty set of valid roles, getPrimaryRole must return the role
 * with the lowest index in ROLE_HIERARCHY [admin, pm, tech_lead, developer, stakeholder].
 */

const allRoles: RoleName[] = ['admin', 'pm', 'tech_lead', 'developer', 'stakeholder']

// Generator: non-empty subsets of valid RoleName values
const nonEmptyRoleSubset: fc.Arbitrary<RoleName[]> = fc
  .subarray(allRoles, { minLength: 1 })

describe('Feature: multi-role-multi-developer, Property 2: El rol primario es el de mayor jerarquía', () => {
  it('getPrimaryRole returns the role with the lowest index in ROLE_HIERARCHY for any non-empty subset of roles', () => {
    fc.assert(
      fc.property(nonEmptyRoleSubset, (roles) => {
        const result = getPrimaryRole(roles)

        // The expected primary role is the one with the lowest index in ROLE_HIERARCHY
        const expectedIndex = Math.min(
          ...roles.map((r) => ROLE_HIERARCHY.indexOf(r))
        )
        const expected = ROLE_HIERARCHY[expectedIndex]

        expect(result).toBe(expected)
      }),
      { numRuns: 100 }
    )
  })
})
