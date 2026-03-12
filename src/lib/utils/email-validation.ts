/**
 * Valid notification types supported by the email service.
 */
const VALID_NOTIFICATION_TYPES = [
  'project_assigned',
  'task_assigned',
  'password_reset',
  'user_invited',
] as const

export type NotificationType = (typeof VALID_NOTIFICATION_TYPES)[number]

/**
 * Validates that the given string is a valid email address.
 * Checks that it is non-empty and matches a basic email format
 * (has @, has domain with dot, no spaces, etc.).
 */
export function isValidEmail(email: string): boolean {
  if (!email || email.trim().length === 0) return false
  // Basic email regex: local@domain.tld
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email.trim())
}

/**
 * Validates that the given string is one of the supported notification types:
 * 'project_assigned', 'task_assigned', or 'password_reset'.
 */
export function isValidNotificationType(type: string): boolean {
  return VALID_NOTIFICATION_TYPES.includes(type as NotificationType)
}
