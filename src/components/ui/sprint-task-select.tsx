'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { GitBranch, Search, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  buildSprintFilterOptions,
  filterTasksBySprint,
  formatSprintTaskDependencyLabel,
  formatSprintTaskDependencyTooltip,
  getDefaultSprintFilter,
  isSameSprintFilter,
  matchesSprintTaskSearch,
  resolveCurrentSprintId,
  type SprintFilterOption,
  type SprintOption,
  type SprintTaskFilter,
  type SprintTaskOption,
} from '@/lib/utils/sprint-task-select'

export type { SprintTaskOption, SprintOption }

type SprintTaskSelectBaseProps = {
  tasks: SprintTaskOption[]
  sprints?: SprintOption[]
  currentSprintId?: string | null
  excludeTaskId?: string
  placeholder?: string
  disabled?: boolean
  label?: string
  hint?: string
}

type SprintTaskSelectSingleProps = SprintTaskSelectBaseProps & {
  mode: 'single'
  selectedId: string | null
  onSelectionChange: (id: string | null) => void
  emptyLabel?: string
}

type SprintTaskSelectMultipleProps = SprintTaskSelectBaseProps & {
  mode: 'multiple'
  selectedIds: string[]
  onSelectionChange: (ids: string[]) => void
}

export type SprintTaskSelectProps = SprintTaskSelectSingleProps | SprintTaskSelectMultipleProps

function SprintFilterChips({
  options,
  value,
  onChange,
}: {
  options: SprintFilterOption[]
  value: SprintTaskFilter
  onChange: (filter: SprintTaskFilter) => void
}) {
  return (
    <div className="flex flex-wrap gap-1 border-b border-border px-2 py-2">
      {options.map((option) => {
        const isActive = isSameSprintFilter(option.value, value)
        const key =
          typeof option.value === 'object'
            ? `sprint-${option.value.sprintId}`
            : option.value

        return (
          <button
            key={key}
            type="button"
            onClick={() => onChange(option.value)}
            className={cn(
              'rounded-md px-2 py-1 text-xs transition-colors',
              isActive
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground'
            )}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}

function TaskListItem({
  task,
  sprints,
  isSelected,
  onClick,
}: {
  task: SprintTaskOption
  sprints: SprintOption[]
  isSelected?: boolean
  onClick: () => void
}) {
  const label = formatSprintTaskDependencyLabel(task, sprints)
  const tooltip = formatSprintTaskDependencyTooltip(task)

  return (
    <button
      type="button"
      title={tooltip}
      onClick={onClick}
      className={cn(
        'w-full text-left px-3 py-2 text-sm hover:bg-accent transition-colors',
        isSelected && 'bg-accent'
      )}
    >
      <span className="block truncate">{label}</span>
    </button>
  )
}

export function SprintTaskSelect(props: SprintTaskSelectProps) {
  const {
    tasks,
    sprints = [],
    currentSprintId,
    excludeTaskId,
    placeholder = 'Buscar por título, #global, HU-N u orden...',
    disabled = false,
    label,
    hint,
    mode,
  } = props

  const [search, setSearch] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [sprintFilter, setSprintFilter] = useState<SprintTaskFilter>(() =>
    getDefaultSprintFilter(sprints, currentSprintId)
  )
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const resolvedCurrentSprintId = useMemo(
    () => resolveCurrentSprintId(sprints, currentSprintId),
    [sprints, currentSprintId]
  )

  const sprintFilterOptions = useMemo(
    () => buildSprintFilterOptions(sprints, currentSprintId),
    [sprints, currentSprintId]
  )

  useEffect(() => {
    if (!isOpen) return
    setSprintFilter(getDefaultSprintFilter(sprints, currentSprintId))
  }, [isOpen, sprints, currentSprintId])

  const availableTasks = useMemo(() => {
    const base = tasks.filter((task) => task.id !== excludeTaskId)
    if (mode === 'multiple') {
      return base.filter((task) => !props.selectedIds.includes(task.id))
    }
    return base
  }, [tasks, excludeTaskId, mode, props])

  const filteredTasks = useMemo(() => {
    const bySprint = filterTasksBySprint(availableTasks, sprintFilter, resolvedCurrentSprintId)
    return bySprint.filter((task) => matchesSprintTaskSearch(task, search))
  }, [availableTasks, sprintFilter, resolvedCurrentSprintId, search])

  const selectedTasks = useMemo(() => {
    const byId = new Map(tasks.map((task) => [task.id, task]))
    if (mode === 'single') {
      const task = byId.get(props.selectedId ?? '')
      return task ? [task] : []
    }
    return props.selectedIds
      .map((id) => byId.get(id))
      .filter((task): task is SprintTaskOption => !!task)
  }, [tasks, mode, props])

  const selectedTask = mode === 'single' ? selectedTasks[0] ?? null : null

  useEffect(() => {
    const handler = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setSearch('')
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const closeDropdown = () => {
    setIsOpen(false)
    setSearch('')
  }

  const handleSelectSingle = (taskId: string) => {
    if (mode !== 'single') return
    props.onSelectionChange(taskId)
    closeDropdown()
  }

  const handleClearSingle = () => {
    if (mode !== 'single') return
    props.onSelectionChange(null)
    setSearch('')
  }

  const handleAddMultiple = (taskId: string) => {
    if (mode !== 'multiple') return
    props.onSelectionChange([...props.selectedIds, taskId])
    setSearch('')
    setTimeout(() => inputRef.current?.focus(), 50)
  }

  const handleRemoveMultiple = (taskId: string) => {
    if (mode !== 'multiple') return
    props.onSelectionChange(props.selectedIds.filter((id) => id !== taskId))
  }

  const emptyLabel = mode === 'single' ? (props.emptyLabel ?? 'Sin dependencias') : undefined

  return (
    <div className="space-y-2">
      {label ? <Label>{label}</Label> : null}
      {hint ? <p className="text-xs text-muted-foreground -mt-1">{hint}</p> : null}

      {mode === 'multiple' && selectedTasks.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selectedTasks.map((task) => (
            <Badge key={task.id} variant="secondary" className="gap-1 pr-1 font-normal">
              <GitBranch className="w-3 h-3 text-muted-foreground" />
              <span
                className="max-w-[280px] truncate"
                title={formatSprintTaskDependencyTooltip(task)}
              >
                {formatSprintTaskDependencyLabel(task, sprints)}
              </span>
              {!disabled && (
                <button
                  type="button"
                  onClick={() => handleRemoveMultiple(task.id)}
                  className="rounded-sm p-0.5 hover:bg-background/80"
                  aria-label={`Quitar ${task.title}`}
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </Badge>
          ))}
        </div>
      )}

      <div ref={containerRef} className="relative">
        <button
          type="button"
          disabled={disabled}
          onClick={() => {
            if (disabled) return
            setIsOpen((prev) => !prev)
            setTimeout(() => inputRef.current?.focus(), 50)
          }}
          className={cn(
            'w-full flex items-center gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm transition-colors',
            'hover:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
            disabled && 'opacity-50 cursor-not-allowed',
            isOpen && 'border-ring ring-2 ring-ring'
          )}
        >
          {mode === 'single' && selectedTask ? (
            <>
              <GitBranch className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              <span
                className="flex-1 text-left truncate"
                title={formatSprintTaskDependencyTooltip(selectedTask)}
              >
                {formatSprintTaskDependencyLabel(selectedTask, sprints)}
              </span>
              {!disabled && (
                <X
                  className="w-3.5 h-3.5 text-muted-foreground hover:text-foreground flex-shrink-0"
                  onClick={(event) => {
                    event.stopPropagation()
                    handleClearSingle()
                  }}
                />
              )}
            </>
          ) : (
            <>
              <Search className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              <span className="flex-1 text-left text-muted-foreground">
                {mode === 'multiple' && selectedTasks.length > 0
                  ? 'Añadir otra dependencia...'
                  : placeholder}
              </span>
            </>
          )}
        </button>

        {isOpen && (
          <div className="absolute z-50 mt-1 w-full rounded-md border border-border bg-popover shadow-md">
            {sprintFilterOptions.length > 1 && (
              <SprintFilterChips
                options={sprintFilterOptions}
                value={sprintFilter}
                onChange={setSprintFilter}
              />
            )}

            <div className="flex items-center gap-2 border-b border-border px-3 py-2">
              <Search className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
              <input
                ref={inputRef}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={placeholder}
                className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                onKeyDown={(e) => {
                  if (e.key === 'Escape') {
                    closeDropdown()
                  }
                }}
              />
            </div>

            <div className="max-h-56 overflow-y-auto py-1">
              {mode === 'single' && emptyLabel && (
                <button
                  type="button"
                  onClick={handleClearSingle}
                  className={cn(
                    'w-full flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:bg-accent transition-colors',
                    !props.selectedId && 'bg-accent/50'
                  )}
                >
                  <div className="w-5 h-5 rounded-full border-2 border-dashed border-muted-foreground/40 flex-shrink-0" />
                  {emptyLabel}
                </button>
              )}

              {filteredTasks.length === 0 ? (
                <p className="px-3 py-2 text-sm text-muted-foreground">
                  {availableTasks.length === 0
                    ? 'No hay más tareas disponibles'
                    : 'No se encontraron tareas'}
                </p>
              ) : (
                filteredTasks.map((task) => (
                  <TaskListItem
                    key={task.id}
                    task={task}
                    sprints={sprints}
                    isSelected={mode === 'single' && props.selectedId === task.id}
                    onClick={() => {
                      if (mode === 'single') {
                        handleSelectSingle(task.id)
                      } else {
                        handleAddMultiple(task.id)
                      }
                    }}
                  />
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
