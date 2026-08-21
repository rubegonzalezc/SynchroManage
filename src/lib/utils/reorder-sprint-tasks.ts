import { arrayMove } from '@dnd-kit/sortable'

export interface SprintOrderUpdate {
  id: string
  sprint_order: number
}

/** Convierte una lista ordenada de IDs en valores sprint_order 1..N. */
export function buildSprintOrderUpdates(orderedTaskIds: string[]): SprintOrderUpdate[] {
  return orderedTaskIds.map((id, index) => ({
    id,
    sprint_order: index + 1,
  }))
}

/** Mueve una tarea una posición arriba o abajo dentro del mismo sprint. */
export function moveTaskInOrderedList(
  orderedTaskIds: string[],
  taskId: string,
  direction: 'up' | 'down'
): string[] | null {
  const index = orderedTaskIds.indexOf(taskId)
  if (index === -1) return null

  const targetIndex = direction === 'up' ? index - 1 : index + 1
  if (targetIndex < 0 || targetIndex >= orderedTaskIds.length) return null

  return arrayMove(orderedTaskIds, index, targetIndex)
}

/** Reordena tras drag & drop (mismos IDs, nuevo orden). */
export function reorderTaskInOrderedList(
  orderedTaskIds: string[],
  activeId: string,
  overId: string
): string[] | null {
  const oldIndex = orderedTaskIds.indexOf(activeId)
  const newIndex = orderedTaskIds.indexOf(overId)
  if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) return null
  return arrayMove(orderedTaskIds, oldIndex, newIndex)
}
