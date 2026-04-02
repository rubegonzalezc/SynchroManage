'use client'

import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Loader2, Search, ExternalLink, AlertTriangle, CheckCircle2, Clock } from 'lucide-react'
import Link from 'next/link'
import { TaskDetailDialogStandalone } from '@/components/dashboard/tasks/TaskDetailDialogStandalone'
import { categoryIcons, categoryLabels, categoryColors } from '@/lib/constants/categories'

interface Task {
  id: string
  task_number: number | null
  title: string
  description: string | null
  status: string
  priority: string
  category?: string
  due_date: string | null
  project: { id: string; name: string } | null
}

interface TasksListProps {
  tasks: Task[]
  loading: boolean
  onTaskUpdated: () => void
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


export function TasksList({ tasks, loading, onTaskUpdated }: TasksListProps) {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)

  const isOverdue = (dueDate: string | null, status: string) => {
    if (!dueDate || status === 'done') return false
    return new Date(dueDate) < new Date()
  }

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = 
      task.title.toLowerCase().includes(search.toLowerCase()) ||
      task.project?.name.toLowerCase().includes(search.toLowerCase()) ||
      `#${task.task_number}`.includes(search)
    const matchesStatus = statusFilter === 'all' || task.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const pendingCount = tasks.filter(t => t.status !== 'done').length
  const completedCount = tasks.filter(t => t.status === 'done').length
  const overdueCount = tasks.filter(t => isOverdue(t.due_date, t.status)).length

  const formatDate = (date: string | null) => {
    if (!date) return null
    return new Date(date).toLocaleDateString('es-CL', { day: '2-digit', month: 'short' })
  }

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col bg-card rounded-lg border border-border">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-blue-500" />
          <div>
            <p className="text-lg font-bold text-foreground">{pendingCount}</p>
            <p className="text-xs text-muted-foreground">Pendientes</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-green-500" />
          <div>
            <p className="text-lg font-bold text-foreground">{completedCount}</p>
            <p className="text-xs text-muted-foreground">Completadas</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-red-500" />
          <div>
            <p className="text-lg font-bold text-foreground">{overdueCount}</p>
            <p className="text-xs text-muted-foreground">Vencidas</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="p-4 border-b border-border flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[140px] h-9">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="backlog">Backlog</SelectItem>
            <SelectItem value="todo">Por Hacer</SelectItem>
            <SelectItem value="in_progress">En Progreso</SelectItem>
            <SelectItem value="review">En Revisión</SelectItem>
            <SelectItem value="done">Completado</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Tasks List */}
      <div className="flex-1 overflow-y-auto">
        {filteredTasks.length === 0 ? (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            {tasks.length === 0 ? 'No tienes tareas asignadas' : 'Sin resultados'}
          </div>
        ) : (
          <div className="divide-y divide-border">
            {filteredTasks.map((task) => (
              <div
                key={task.id}
                onClick={() => setSelectedTaskId(task.id)}
                className="p-4 hover:bg-muted/50 cursor-pointer transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-xs font-mono text-muted-foreground">#{task.task_number}</span>
                      <Badge variant="secondary" className={`text-xs ${statusColors[task.status]}`}>
                        {statusLabels[task.status]}
                      </Badge>
                      <Badge variant="secondary" className={`text-xs ${priorityColors[task.priority]}`}>
                        {priorityLabels[task.priority]}
                      </Badge>
                      {task.category && (
                        <Badge variant="secondary" className={`text-xs ${categoryColors[task.category] || categoryColors.task}`}>
                          {categoryIcons[task.category]} {categoryLabels[task.category] || 'Tarea'}
                        </Badge>
                      )}
                    </div>
                    <p className="font-medium text-foreground truncate">{task.title}</p>
                    {task.project && (
                      <Link
                        href={`/projects/${task.project.id}`}
                        onClick={(e) => e.stopPropagation()}
                        className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 mt-1"
                      >
                        {task.project.name}
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                    )}
                  </div>
                  {task.due_date && (
                    <div className={`text-xs whitespace-nowrap ${
                      isOverdue(task.due_date, task.status) 
                        ? 'text-red-600 dark:text-red-400 font-medium' 
                        : 'text-muted-foreground'
                    }`}>
                      {formatDate(task.due_date)}
                      {isOverdue(task.due_date, task.status) && (
                        <AlertTriangle className="w-3 h-3 inline ml-1" />
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
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
