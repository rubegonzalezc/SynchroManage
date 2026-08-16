import type { Modifier } from '@dnd-kit/core'
import { getEventCoordinates } from '@dnd-kit/utilities'

/**
 * Mantiene el punto donde el usuario agarró la tarjeta bajo el cursor.
 * Necesario cuando el handle no está en la esquina superior izquierda.
 */
export const snapPointerOffsetToCursor: Modifier = ({
  activatorEvent,
  draggingNodeRect,
  transform,
}) => {
  if (!draggingNodeRect || !activatorEvent) {
    return transform
  }

  const activatorCoordinates = getEventCoordinates(activatorEvent)
  if (!activatorCoordinates) {
    return transform
  }

  const offsetX = activatorCoordinates.x - draggingNodeRect.left
  const offsetY = activatorCoordinates.y - draggingNodeRect.top

  return {
    ...transform,
    x: transform.x + offsetX,
    y: transform.y + offsetY,
  }
}
