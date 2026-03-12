'use client'

import { useDroppable } from '@dnd-kit/core'
import { ReactNode } from 'react'

interface KanbanColumnProps {
  id: string
  title: string
  color: string
  count: number
  children: ReactNode
}

export function KanbanColumn({ id, title, color, count, children }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id })

  return (
    <div
      ref={setNodeRef}
      className={`flex-shrink-0 w-72 bg-muted/50 rounded-lg border border-border ${
        isOver ? 'ring-2 ring-blue-400 ring-opacity-50' : ''
      }`}
    >
      <div className="p-3 border-b border-border">
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${color}`} />
          <h3 className="font-medium text-foreground">{title}</h3>
          <span className="ml-auto text-sm text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
            {count}
          </span>
        </div>
      </div>
      <div className="p-2 space-y-2 min-h-[200px]">
        {children}
      </div>
    </div>
  )
}
