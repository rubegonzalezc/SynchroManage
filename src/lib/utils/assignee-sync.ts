/**
 * Pure function to compute the sync operations needed when updating
 * task assignees from a current set to a new set.
 *
 * Given currentIds (A) and newIds (B):
 * - added: B \ A (IDs to insert)
 * - removed: A \ B (IDs to delete)
 * - final: B (the resulting set after sync)
 */
export function computeAssigneeSync(
  currentIds: string[],
  newIds: string[]
): { added: string[]; removed: string[]; final: string[] } {
  const currentSet = new Set(currentIds)
  const newSet = new Set(newIds)

  const added = newIds.filter((id) => !currentSet.has(id))
  const removed = currentIds.filter((id) => !newSet.has(id))
  const final = [...newSet]

  return { added, removed, final }
}
