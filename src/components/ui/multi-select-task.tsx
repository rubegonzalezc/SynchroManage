'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { GitBranch, Search, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import type { TaskOption } from '@/components/ui/single-select-task'
import { formatDependencyLabel } from '@/lib/utils/task-dependency'

export type { TaskOption }

interface MultiSelectTaskProps {
  tasks: TaskOption[]
  selectedIds: string[]
  onSelectionChange: (ids: string[]) => void
  excludeTaskId?: string
  placeholder?: string
  disabled?: boolean
  label?: string
  hint?: string
}

function matchesTaskSearch(task: TaskOption, query: string) {
  const q = query.trim().toLowerCase()
  if (!q) return true
  const numeric = q.replace(/^#/, '')
  return (
    task.title.toLowerCase().includes(q) ||
    (task.task_number != null && (
      String(task.task_number).includes(numeric) ||
      `#${task.task_number}`.includes(q)
    ))
  )
}

export function MultiSelectTask({
  tasks,
  selectedIds,
  onSelectionChange,
  excludeTaskId,
  placeholder = 'Buscar por # o título...',
  disabled = false,
  label = 'Dependencias',
  hint,
}: MultiSelectTaskProps) {
  const [search, setSearch] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const availableTasks = useMemo(
    () => tasks.filter((task) => task.id !== excludeTaskId && !selectedIds.includes(task.id)),
    [tasks, excludeTaskId, selectedIds]
  )

  const filteredTasks = useMemo(
    () => availableTasks.filter((task) => matchesTaskSearch(task, search)),
    [availableTasks, search]
  )

  const selectedTasks = useMemo(() => {
    const byId = new Map(tasks.map((task) => [task.id, task]))
    return selectedIds
      .map((id) => byId.get(id))
      .filter((task): task is TaskOption => !!task)
  }, [tasks, selectedIds])

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

  const handleAdd = (taskId: string) => {
    onSelectionChange([...selectedIds, taskId])
    setSearch('')
    setTimeout(() => inputRef.current?.focus(), 50)
  }

  const handleRemove = (taskId: string) => {
    onSelectionChange(selectedIds.filter((id) => id !== taskId))
  }

  return (
    <div className="space-y-2">
      {label ? <Label>{label}</Label> : null}
      {hint ? <p className="text-xs text-muted-foreground -mt-1">{hint}</p> : null}

      {selectedTasks.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selectedTasks.map((task) => (
            <Badge key={task.id} variant="secondary" className="gap-1 pr-1 font-normal">
              <GitBranch className="w-3 h-3 text-muted-foreground" />
              <span className="max-w-[220px] truncate">{formatDependencyLabel(task)}</span>
              {!disabled && (
                <button
                  type="button"
                  onClick={() => handleRemove(task.id)}
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
          <Search className="w-4 h-4 text-muted-foreground flex-shrink-0" />
          <span className="flex-1 text-left text-muted-foreground">
            {selectedTasks.length > 0 ? 'Añadir otra dependencia...' : placeholder}
          </span>
        </button>

        {isOpen && (
          <div className="absolute z-50 mt-1 w-full rounded-md border border-border bg-popover shadow-md">
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
                    setIsOpen(false)
                    setSearch('')
                  }
                }}
              />
            </div>

            <div className="max-h-48 overflow-y-auto py-1">
              {filteredTasks.length === 0 ? (
                <p className="px-3 py-2 text-sm text-muted-foreground">
                  {availableTasks.length === 0 ? 'No hay más tareas disponibles' : 'No se encontraron tareas'}
                </p>
              ) : (
                filteredTasks.map((task) => (
                  <button
                    key={task.id}
                    type="button"
                    onClick={() => handleAdd(task.id)}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-accent transition-colors truncate"
                  >
                    {task.task_number != null ? (
                      <span className="text-muted-foreground font-mono mr-1">#{task.task_number}</span>
                    ) : null}
                    {task.title}
                  </button>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
