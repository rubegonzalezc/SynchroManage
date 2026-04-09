'use client'

import { useState, useEffect } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { Search, ExternalLink, CheckCircle2, Clock, AlertTriangle, Bug, Zap } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import Link from 'next/link'
import { TaskDetailDialogStandalone } from './TaskDetailDialogStandalone'

interface Task {
  id: string
  task_number: number | null
  title: string
  description: string | null
  status: string
  priority: string
  due_date: string | null
  created_at: string
  complexity?: number | null
  open_bugs_count?: number
  project: { id: string; name: string; status: string } | null
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

const priorityLabels: Record<string, string> = {
  low: 'Baja', medium: 'Media', high: 'Alta', urgent: 'Urgente',
}

const priorityColors: Record<string, string> = {
  low: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
  medium: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
  high: 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400',
  urgent: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
}

export function MyTasksClient() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [priorityFilter, setPriorityFilter] = useState<string>('all')
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)

  const fetchTasks = async () => {
    try {
      const response = await fetch('/api/dashboard/my-tasks')
      const data = await response.json()
      if (response.ok) setTasks(data.tasks || [])
    } catch (error) {
      console.error('Error fetching tasks:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchTasks() }, [])

  const filteredTasks = tasks.filter(task => {
    const matchesSearch =
      task.title.toLowerCase().includes(search.toLowerCase()) ||
      task.project?.name.toLowerCase().includes(search.toLowerCase()) ||
      `#${task.task_number}`.includes(search)
    const matchesStatus = statusFilter === 'all' || task.status === statusFilter
    const matchesPriority = priorityFilter === 'all' || task.priority === priorityFilter
    return matchesSearch && matchesStatus && matchesPriority
  })

  const formatDate = (date: string | null) => {
    if (!date) return '-'
    return new Date(date).toLocaleDateString('es-CL', { day: '2-digit', month: 'short', year: 'numeric' })
  }

  const isOverdue = (dueDate: string | null, status: string) => {
    if (!dueDate || status === 'done') return false
    return new Date(dueDate) < new Date()
  }

  const isDueSoon = (dueDate: string | null, status: string) => {
    if (!dueDate || status === 'done') return false
    const diffDays = Math.ceil((new Date(dueDate).getTime() - Date.now()) / 86400000)
    return diffDays >= 0 && diffDays <= 3
  }

  const pendingCount = tasks.filter(t => t.status !== 'done').length
  const completedCount = tasks.filter(t => t.status === 'done').length
  const overdueCount = tasks.filter(t => isOverdue(t.due_date, t.status)).length

  if (loading) {
    return (
      <>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-card rounded-lg border border-border p-4">
              <div className="flex items-center gap-3">
                <Skeleton className="w-9 h-9 rounded-lg flex-shrink-0" />
                <div className="space-y-2">
                  <Skeleton className="h-7 w-10" />
                  <Skeleton className="h-3.5 w-20" />
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="bg-card rounded-lg border border-border p-4 mb-4">
          <div className="flex flex-col md:flex-row gap-4">
            <Skeleton className="h-9 flex-1" />
            <Skeleton className="h-9 w-full md:w-[180px]" />
            <Skeleton className="h-9 w-full md:w-[180px]" />
          </div>
        </div>
        <div className="bg-card rounded-lg border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                {[80, 0, 0, 0, 0, 0, 60, 60, 100].map((w, i) => (
                  <TableHead key={i} style={w ? { width: w } : {}}><Skeleton className="h-4 w-12" /></TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {[1, 2, 3, 4, 5].map((i) => (
                <TableRow key={i}>
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(j => (
                    <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </>
    )
  }

  return (
    <>
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-card rounded-lg border border-border p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
              <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{pendingCount}</p>
              <p className="text-sm text-muted-foreground">Pendientes</p>
            </div>
          </div>
        </div>
        <div className="bg-card rounded-lg border border-border p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
              <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{completedCount}</p>
              <p className="text-sm text-muted-foreground">Completadas</p>
            </div>
          </div>
        </div>
        <div className="bg-card rounded-lg border border-border p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900/30">
              <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{overdueCount}</p>
              <p className="text-sm text-muted-foreground">Vencidas</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-card rounded-lg border border-border p-4 mb-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por título, proyecto o número..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full md:w-[180px]"><SelectValue placeholder="Estado" /></SelectTrigger>
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
            <SelectTrigger className="w-full md:w-[180px]"><SelectValue placeholder="Prioridad" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las prioridades</SelectItem>
              <SelectItem value="low">Baja</SelectItem>
              <SelectItem value="medium">Media</SelectItem>
              <SelectItem value="high">Alta</SelectItem>
              <SelectItem value="urgent">Urgente</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Tasks Table */}
      <div className="bg-card rounded-lg border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[80px]">#</TableHead>
              <TableHead>Tarea</TableHead>
              <TableHead>Proyecto</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Prioridad</TableHead>
              <TableHead>Fecha Límite</TableHead>
              <TableHead className="w-[70px]">
                <span className="flex items-center gap-1"><Zap className="w-3 h-3 text-amber-500" />Comp.</span>
              </TableHead>
              <TableHead className="w-[70px]">
                <span className="flex items-center gap-1"><Bug className="w-3 h-3 text-red-500" />Bugs</span>
              </TableHead>
              <TableHead className="w-[80px]">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredTasks.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                  {tasks.length === 0
                    ? 'No tienes tareas asignadas'
                    : 'No se encontraron tareas con los filtros aplicados'}
                </TableCell>
              </TableRow>
            ) : (
              filteredTasks.map((task) => (
                <TableRow
                  key={task.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => setSelectedTaskId(task.id)}
                >
                  <TableCell className="font-mono text-muted-foreground">
                    #{task.task_number}
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium text-foreground">{task.title}</p>
                      {task.description && (
                        <p className="text-sm text-muted-foreground line-clamp-1">{task.description}</p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {task.project ? (
                      <Link
                        href={`/projects/${task.project.id}`}
                        onClick={(e) => e.stopPropagation()}
                        className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
                      >
                        {task.project.name}
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className={statusColors[task.status]}>
                      {statusLabels[task.status]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className={priorityColors[task.priority]}>
                      {priorityLabels[task.priority]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className={
                        isOverdue(task.due_date, task.status)
                          ? 'text-red-600 dark:text-red-400 font-medium'
                          : isDueSoon(task.due_date, task.status)
                            ? 'text-amber-600 dark:text-amber-400'
                            : 'text-muted-foreground'
                      }>
                        {formatDate(task.due_date)}
                      </span>
                      {isOverdue(task.due_date, task.status) && (
                        <AlertTriangle className="w-4 h-4 text-red-500" />
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {task.complexity != null ? (
                      <span className="flex items-center gap-1 text-sm font-medium text-amber-600 dark:text-amber-400">
                        <Zap className="w-3 h-3" />{task.complexity}
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground/40">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {(task.open_bugs_count ?? 0) > 0 ? (
                      <span className="flex items-center gap-1 text-sm font-medium text-red-600 dark:text-red-400">
                        <Bug className="w-3 h-3" />{task.open_bugs_count}
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground/40">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => { e.stopPropagation(); setSelectedTaskId(task.id) }}
                    >
                      Ver
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {selectedTaskId && (
        <TaskDetailDialogStandalone
          taskId={selectedTaskId}
          open={!!selectedTaskId}
          onOpenChange={(isOpen: boolean) => !isOpen && setSelectedTaskId(null)}
          onTaskUpdated={fetchTasks}
        />
      )}
    </>
  )
}
