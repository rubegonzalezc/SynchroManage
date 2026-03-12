/**
 * Pure function to prepare task assignee records for insertion.
 *
 * Given a taskId and an array of assigneeIds (possibly with duplicates):
 * - Deduplicates the IDs while preserving order
 * - Creates the records to insert into task_assignees
 * - Determines the primary assignee (first unique ID, or null if empty)
 */
export function prepareTaskAssignees(
  taskId: string,
  assigneeIds: string[]
): {
  deduplicatedIds: string[]
  records: { task_id: string; user_id: string }[]
  primaryAssigneeId: string | null
} {
  const seen = new Set<string>()
  const deduplicatedIds: string[] = []

  for (const id of assigneeIds) {
    if (!seen.has(id)) {
      seen.add(id)
      deduplicatedIds.push(id)
    }
  }

  const records = deduplicatedIds.map((userId) => ({
    task_id: taskId,
    user_id: userId,
  }))

  const primaryAssigneeId = deduplicatedIds.length > 0 ? deduplicatedIds[0] : null

  return { deduplicatedIds, records, primaryAssigneeId }
}
