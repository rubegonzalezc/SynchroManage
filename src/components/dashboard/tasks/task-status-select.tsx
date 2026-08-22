'use client'

import Link from 'next/link'
import { Bug } from 'lucide-react'
import { SelectItem } from '@/components/ui/select'
import {
  formatBlockedByDependencyMessage,
  getPendingDependencies,
  isAdvancedTaskStatus,
  type TaskDependencyRef,
} from '@/lib/utils/task-dependency'
import type { BlockingBugRef } from '@/lib/utils/task-open-bugs'
import { cn } from '@/lib/utils'

export const TASK_STATUS_OPTIONS = [
  { value: 'backlog', label: 'Backlog' },
  { value: 'todo', label: 'Por Hacer' },
  { value: 'in_progress', label: 'En Progreso' },
  { value: 'review', label: 'En Revisión' },
  { value: 'done', label: 'Completado' },
] as const

const OPEN_BUGS_DONE_TOOLTIP =
  'Cierra o resuelve los bugs vinculados antes de marcar la tarea como completada'

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

export function OpenBugsBlockedWarning({
  blockingBugs,
  projectId,
  className,
}: {
  blockingBugs: BlockingBugRef[]
  projectId: string
  className?: string
}) {
  if (blockingBugs.length === 0) return null

  return (
    <div
      className={cn(
        'rounded-lg border border-red-200 bg-red-50 dark:bg-red-950/30 dark:border-red-800 px-3 py-2 text-sm text-red-900 dark:text-red-200',
        className
      )}
    >
      <div className="flex items-start gap-2">
        <Bug className="w-4 h-4 mt-0.5 shrink-0" />
        <div className="space-y-2">
          <p>
            No puedes marcar esta tarea como completada mientras tenga bugs abiertos o en progreso:
          </p>
          <ul className="space-y-1">
            {blockingBugs.map((bug) => (
              <li key={bug.id}>
                <Link
                  href={`/projects/${projectId}?tab=bugs&bug=${bug.id}`}
                  className="font-medium underline underline-offset-2 hover:text-red-700 dark:hover:text-red-100"
                >
                  {bug.title}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}

export function renderTaskStatusSelectItems(
  dependencyTasks: TaskDependencyRef[],
  blockingBugs: BlockingBugRef[] = []
) {
  const pendingDependencies = getPendingDependencies(dependencyTasks)
  const dependencyBlockedTooltip =
    pendingDependencies.length > 0
      ? formatBlockedByDependencyMessage(pendingDependencies)
      : undefined
  const hasBlockingBugs = blockingBugs.length > 0

  return TASK_STATUS_OPTIONS.map(({ value, label }) => {
    const blockedByDependency = Boolean(dependencyBlockedTooltip && isAdvancedTaskStatus(value))
    const blockedByOpenBugs = value === 'done' && hasBlockingBugs
    const disabled = blockedByDependency || blockedByOpenBugs
    const tooltipTitle = blockedByOpenBugs
      ? OPEN_BUGS_DONE_TOOLTIP
      : blockedByDependency
        ? dependencyBlockedTooltip
        : undefined

    return (
      <SelectItem
        key={value}
        value={value}
        disabled={disabled}
        tooltipTitle={disabled ? tooltipTitle : undefined}
      >
        {label}
      </SelectItem>
    )
  })
}
