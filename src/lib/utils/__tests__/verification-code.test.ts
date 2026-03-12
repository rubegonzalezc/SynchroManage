import { describe, it, expect, vi, afterEach } from 'vitest'
import {
  generateVerificationCode,
  calculateExpiration,
  isCodeValid,
} from '../verification-code'

describe('generateVerificationCode', () => {
  it('returns a string of exactly 6 characters', () => {
    const code = generateVerificationCode()
    expect(code).toHaveLength(6)
  })

  it('contains only digits 0-9', () => {
    const code = generateVerificationCode()
    expect(code).toMatch(/^[0-9]{6}$/)
  })

  it('generates different codes on successive calls', () => {
    const codes = new Set(Array.from({ length: 20 }, () => generateVerificationCode()))
    // With 10^6 possibilities, 20 calls should produce at least 2 distinct codes
    expect(codes.size).toBeGreaterThan(1)
  })
})

describe('calculateExpiration', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns a Date 15 minutes from now', () => {
    const now = Date.now()
    vi.setSystemTime(now)

    const expiration = calculateExpiration()
    const expectedMs = now + 15 * 60 * 1000

    expect(Math.abs(expiration.getTime() - expectedMs)).toBeLessThanOrEqual(1000)
  })

  it('returns a Date in the future', () => {
    const expiration = calculateExpiration()
    expect(expiration.getTime()).toBeGreaterThan(Date.now())
  })
})

describe('isCodeValid', () => {
  it('returns true when code matches and not expired', () => {
    const futureDate = new Date(Date.now() + 10 * 60 * 1000)
    expect(isCodeValid('123456', '123456', futureDate)).toBe(true)
  })

  it('returns false when code does not match', () => {
    const futureDate = new Date(Date.now() + 10 * 60 * 1000)
    expect(isCodeValid('123456', '654321', futureDate)).toBe(false)
  })

  it('returns false when code is expired', () => {
    const pastDate = new Date(Date.now() - 1000)
    expect(isCodeValid('123456', '123456', pastDate)).toBe(false)
  })

  it('returns false when code does not match AND is expired', () => {
    const pastDate = new Date(Date.now() - 1000)
    expect(isCodeValid('111111', '222222', pastDate)).toBe(false)
  })

  it('returns false when expiration is exactly now', () => {
    const now = new Date()
    // expiresAt must be strictly in the future
    expect(isCodeValid('123456', '123456', now)).toBe(false)
  })
})
