import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import { prepareTaskAssignees } from '../task-assignees'

/**
 * Feature: multi-role-multi-developer, Property 6: Creación de tarea inserta asignados correctamente
 *
 * Validates: Requirements 3.1, 3.2
 *
 * For any task with N distinct assignee IDs, task_assignees must contain exactly N records.
 */

describe('Feature: multi-role-multi-developer, Property 6: Creación de tarea inserta asignados correctamente', () => {
  it('after deduplication, the number of records equals the number of unique IDs', () => {
    fc.assert(
      fc.property(
        fc.uuid(),
        fc.array(fc.uuid(), { minLength: 0, maxLength: 20 }),
        (taskId, assigneeIds) => {
          const result = prepareTaskAssignees(taskId, assigneeIds)

          const uniqueIds = [...new Set(assigneeIds)]

          // Number of deduplicated IDs equals number of unique input IDs
          expect(result.deduplicatedIds).toHaveLength(uniqueIds.length)

          // Number of records equals number of unique IDs
          expect(result.records).toHaveLength(uniqueIds.length)

          // Each record has the correct task_id
          for (const record of result.records) {
            expect(record.task_id).toBe(taskId)
          }

          // The set of user_ids in records matches the unique input IDs
          const recordUserIds = new Set(result.records.map((r) => r.user_id))
          expect(recordUserIds).toEqual(new Set(uniqueIds))
        }
      ),
      { numRuns: 100 }
    )
  })

  it('primaryAssigneeId is the first unique ID or null if empty', () => {
    fc.assert(
      fc.property(
        fc.uuid(),
        fc.array(fc.uuid(), { minLength: 0, maxLength: 20 }),
        (taskId, assigneeIds) => {
          const result = prepareTaskAssignees(taskId, assigneeIds)

          if (assigneeIds.length === 0) {
            expect(result.primaryAssigneeId).toBeNull()
          } else {
            // The first unique ID is the first element that appears in the input
            const firstUniqueId = assigneeIds[0]
            expect(result.primaryAssigneeId).toBe(firstUniqueId)
          }
        }
      ),
      { numRuns: 100 }
    )
  })
})
