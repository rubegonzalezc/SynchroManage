'use client'

import { Plus, Package } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { GlassPanel } from '@/components/ui/glass-panel'
import type { Sprint } from './CreateSprintDialog'

interface SprintSelectorProps {
  sprints: Sprint[]
  selectedSprintId: string | null
  onSelect: (sprintId: string | null) => void
  canManage: boolean
  onNewSprint: () => void
}

const statusLabel: Record<string, string> = {
  planning: 'Plan.',
  active: 'Activo',
  completed: 'Hecho',
}

export function SprintSelector({ sprints, selectedSprintId, onSelect, canManage, onNewSprint }: SprintSelectorProps) {
  return (
    <GlassPanel padding={1} sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
      <button
        type="button"
        onClick={() => onSelect(null)}
        className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[13px] font-medium transition-colors
          ${selectedSprintId === null
            ? 'bg-primary text-primary-foreground shadow-[0_6px_16px_rgba(37,99,235,0.28)]'
            : 'text-muted-foreground hover:bg-black/5 dark:hover:bg-white/8 hover:text-foreground'
          }`}
      >
        <Package className="w-3.5 h-3.5" />
        Backlog
      </button>

      {sprints.map(sprint => {
        const isSelected = selectedSprintId === sprint.id
        return (
          <button
            type="button"
            key={sprint.id}
            onClick={() => onSelect(sprint.id)}
            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[13px] font-medium transition-colors
              ${isSelected
                ? 'bg-primary text-primary-foreground shadow-[0_6px_16px_rgba(37,99,235,0.28)]'
                : 'text-muted-foreground hover:bg-black/5 dark:hover:bg-white/8 hover:text-foreground'
              }`}
          >
            <span className="max-w-[140px] truncate">{sprint.name}</span>
            <span className={`text-[10px] ${isSelected ? 'text-white/80' : 'text-muted-foreground'}`}>
              {statusLabel[sprint.status] ?? 'Plan.'}
            </span>
          </button>
        )
      })}

      {canManage && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onNewSprint}
          className="h-8 gap-1.5 text-[13px] rounded-full ml-auto"
        >
          <Plus className="w-3.5 h-3.5" /> Nuevo Sprint
        </Button>
      )}
    </GlassPanel>
  )
}
