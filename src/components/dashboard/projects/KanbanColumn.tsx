'use client'

import React, { memo } from 'react'
import { useDroppable } from '@dnd-kit/core'
import { ReactNode } from 'react'

const ITEMS_PER_SUBCOL = 10
// Inner card content width: outer 288px (w-72) minus 2×8px padding = 272px
const INNER_CARD_WIDTH_PX = 272
// Horizontal padding of the content area (p-2 = 8px on each side = 16px total)
const CONTENT_PADDING_PX = 16
const GAP_PX = 8           // gap-2 = 0.5rem = 8px

interface KanbanColumnProps {
  id: string
  title: string
  color: string
  count: number
  children: ReactNode
  /** True when a card from a different column is being dragged over this column */
  isDragTarget?: boolean
}

export const KanbanColumn = memo(function KanbanColumn({ id, title, color, count, children, isDragTarget }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id })
  const highlighted = isOver || isDragTarget

  // Split children into chunks of ITEMS_PER_SUBCOL
  const childArray = React.Children.toArray(children)
  const chunks: ReactNode[][] = []
  for (let i = 0; i < childArray.length; i += ITEMS_PER_SUBCOL) {
    chunks.push(childArray.slice(i, i + ITEMS_PER_SUBCOL))
  }
  // Always at least one sub-column (for empty columns to remain droppable)
  if (chunks.length === 0) chunks.push([])

  const subColCount = chunks.length
  const totalWidth = CONTENT_PADDING_PX + subColCount * INNER_CARD_WIDTH_PX + (subColCount - 1) * GAP_PX

  return (
    <div
      ref={setNodeRef}
      style={{ width: `${totalWidth}px` }}
      className={`flex-shrink-0 bg-muted/50 rounded-lg border transition-all duration-200 ${
        highlighted
          ? 'border-blue-400 ring-2 ring-blue-400/40 bg-blue-50/10'
          : 'border-border'
      }`}
    >
      {/* Column header */}
      <div className="p-3 border-b border-border">
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${color}`} />
          <h3 className="font-medium text-foreground">{title}</h3>
          {subColCount > 1 && (
            <span className="text-xs text-muted-foreground">
              ({subColCount} columnas)
            </span>
          )}
          <span className="ml-auto text-sm text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
            {count}
          </span>
        </div>
      </div>

      {/* Task grid: sub-columns of up to 10 items each */}
      <div className="p-2 flex gap-2">
        {chunks.map((chunk, i) => (
          <div
            key={i}
            className="flex-1 flex flex-col gap-2 min-h-[200px] min-w-0"
          >
            {chunk}
          </div>
        ))}
      </div>
    </div>
  )
})
