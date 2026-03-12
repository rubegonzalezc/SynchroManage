/**
 * Verification code utilities for password reset flow.
 *
 * Provides functions to generate 6-digit numeric codes,
 * calculate expiration timestamps, and validate codes.
 */

const CODE_LENGTH = 6
const EXPIRATION_MINUTES = 15

/**
 * Generates a random 6-digit numeric verification code.
 * Each character is a digit from 0 to 9.
 */
export function generateVerificationCode(): string {
  let code = ''
  for (let i = 0; i < CODE_LENGTH; i++) {
    code += Math.floor(Math.random() * 10).toString()
  }
  return code
}

/**
 * Returns a Date that is 15 minutes from now.
 */
export function calculateExpiration(): Date {
  const now = new Date()
  return new Date(now.getTime() + EXPIRATION_MINUTES * 60 * 1000)
}

/**
 * Returns true only if the code matches the stored code
 * AND the expiration date is in the future (not expired).
 */
export function isCodeValid(
  code: string,
  storedCode: string,
  expiresAt: Date
): boolean {
  if (code !== storedCode) return false
  return expiresAt.getTime() > Date.now()
}
