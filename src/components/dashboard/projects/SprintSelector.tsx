'use client'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus, Package } from 'lucide-react'
import type { Sprint } from './CreateSprintDialog'

interface SprintSelectorProps {
  sprints: Sprint[]
  selectedSprintId: string | null   // null = Backlog
  onSelect: (sprintId: string | null) => void
  canManage: boolean
  onNewSprint: () => void
}

const statusBadge: Record<string, { label: string; className: string }> = {
  planning: { label: 'Plan.', className: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400' },
  active: { label: 'Activo', className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  completed: { label: 'Completado', className: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
}

export function SprintSelector({ sprints, selectedSprintId, onSelect, canManage, onNewSprint }: SprintSelectorProps) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      {/* Tab: Backlog */}
      <button
        onClick={() => onSelect(null)}
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border
          ${selectedSprintId === null
            ? 'bg-primary text-primary-foreground border-primary shadow-sm'
            : 'bg-card text-muted-foreground border-border hover:bg-muted hover:text-foreground'
          }`}
      >
        <Package className="w-3.5 h-3.5" />
        Backlog
      </button>

      {/* Tabs: sprints */}
      {sprints.map(sprint => {
        const badge = statusBadge[sprint.status] ?? statusBadge.planning
        const isSelected = selectedSprintId === sprint.id
        return (
          <button
            key={sprint.id}
            onClick={() => onSelect(sprint.id)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border
              ${isSelected
                ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                : 'bg-card text-muted-foreground border-border hover:bg-muted hover:text-foreground'
              }`}
          >
            <span className="max-w-[140px] truncate">{sprint.name}</span>
            <Badge
              variant="secondary"
              className={`text-[10px] px-1.5 py-0 h-4 ${isSelected ? 'bg-white/20 text-inherit' : badge.className}`}
            >
              {badge.label}
            </Badge>
          </button>
        )
      })}

      {/* Botón nuevo sprint (PM/admin) */}
      {canManage && (
        <Button
          variant="outline"
          size="sm"
          onClick={onNewSprint}
          className="h-8 gap-1.5 text-sm"
        >
          <Plus className="w-3.5 h-3.5" /> Nuevo Sprint
        </Button>
      )}
    </div>
  )
}
