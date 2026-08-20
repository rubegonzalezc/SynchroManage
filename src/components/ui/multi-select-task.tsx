'use client'

import { SprintTaskSelect, type SprintTaskOption } from '@/components/ui/sprint-task-select'

export type { SprintTaskOption as TaskOption }

interface MultiSelectTaskProps {
  tasks: SprintTaskOption[]
  sprints?: Array<{ id: string; name: string; status?: string; order_index?: number }>
  currentSprintId?: string | null
  selectedIds: string[]
  onSelectionChange: (ids: string[]) => void
  excludeTaskId?: string
  placeholder?: string
  disabled?: boolean
  label?: string
  hint?: string
}

export function MultiSelectTask({
  tasks,
  sprints = [],
  currentSprintId,
  selectedIds,
  onSelectionChange,
  excludeTaskId,
  placeholder = 'Buscar por título, #global, HU-N u orden...',
  disabled = false,
  label = 'Dependencias',
  hint,
}: MultiSelectTaskProps) {
  return (
    <SprintTaskSelect
      mode="multiple"
      tasks={tasks}
      sprints={sprints}
      currentSprintId={currentSprintId}
      selectedIds={selectedIds}
      onSelectionChange={onSelectionChange}
      excludeTaskId={excludeTaskId}
      placeholder={placeholder}
      disabled={disabled}
      label={label}
      hint={hint}
    />
  )
}
