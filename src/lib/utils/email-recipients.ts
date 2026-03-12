/**
 * Email recipient deduplication and helper utilities.
 *
 * Provides functions to deduplicate recipients by userId (consolidating roles)
 * and to compute the set of newly-added assignee IDs.
 */

export interface EmailRecipient {
  userId: string
  email: string
  fullName: string
  roles: string[]
}

/**
 * Deduplicates email recipients by userId, consolidating roles into an array.
 * Excludes the user who performed the action (currentUserId).
 *
 * - Each userId appears exactly once in the output.
 * - Roles from duplicate entries are consolidated (unique values only).
 * - The currentUserId is excluded from the result.
 */
export function deduplicateRecipients(
  recipients: Array<{
    userId: string
    email: string
    fullName: string
    role: string
  }>,
  currentUserId: string
): EmailRecipient[] {
  const map = new Map<string, EmailRecipient>()

  for (const r of recipients) {
    if (r.userId === currentUserId) continue

    const existing = map.get(r.userId)
    if (existing) {
      if (!existing.roles.includes(r.role)) {
        existing.roles.push(r.role)
      }
    } else {
      map.set(r.userId, {
        userId: r.userId,
        email: r.email,
        fullName: r.fullName,
        roles: [r.role],
      })
    }
  }

  return Array.from(map.values())
}

/**
 * Returns the IDs that are in newIds but not in currentIds (set difference: newIds \ currentIds).
 * Useful for determining which assignees were newly added when updating a task.
 */
export function getNewAssigneeIds(
  currentIds: string[],
  newIds: string[]
): string[] {
  const currentSet = new Set(currentIds)
  return newIds.filter((id) => !currentSet.has(id))
}
