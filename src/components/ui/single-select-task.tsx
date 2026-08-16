'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { GitBranch, Search, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Label } from '@/components/ui/label'

export interface TaskOption {
  id: string
  task_number: number | null
  title: string
  status?: string
}

interface SingleSelectTaskProps {
  tasks: TaskOption[]
  selectedId: string | null
  onSelectionChange: (id: string | null) => void
  excludeTaskId?: string
  placeholder?: string
  emptyLabel?: string
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

function formatTaskLabel(task: Pick<TaskOption, 'task_number' | 'title'>) {
  if (task.task_number != null) {
    return `#${task.task_number} ${task.title}`
  }
  return task.title
}

export function SingleSelectTask({
  tasks,
  selectedId,
  onSelectionChange,
  excludeTaskId,
  placeholder = 'Buscar por # o título...',
  emptyLabel = 'Sin dependencia',
  disabled = false,
  label = 'Dependencia',
  hint,
}: SingleSelectTaskProps) {
  const [search, setSearch] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const availableTasks = useMemo(
    () => tasks.filter(t => t.id !== excludeTaskId),
    [tasks, excludeTaskId]
  )

  const filteredTasks = useMemo(
    () => availableTasks.filter(t => matchesTaskSearch(t, search)),
    [availableTasks, search]
  )

  const selectedTask = availableTasks.find(t => t.id === selectedId)
    ?? tasks.find(t => t.id === selectedId)
    ?? null

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

  const handleSelect = (taskId: string) => {
    onSelectionChange(taskId)
    setIsOpen(false)
    setSearch('')
  }

  const handleClear = (event: React.MouseEvent) => {
    event.stopPropagation()
    onSelectionChange(null)
    setSearch('')
  }

  const handleClearFromList = () => {
    onSelectionChange(null)
    setIsOpen(false)
    setSearch('')
  }

  return (
    <div className="space-y-2">
      {label ? <Label>{label}</Label> : null}
      {hint ? <p className="text-xs text-muted-foreground -mt-1">{hint}</p> : null}

      <div ref={containerRef} className="relative">
        <button
          type="button"
          disabled={disabled}
          onClick={() => {
            if (disabled) return
            setIsOpen(prev => !prev)
            setTimeout(() => inputRef.current?.focus(), 50)
          }}
          className={cn(
            'w-full flex items-center gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm transition-colors',
            'hover:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
            disabled && 'opacity-50 cursor-not-allowed',
            isOpen && 'border-ring ring-2 ring-ring'
          )}
        >
          {selectedTask ? (
            <>
              <GitBranch className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              <span className="flex-1 text-left truncate">{formatTaskLabel(selectedTask)}</span>
              {!disabled && (
                <X
                  className="w-3.5 h-3.5 text-muted-foreground hover:text-foreground flex-shrink-0"
                  onClick={handleClear}
                />
              )}
            </>
          ) : (
            <>
              <Search className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              <span className="flex-1 text-left text-muted-foreground">{placeholder}</span>
            </>
          )}
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
              <button
                type="button"
                onClick={handleClearFromList}
                className={cn(
                  'w-full flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:bg-accent transition-colors',
                  !selectedId && 'bg-accent/50'
                )}
              >
                <div className="w-5 h-5 rounded-full border-2 border-dashed border-muted-foreground/40 flex-shrink-0" />
                {emptyLabel}
              </button>

              {filteredTasks.length === 0 ? (
                <p className="px-3 py-2 text-sm text-muted-foreground">No se encontraron tareas</p>
              ) : (
                filteredTasks.map(task => (
                  <button
                    key={task.id}
                    type="button"
                    onClick={() => handleSelect(task.id)}
                    className={cn(
                      'w-full text-left px-3 py-2 text-sm hover:bg-accent transition-colors truncate',
                      selectedId === task.id && 'bg-accent'
                    )}
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
