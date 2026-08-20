'use client'

import { SprintTaskSelect, type SprintTaskOption } from '@/components/ui/sprint-task-select'

export interface TaskOption extends SprintTaskOption {}

export type { SprintTaskOption }

interface SingleSelectTaskProps {
  tasks: TaskOption[]
  sprints?: Array<{ id: string; name: string; status?: string; order_index?: number }>
  currentSprintId?: string | null
  selectedId: string | null
  onSelectionChange: (id: string | null) => void
  excludeTaskId?: string
  placeholder?: string
  emptyLabel?: string
  disabled?: boolean
  label?: string
  hint?: string
}

export function SingleSelectTask({
  tasks,
  sprints = [],
  currentSprintId,
  selectedId,
  onSelectionChange,
  excludeTaskId,
  placeholder = 'Buscar por título, #global, HU-N u orden...',
  emptyLabel = 'Sin dependencias',
  disabled = false,
  label = 'Dependencia',
  hint,
}: SingleSelectTaskProps) {
  return (
    <SprintTaskSelect
      mode="single"
      tasks={tasks}
      sprints={sprints}
      currentSprintId={currentSprintId}
      selectedId={selectedId}
      onSelectionChange={onSelectionChange}
      excludeTaskId={excludeTaskId}
      placeholder={placeholder}
      emptyLabel={emptyLabel}
      disabled={disabled}
      label={label}
      hint={hint}
    />
  )
}
