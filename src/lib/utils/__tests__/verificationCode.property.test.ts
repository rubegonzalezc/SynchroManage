import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import * as fc from 'fast-check'
import {
  generateVerificationCode,
  calculateExpiration,
  isCodeValid,
} from '../verification-code'

/**
 * Feature: email-notifications-resend
 *
 * Property-based tests for verification code utilities.
 * Tests Properties 5, 6, 7, and 8 from the design document.
 */

describe('Feature: email-notifications-resend, Property 5: 6-digit code', () => {
  /**
   * Validates: Requirements 4.1
   *
   * For any invocation of the code generation function, the result must be
   * a string of exactly 6 characters where each character is a digit from 0 to 9.
   */
  it('generateVerificationCode always produces a 6-digit numeric string', () => {
    fc.assert(
      fc.property(fc.constant(null), () => {
        const code = generateVerificationCode()
        expect(code).toHaveLength(6)
        expect(code).toMatch(/^[0-9]{6}$/)
      }),
      { numRuns: 100 }
    )
  })
})

describe('Feature: email-notifications-resend, Property 6: 15-min expiration', () => {
  /**
   * Validates: Requirements 4.2
   *
   * For any generated code, the expires_at field must be exactly 15 minutes
   * after the creation moment (with ±1 second tolerance).
   */
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('calculateExpiration returns a date exactly 15 minutes from now (±1s tolerance)', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 2_000_000_000_000 }),
        (timestamp) => {
          vi.setSystemTime(new Date(timestamp))

          const expiration = calculateExpiration()
          const expectedMs = timestamp + 15 * 60 * 1000
          const diffMs = Math.abs(expiration.getTime() - expectedMs)

          expect(diffMs).toBeLessThanOrEqual(1000)
        }
      ),
      { numRuns: 100 }
    )
  })
})

describe('Feature: email-notifications-resend, Property 7: invalid codes rejected', () => {
  /**
   * Validates: Requirements 4.6
   *
   * For any code that does not match the stored code OR whose expires_at
   * is before the current moment, the verification function must return false.
   */
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2025-01-15T12:00:00Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('isCodeValid returns false when code does not match storedCode (even if not expired)', () => {
    const digitCode = fc.array(fc.integer({ min: 0, max: 9 }), { minLength: 6, maxLength: 6 }).map(arr => arr.join(''))
    fc.assert(
      fc.property(
        digitCode,
        digitCode,
        (code, storedCode) => {
          fc.pre(code !== storedCode)
          const futureExpiry = new Date(Date.now() + 10 * 60 * 1000)
          expect(isCodeValid(code, storedCode, futureExpiry)).toBe(false)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('isCodeValid returns false when code is expired (even if code matches)', () => {
    const digitCode = fc.array(fc.integer({ min: 0, max: 9 }), { minLength: 6, maxLength: 6 }).map(arr => arr.join(''))
    fc.assert(
      fc.property(
        digitCode,
        fc.integer({ min: 1, max: 60 * 60 * 1000 }),
        (code, msInPast) => {
          const pastExpiry = new Date(Date.now() - msInPast)
          expect(isCodeValid(code, code, pastExpiry)).toBe(false)
        }
      ),
      { numRuns: 100 }
    )
  })
})

describe('Feature: email-notifications-resend, Property 8: new code invalidates previous ones', () => {
  /**
   * Validates: Requirements 4.7
   *
   * For any user with N previous unused codes, when generating a new code,
   * all N previous codes must be marked as used/invalid, and only the new
   * code must be valid.
   *
   * At the utility level: isCodeValid with the old code returns false when
   * the storedCode is the new code, and the new code returns true.
   */
  it('only the latest generated code validates against itself as storedCode', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 10 }),
        (n) => {
          const previousCodes: string[] = []
          for (let i = 0; i < n; i++) {
            previousCodes.push(generateVerificationCode())
          }
          const newCode = generateVerificationCode()
          const futureExpiry = new Date(Date.now() + 15 * 60 * 1000)

          // All previous codes should fail validation against the new storedCode
          for (const oldCode of previousCodes) {
            if (oldCode !== newCode) {
              expect(isCodeValid(oldCode, newCode, futureExpiry)).toBe(false)
            }
          }

          // The new code validates against itself as storedCode
          expect(isCodeValid(newCode, newCode, futureExpiry)).toBe(true)
        }
      ),
      { numRuns: 100 }
    )
  })
})
