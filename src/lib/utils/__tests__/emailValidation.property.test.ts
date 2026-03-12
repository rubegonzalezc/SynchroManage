import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import { isValidEmail, isValidNotificationType } from '../email-validation'

/**
 * Feature: email-notifications-resend, Property 1: validation rejects invalid emails and types
 *
 * Validates: Requirements 1.5, 1.6
 *
 * For any string that is not a valid email (empty, without @, without domain, etc.)
 * OR any notification type string that is not `project_assigned`, `task_assigned`
 * or `password_reset`, the validation function must reject the request.
 */

const VALID_TYPES = ['project_assigned', 'task_assigned', 'password_reset'] as const

describe('Feature: email-notifications-resend, Property 1: validation rejects invalid emails and types', () => {
  it('valid emails (fc.emailAddress()) are accepted by isValidEmail', () => {
    fc.assert(
      fc.property(fc.emailAddress(), (email) => {
        expect(isValidEmail(email)).toBe(true)
      }),
      { numRuns: 100 }
    )
  })

  it('strings without @ are rejected by isValidEmail', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1 }).filter((s) => !s.includes('@') && s.trim().length > 0),
        (str) => {
          expect(isValidEmail(str)).toBe(false)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('empty strings and whitespace-only strings are rejected by isValidEmail', () => {
    fc.assert(
      fc.property(
        fc.nat({ max: 20 }).map((n) => ' '.repeat(n)),
        (str) => {
          expect(isValidEmail(str)).toBe(false)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('strings with spaces in the local or domain part are rejected by isValidEmail', () => {
    fc.assert(
      fc.property(
        fc.tuple(
          fc.string({ minLength: 1 }).filter((s) => s.trim().length > 0),
          fc.string({ minLength: 1 }).filter((s) => s.trim().length > 0)
        ).map(([a, b]) => `${a} ${b}@exam ple.com`),
        (str) => {
          expect(isValidEmail(str)).toBe(false)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('the three valid notification types are accepted by isValidNotificationType', () => {
    for (const type of VALID_TYPES) {
      expect(isValidNotificationType(type)).toBe(true)
    }
  })

  it('random strings that are not one of the three valid types are rejected by isValidNotificationType', () => {
    fc.assert(
      fc.property(
        fc.string().filter((s) => !VALID_TYPES.includes(s as (typeof VALID_TYPES)[number])),
        (str) => {
          expect(isValidNotificationType(str)).toBe(false)
        }
      ),
      { numRuns: 100 }
    )
  })
})
