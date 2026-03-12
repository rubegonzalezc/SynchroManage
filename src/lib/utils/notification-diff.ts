/**
 * Pure function to compute which users should receive notifications
 * when task assignees are updated.
 *
 * Given currentAssigneeIds (A), newAssigneeIds (B), and currentUserId:
 * - Returns (B \ A) minus currentUserId
 * - Users in A∩B do NOT receive notifications (they were already assigned)
 * - The current user who made the change is excluded from notifications
 */
export function computeNotificationRecipients(
  currentAssigneeIds: string[],
  newAssigneeIds: string[],
  currentUserId: string
): string[] {
  const currentSet = new Set(currentAssigneeIds)

  return newAssigneeIds.filter(
    (id) => !currentSet.has(id) && id !== currentUserId
  )
}
