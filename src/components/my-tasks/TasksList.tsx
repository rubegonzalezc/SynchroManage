'use client'

import { useState, useMemo } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Loader2, Search, ExternalLink, AlertTriangle, CheckCircle2,
  Clock, RefreshCw, GitBranch, Layers, X,
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

export function TasksList({ tasks, loading, onTaskUpdated, showProject = true }: TasksListProps) {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [priorityFilter, setPriorityFilter] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)

  const isOverdue = (dueDate: string | null, status: string) => {
    if (!dueDate || status === 'done') return false
    return new Date(dueDate + 'T00:00:00') < new Date()
  }

  const filteredTasks = useMemo(() => tasks.filter(task => {
    const matchesSearch =
      task.title.toLowerCase().includes(search.toLowerCase()) ||
      task.project?.name.toLowerCase().includes(search.toLowerCase()) ||
      `#${task.task_number}`.includes(search)
    const matchesStatus = statusFilter === 'all' || task.status === statusFilter
    const matchesPriority = priorityFilter === 'all' || task.priority === priorityFilter
    const matchesCategory = categoryFilter === 'all' || task.category === categoryFilter
    return matchesSearch && matchesStatus && matchesPriority && matchesCategory
  }), [tasks, search, statusFilter, priorityFilter, categoryFilter])

  const pendingCount = tasks.filter(t => t.status !== 'done').length
  const completedCount = tasks.filter(t => t.status === 'done').length
  const overdueCount = tasks.filter(t => isOverdue(t.due_date, t.status)).length
  const carryOverCount = tasks.filter(t => t.is_carry_over).length

  const hasActiveFilters = search !== '' || statusFilter !== 'all' || priorityFilter !== 'all' || categoryFilter !== 'all'

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
      <div className="p-3 border-b border-border flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[160px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input
            placeholder="Buscar tarea..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-8 text-sm"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[130px] h-8 text-sm">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los estados</SelectItem>
            <SelectItem value="backlog">Backlog</SelectItem>
            <SelectItem value="todo">Por Hacer</SelectItem>
            <SelectItem value="in_progress">En Progreso</SelectItem>
            <SelectItem value="review">En Revisión</SelectItem>
            <SelectItem value="done">Completado</SelectItem>
          </SelectContent>
        </Select>
        <Select value={priorityFilter} onValueChange={setPriorityFilter}>
          <SelectTrigger className="w-[120px] h-8 text-sm">
            <SelectValue placeholder="Prioridad" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Prioridad</SelectItem>
            <SelectItem value="urgent">Urgente</SelectItem>
            <SelectItem value="high">Alta</SelectItem>
            <SelectItem value="medium">Media</SelectItem>
            <SelectItem value="low">Baja</SelectItem>
          </SelectContent>
        </Select>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-[130px] h-8 text-sm">
            <SelectValue placeholder="Tipo/Rama" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los tipos</SelectItem>
            {Object.entries(categoryConfig).map(([key, cfg]) => (
              <SelectItem key={key} value={key}>{cfg.icon} {cfg.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-2 text-muted-foreground hover:text-foreground"
            onClick={() => { setSearch(''); setStatusFilter('all'); setPriorityFilter('all'); setCategoryFilter('all') }}
          >
            <X className="w-3.5 h-3.5" />
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
                onClick={() => { setSearch(''); setStatusFilter('all'); setPriorityFilter('all'); setCategoryFilter('all') }}
              >
                Limpiar filtros
              </Button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-border">
            {filteredTasks.map((task) => {
              const cat = categoryConfig[task.category || 'task'] ?? categoryConfig.task
              const overdue = isOverdue(task.due_date, task.status)
              const branchName = getBranchName(task)

              return (
                <div
                  key={task.id}
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
