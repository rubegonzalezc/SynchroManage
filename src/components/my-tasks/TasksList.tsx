'use client'

import { useState, useMemo } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Popover, PopoverContent, PopoverTrigger,
} from '@/components/ui/popover'
import {
  Loader2, Search, ExternalLink, AlertTriangle, CheckCircle2,
  Clock, RefreshCw, GitBranch, Layers, X, ChevronDown,
} from 'lucide-react'
import Link from 'next/link'
import { TaskDetailDialogStandalone } from '@/components/dashboard/tasks/TaskDetailDialogStandalone'

export interface Task {
  id: string
  task_number: number | null
  title: string
  description: string | null
  status: string
  priority: string
  category?: string
  due_date: string | null
  sprint_id: string | null
  is_carry_over?: boolean
  project: { id: string; name: string; type?: string; company?: { id: string; name: string } | null } | null
  sprint?: { id: string; name: string; status: string } | null
}

interface TasksListProps {
  tasks: Task[]
  loading: boolean
  onTaskUpdated: () => void
  showProject?: boolean
}

const statusLabels: Record<string, string> = {
  backlog: 'Backlog',
  todo: 'Por Hacer',
  in_progress: 'En Progreso',
  review: 'En Revisión',
  done: 'Completado',
}

const statusColors: Record<string, string> = {
  backlog: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  todo: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  in_progress: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  review: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  done: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
}

const priorityColors: Record<string, string> = {
  low: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
  medium: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
  high: 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400',
  urgent: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
}

const priorityLabels: Record<string, string> = {
  low: 'Baja', medium: 'Media', high: 'Alta', urgent: 'Urgente',
}

const priorityDot: Record<string, string> = {
  low: 'bg-slate-400',
  medium: 'bg-blue-500',
  high: 'bg-orange-500',
  urgent: 'bg-red-500',
}

const categoryConfig: Record<string, { label: string; color: string; icon: string }> = {
  task:        { label: 'Tarea',     color: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',       icon: '📋' },
  bug:         { label: 'Bug',       color: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',             icon: '🐛' },
  feature:     { label: 'Feature',   color: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400', icon: '✨' },
  hotfix:      { label: 'Hotfix',    color: 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400', icon: '🔥' },
  fix:         { label: 'Fix',       color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400', icon: '🔧' },
  improvement: { label: 'Mejora',    color: 'bg-cyan-100 text-cyan-600 dark:bg-cyan-900/30 dark:text-cyan-400',         icon: '📈' },
  refactor:    { label: 'Refactor',  color: 'bg-teal-100 text-teal-600 dark:bg-teal-900/30 dark:text-teal-400',         icon: '♻️' },
  docs:        { label: 'Docs',      color: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',         icon: '📝' },
  test:        { label: 'Test',      color: 'bg-pink-100 text-pink-600 dark:bg-pink-900/30 dark:text-pink-400',         icon: '🧪' },
  chore:       { label: 'Chore',     color: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',           icon: '🔨' },
}

function getBranchName(task: Task): string {
  const cat = task.category || 'task'
  const num = task.task_number ? `#${task.task_number}` : ''
  const slug = task.title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .slice(0, 30)
  return `${cat}/${num}-${slug}`
}

// Helper para toggle de sets multi-select
function toggleSet(set: Set<string>, value: string): Set<string> {
  const next = new Set(set)
  if (next.has(value)) next.delete(value)
  else next.add(value)
  return next
}

// Componente de filtro multi-select reutilizable
function MultiSelectFilter({
  label,
  options,
  selected,
  onToggle,
  onClear,
}: {
  label: string
  options: { value: string; label: string; dot?: string }[]
  selected: Set<string>
  onToggle: (v: string) => void
  onClear: () => void
}) {
  const count = selected.size
  const isActive = count > 0

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={`h-8 gap-1.5 text-sm font-normal px-3 ${isActive ? 'border-primary text-primary bg-primary/5' : 'text-muted-foreground'}`}
        >
          {label}
          {isActive && (
            <span className="bg-primary text-primary-foreground text-xs rounded-full w-4 h-4 flex items-center justify-center font-semibold leading-none">
              {count}
            </span>
          )}
          <ChevronDown className="w-3.5 h-3.5 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-48 p-1" sideOffset={6}>
        {options.map(opt => (
          <label
            key={opt.value}
            className="flex items-center gap-2.5 px-2 py-1.5 rounded-md hover:bg-muted cursor-pointer transition-colors"
          >
            <Checkbox
              checked={selected.has(opt.value)}
              onCheckedChange={() => onToggle(opt.value)}
              className="flex-shrink-0"
            />
            {opt.dot && <span className={`w-2 h-2 rounded-full flex-shrink-0 ${opt.dot}`} />}
            <span className="text-sm">{opt.label}</span>
          </label>
        ))}
        {isActive && (
          <>
            <div className="border-t border-border mt-1 pt-1">
              <button
                onClick={onClear}
                className="w-full text-xs text-muted-foreground hover:text-foreground text-left px-2 py-1.5 rounded-md hover:bg-muted transition-colors"
              >
                Limpiar selección
              </button>
            </div>
          </>
        )}
      </PopoverContent>
    </Popover>
  )
}

export function TasksList({ tasks, loading, onTaskUpdated, showProject = true }: TasksListProps) {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<Set<string>>(new Set())
  const [priorityFilter, setPriorityFilter] = useState<Set<string>>(new Set())
  const [categoryFilter, setCategoryFilter] = useState<Set<string>>(new Set())
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)

  const isOverdue = (dueDate: string | null, status: string) => {
    if (!dueDate || status === 'done') return false
    return new Date(dueDate + 'T00:00:00') < new Date()
  }

  const filteredTasks = useMemo(() => {
    const SPRINT_ORDER: Record<string, number> = { active: 0, planning: 1 }
    const PRIORITY_ORDER: Record<string, number> = { urgent: 0, high: 1, medium: 2, low: 3 }

    return tasks
      .filter(task => {
        const matchesSearch =
          task.title.toLowerCase().includes(search.toLowerCase()) ||
          task.project?.name.toLowerCase().includes(search.toLowerCase()) ||
          `#${task.task_number}`.includes(search)
        const matchesStatus = statusFilter.size === 0 || statusFilter.has(task.status)
        const matchesPriority = priorityFilter.size === 0 || priorityFilter.has(task.priority)
        const matchesCategory = categoryFilter.size === 0 || categoryFilter.has(task.category ?? 'task')
        return matchesSearch && matchesStatus && matchesPriority && matchesCategory
      })
      .sort((a, b) => {
        // 1. Tareas "done" siempre al final
        const aDone = a.status === 'done' ? 1 : 0
        const bDone = b.status === 'done' ? 1 : 0
        if (aDone !== bDone) return aDone - bDone

        // 2. Carry Over tiene prioridad máxima dentro de su grupo de sprint
        const aCarry = a.is_carry_over ? 0 : 1
        const bCarry = b.is_carry_over ? 0 : 1
        if (aCarry !== bCarry) return aCarry - bCarry

        // 3. Orden por estado del sprint: activo → planning → backlog
        const aSprintOrder = a.sprint ? (SPRINT_ORDER[a.sprint.status] ?? 2) : 3
        const bSprintOrder = b.sprint ? (SPRINT_ORDER[b.sprint.status] ?? 2) : 3
        if (aSprintOrder !== bSprintOrder) return aSprintOrder - bSprintOrder

        // 4. Dentro del mismo sprint: primero vencidas
        const aOverdue = isOverdue(a.due_date, a.status) ? 0 : 1
        const bOverdue = isOverdue(b.due_date, b.status) ? 0 : 1
        if (aOverdue !== bOverdue) return aOverdue - bOverdue

        // 5. Prioridad (urgent → high → medium → low)
        const aPriority = PRIORITY_ORDER[a.priority] ?? 99
        const bPriority = PRIORITY_ORDER[b.priority] ?? 99
        if (aPriority !== bPriority) return aPriority - bPriority

        // 6. Fecha de entrega más próxima primero
        if (a.due_date && b.due_date) {
          return new Date(a.due_date).getTime() - new Date(b.due_date).getTime()
        }
        if (a.due_date) return -1
        if (b.due_date) return 1

        return 0
      })
  }, [tasks, search, statusFilter, priorityFilter, categoryFilter]) // eslint-disable-line react-hooks/exhaustive-deps

  const pendingCount = tasks.filter(t => t.status !== 'done').length
  const completedCount = tasks.filter(t => t.status === 'done').length
  const overdueCount = tasks.filter(t => isOverdue(t.due_date, t.status)).length
  const carryOverCount = tasks.filter(t => t.is_carry_over).length

  const hasActiveFilters = search !== '' || statusFilter.size > 0 || priorityFilter.size > 0 || categoryFilter.size > 0

  const formatDate = (date: string | null) => {
    if (!date) return null
    return new Date(date + 'T00:00:00').toLocaleDateString('es-CL', { day: '2-digit', month: 'short' })
  }

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col bg-card rounded-xl border border-border overflow-hidden">
      {/* Stats row */}
      <div className="grid grid-cols-4 divide-x divide-border border-b border-border">
        <div className="flex items-center gap-2.5 px-4 py-3">
          <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
            <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <p className="text-lg font-bold text-foreground leading-none">{pendingCount}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Pendientes</p>
          </div>
        </div>
        <div className="flex items-center gap-2.5 px-4 py-3">
          <div className="w-8 h-8 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0">
            <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <p className="text-lg font-bold text-foreground leading-none">{completedCount}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Completadas</p>
          </div>
        </div>
        <div className="flex items-center gap-2.5 px-4 py-3">
          <div className="w-8 h-8 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400" />
          </div>
          <div>
            <p className="text-lg font-bold text-foreground leading-none">{overdueCount}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Vencidas</p>
          </div>
        </div>
        <div className="flex items-center gap-2.5 px-4 py-3">
          <div className="w-8 h-8 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center flex-shrink-0">
            <RefreshCw className="w-4 h-4 text-orange-600 dark:text-orange-400" />
          </div>
          <div>
            <p className="text-lg font-bold text-foreground leading-none">{carryOverCount}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Carry Over</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="p-3 border-b border-border flex flex-wrap gap-2 items-center">
        <div className="relative flex-1 min-w-[160px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input
            placeholder="Buscar tarea..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-8 text-sm"
          />
        </div>

        <MultiSelectFilter
          label="Estado"
          selected={statusFilter}
          onToggle={(v) => setStatusFilter(prev => toggleSet(prev, v))}
          onClear={() => setStatusFilter(new Set())}
          options={[
            { value: 'backlog', label: 'Backlog', dot: 'bg-slate-400' },
            { value: 'todo', label: 'Por Hacer', dot: 'bg-blue-500' },
            { value: 'in_progress', label: 'En Progreso', dot: 'bg-amber-500' },
            { value: 'review', label: 'En Revisión', dot: 'bg-purple-500' },
            { value: 'done', label: 'Completado', dot: 'bg-green-500' },
          ]}
        />

        <MultiSelectFilter
          label="Prioridad"
          selected={priorityFilter}
          onToggle={(v) => setPriorityFilter(prev => toggleSet(prev, v))}
          onClear={() => setPriorityFilter(new Set())}
          options={[
            { value: 'urgent', label: 'Urgente', dot: 'bg-red-500' },
            { value: 'high', label: 'Alta', dot: 'bg-orange-500' },
            { value: 'medium', label: 'Media', dot: 'bg-blue-500' },
            { value: 'low', label: 'Baja', dot: 'bg-slate-400' },
          ]}
        />

        <MultiSelectFilter
          label="Tipo/Rama"
          selected={categoryFilter}
          onToggle={(v) => setCategoryFilter(prev => toggleSet(prev, v))}
          onClear={() => setCategoryFilter(new Set())}
          options={Object.entries(categoryConfig).map(([key, cfg]) => ({
            value: key,
            label: `${cfg.icon} ${cfg.label}`,
          }))}
        />

        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-2 text-muted-foreground hover:text-foreground gap-1"
            onClick={() => { setSearch(''); setStatusFilter(new Set()); setPriorityFilter(new Set()); setCategoryFilter(new Set()) }}
          >
            <X className="w-3.5 h-3.5" />
            <span className="text-xs">Limpiar</span>
          </Button>
        )}
      </div>

      {/* Task list */}
      <div className="flex-1 overflow-y-auto">
        {filteredTasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full py-16 text-center">
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
              <CheckCircle2 className="w-6 h-6 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground text-sm">
              {tasks.length === 0 ? 'No tienes tareas asignadas' : 'Sin resultados para los filtros aplicados'}
            </p>
            {hasActiveFilters && (
              <Button
                variant="link"
                size="sm"
                className="mt-2 text-xs"
                onClick={() => { setSearch(''); setStatusFilter(new Set()); setPriorityFilter(new Set()); setCategoryFilter(new Set()) }}
              >
                Limpiar filtros
              </Button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-border">
            {filteredTasks.map((task, idx) => {
              const cat = categoryConfig[task.category || 'task'] ?? categoryConfig.task
              const overdue = isOverdue(task.due_date, task.status)
              const branchName = getBranchName(task)

              // Determinar si hay cambio de grupo de sprint respecto a la tarea anterior
              const getSprintGroup = (t: Task) => {
                if (t.status === 'done') return 'done'
                if (!t.sprint) return 'backlog'
                return t.sprint.id
              }
              const prevTask = filteredTasks[idx - 1]
              const groupChanged = idx > 0 && getSprintGroup(task) !== getSprintGroup(prevTask)

              // Etiqueta del grupo
              const getGroupLabel = () => {
                if (task.status === 'done') return null
                if (!task.sprint) return { label: 'Backlog', color: 'text-muted-foreground', dot: 'bg-slate-400' }
                if (task.sprint.status === 'active') return { label: `Sprint activo · ${task.sprint.name}`, color: 'text-primary', dot: 'bg-primary' }
                if (task.sprint.status === 'planning') return { label: `En planificación · ${task.sprint.name}`, color: 'text-amber-600 dark:text-amber-400', dot: 'bg-amber-500' }
                return { label: task.sprint.name, color: 'text-muted-foreground', dot: 'bg-slate-400' }
              }

              const showHeader = idx === 0 || groupChanged
              const groupLabel = showHeader ? getGroupLabel() : null

              return (
                <div key={task.id}>
                  {/* Separador de grupo de sprint */}
                  {groupLabel && (
                    <div className={`flex items-center gap-2 px-4 py-2 bg-muted/30 border-b border-border ${idx > 0 ? 'border-t border-border' : ''}`}>
                      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${groupLabel.dot}`} />
                      <span className={`text-xs font-semibold ${groupLabel.color}`}>{groupLabel.label}</span>
                    </div>
                  )}
                <div
                  onClick={() => setSelectedTaskId(task.id)}
                  className="group p-4 hover:bg-muted/40 cursor-pointer transition-colors"
                >
                  {/* Top row: number + status + priority */}
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className="text-xs font-mono text-muted-foreground">#{task.task_number}</span>
                    <Badge variant="secondary" className={`text-xs px-2 py-0 h-5 ${statusColors[task.status]}`}>
                      {statusLabels[task.status]}
                    </Badge>
                    <div className="flex items-center gap-1">
                      <span className={`w-1.5 h-1.5 rounded-full ${priorityDot[task.priority] || 'bg-slate-400'}`} />
                      <span className="text-xs text-muted-foreground">{priorityLabels[task.priority]}</span>
                    </div>
                    {task.is_carry_over && (
                      <div className="flex items-center gap-1 text-xs text-orange-600 dark:text-orange-400">
                        <RefreshCw className="w-3 h-3" />
                        <span className="font-medium">Carry Over</span>
                      </div>
                    )}
                    {task.due_date && (
                      <div className={`ml-auto text-xs flex items-center gap-1 flex-shrink-0 ${
                        overdue ? 'text-red-600 dark:text-red-400 font-semibold' : 'text-muted-foreground'
                      }`}>
                        {overdue && <AlertTriangle className="w-3 h-3" />}
                        {formatDate(task.due_date)}
                      </div>
                    )}
                  </div>

                  {/* Title */}
                  <p className="font-medium text-foreground text-sm leading-snug mb-2.5 group-hover:text-primary transition-colors">
                    {task.title}
                  </p>

                  {/* Bottom row: category/branch + sprint + project */}
                  <div className="flex items-center gap-2 flex-wrap">
                    {/* Categoría / Rama de creación */}
                    <div className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${cat.color}`}>
                      <GitBranch className="w-3 h-3" />
                      <span className="font-mono">{branchName}</span>
                    </div>

                    {/* Sprint */}
                    {task.sprint ? (
                      <div className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                        <Layers className="w-3 h-3" />
                        <span>{task.sprint.name}</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                        <Layers className="w-3 h-3" />
                        <span>Backlog</span>
                      </div>
                    )}

                    {/* Proyecto (solo en vista "Todas") */}
                    {showProject && task.project && (
                      <Link
                        href={task.project.type === 'change_control' ? `/change-controls/${task.project.id}` : `/projects/${task.project.id}`}
                        onClick={(e) => e.stopPropagation()}
                        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors ml-auto"
                      >
                        <span className="truncate max-w-[120px]">{task.project.name}</span>
                        <ExternalLink className="w-3 h-3 flex-shrink-0" />
                      </Link>
                    )}
                  </div>
                </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Task Detail Dialog */}
      {selectedTaskId && (
        <TaskDetailDialogStandalone
          taskId={selectedTaskId}
          open={!!selectedTaskId}
          onOpenChange={(open: boolean) => !open && setSelectedTaskId(null)}
          onTaskUpdated={onTaskUpdated}
        />
      )}
    </div>
  )
}
