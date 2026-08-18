'use client'

import { SelectItem } from '@/components/ui/select'
import {
  formatBlockedByDependencyMessage,
  getPendingDependencies,
  isAdvancedTaskStatus,
  type TaskDependencyRef,
} from '@/lib/utils/task-dependency'
import { cn } from '@/lib/utils'

export const TASK_STATUS_OPTIONS = [
  { value: 'backlog', label: 'Backlog' },
  { value: 'todo', label: 'Por Hacer' },
  { value: 'in_progress', label: 'En Progreso' },
  { value: 'review', label: 'En Revisión' },
  { value: 'done', label: 'Completado' },
] as const

export function DependencyBlockedWarning({
  dependencyTasks,
  className,
}: {
  dependencyTasks: TaskDependencyRef[]
  className?: string
}) {
  const pendingDependencies = getPendingDependencies(dependencyTasks)
  if (pendingDependencies.length === 0) return null

  return (
    <div
      className={cn(
        'rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-800 px-3 py-2 text-sm text-amber-900 dark:text-amber-200',
        className
      )}
    >
      {formatBlockedByDependencyMessage(pendingDependencies)}
    </div>
  )
}

export function renderTaskStatusSelectItems(dependencyTasks: TaskDependencyRef[]) {
  const pendingDependencies = getPendingDependencies(dependencyTasks)
  const blockedTooltip =
    pendingDependencies.length > 0
      ? formatBlockedByDependencyMessage(pendingDependencies)
      : undefined

  return TASK_STATUS_OPTIONS.map(({ value, label }) => {
    const disabled = Boolean(blockedTooltip && isAdvancedTaskStatus(value))

    return (
      <SelectItem
        key={value}
        value={value}
        disabled={disabled}
        tooltipTitle={disabled ? blockedTooltip : undefined}
      >
        {label}
      </SelectItem>
    )
  })
}
