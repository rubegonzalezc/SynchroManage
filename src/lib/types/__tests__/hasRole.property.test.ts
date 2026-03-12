import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import { hasRole, type RoleName } from '../roles'

/**
 * Feature: multi-role-multi-developer, Property 5: Filtrado de usuarios por rol incluye multi-rol
 *
 * Validates: Requirements 2.1, 2.2, 2.3, 2.4
 *
 * For any target role and set of users, filtering by that role must return
 * exactly the users that have that role among their roles.
 */

const allRoles: RoleName[] = ['admin', 'pm', 'tech_lead', 'developer', 'stakeholder']

// Generator: a single random valid role
const roleArb: fc.Arbitrary<RoleName> = fc.constantFrom(...allRoles)

// Generator: non-empty subset of roles for a single user
const nonEmptyRoleSubset: fc.Arbitrary<RoleName[]> = fc.subarray(allRoles, { minLength: 1 })

// Generator: a user with an id and a random non-empty subset of roles
const userArb = fc.record({
  id: fc.uuid(),
  roles: nonEmptyRoleSubset,
})

// Generator: a list of users (0 to 20)
const usersArb = fc.array(userArb, { minLength: 0, maxLength: 20 })

describe('Feature: multi-role-multi-developer, Property 5: Filtrado de usuarios por rol incluye multi-rol', () => {
  it('filtering users by a target role using hasRole returns exactly the users that have that role among their roles', () => {
    fc.assert(
      fc.property(roleArb, usersArb, (targetRole, users) => {
        // Filter using hasRole (the function under test)
        const filtered = users.filter((u) => hasRole(u.roles, targetRole))

        // Manual filtering for expected result
        const expected = users.filter((u) => u.roles.includes(targetRole))

        // Both sets must match exactly
        expect(filtered).toEqual(expected)
      }),
      { numRuns: 100 },
    )
  })
})
