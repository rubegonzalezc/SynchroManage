'use client'

import { useState, useMemo } from 'react'
import { Badge } from '@/components/ui/badge'
import { AvatarStack } from '@/components/ui/avatar-stack'
import { Calendar, ChevronDown, ChevronRight, ArrowUpDown, ArrowUp, ArrowDown, Bug, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { TaskDetailDialog } from './TaskDetailDialog'
import { categoryIcons, categoryLabels, categoryColors } from '@/lib/constants/categories'

interface Task {
  id: string
  task_number: number | null
  title: string
  description: string | null
  status: string
  priority: string
  category?: string
  position: number
  due_date: string | null
  complexity?: number | null
  openBugsCount?: number
  assignees: { id: string; full_name: string; avatar_url: string | null }[]
}

interface Member {
  id: string
  full_name: string
  avatar_url: string | null
}

interface TaskListViewProps {
  tasks: Task[]
  projectId: string
  projectName: string
  members: Member[]
  allUsers: Member[]
  currentUserId: string
  onTasksChange: () => void
}

const statusColumns = [
  { id: 'backlog', title: 'Backlog', color: 'bg-slate-500' },
  { id: 'todo', title: 'Por Hacer', color: 'bg-blue-500' },
  { id: 'in_progress', title: 'En Progreso', color: 'bg-amber-500' },
  { id: 'review', title: 'En Revisión', color: 'bg-purple-500' },
  { id: 'done', title: 'Completado', color: 'bg-green-500' },
]

const priorityLabels: Record<string, string> = {
  low: 'Baja', medium: 'Media', high: 'Alta', urgent: 'Urgente',
}
const priorityColors: Record<string, string> = {
  low: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
  medium: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
  high: 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400',
  urgent: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
}


const priorityOrder: Record<string, number> = { urgent: 0, high: 1, medium: 2, low: 3 }

type SortField = 'priority' | 'due_date' | 'title' | 'task_number'
type SortDirection = 'asc' | 'desc'

export function TaskListView({ tasks, projectId, projectName, members, allUsers, currentUserId, onTasksChange }: TaskListViewProps) {
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set())
  const [sortField, setSortField] = useState<SortField>('priority')
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc')
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)

  const toggleGroup = (statusId: string) => {
    setCollapsedGroups(prev => {
      const next = new Set(prev)
      if (next.has(statusId)) next.delete(statusId)
      else next.add(statusId)
      return next
    })
  }

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const sortTasks = (tasksToSort: Task[]) => {
    return [...tasksToSort].sort((a, b) => {
      let cmp = 0
      switch (sortField) {
        case 'priority':
          cmp = (priorityOrder[a.priority] ?? 99) - (priorityOrder[b.priority] ?? 99)
          break
        case 'due_date': {
          const da = a.due_date ? new Date(a.due_date).getTime() : Infinity
          const db = b.due_date ? new Date(b.due_date).getTime() : Infinity
          cmp = da - db
          break
        }
        case 'title':
          cmp = a.title.localeCompare(b.title)
          break
        case 'task_number':
          cmp = (a.task_number ?? 0) - (b.task_number ?? 0)
          break
      }
      return sortDirection === 'desc' ? -cmp : cmp
    })
  }

  const groupedTasks = useMemo(() => {
    return statusColumns.map(col => ({
      ...col,
      tasks: sortTasks(tasks.filter(t => t.status === col.id)),
    }))
  }, [tasks, sortField, sortDirection])

  const formatDate = (date: string | null) => {
    if (!date) return '-'
    return new Date(date).toLocaleDateString('es-CL', { day: '2-digit', month: 'short' })
  }

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUpDown className="w-3 h-3 ml-1 opacity-40" />
    return sortDirection === 'asc'
      ? <ArrowUp className="w-3 h-3 ml-1" />
      : <ArrowDown className="w-3 h-3 ml-1" />
  }

  return (
    <div className="space-y-3">
      {/* Sort header */}
      <div className="hidden md:grid grid-cols-[1fr_90px_90px_80px_70px_70px_70px] gap-2 px-4 py-2 text-xs font-medium text-muted-foreground border-b border-border">
        <button className="flex items-center hover:text-foreground transition-colors text-left" onClick={() => handleSort('title')}>
          Título <SortIcon field="title" />
        </button>
        <button className="flex items-center hover:text-foreground transition-colors" onClick={() => handleSort('priority')}>
          Prioridad <SortIcon field="priority" />
        </button>
        <span>Categoría</span>
        <button className="flex items-center hover:text-foreground transition-colors" onClick={() => handleSort('due_date')}>
          Fecha <SortIcon field="due_date" />
        </button>
        <span className="flex items-center gap-1"><Zap className="w-3 h-3" />Complejidad</span>
        <span className="flex items-center gap-1"><Bug className="w-3 h-3 text-red-500" />Bugs</span>
        <span>Asignados</span>
      </div>

      {groupedTasks.map((group) => (
        <div key={group.id} className="border border-border rounded-lg overflow-hidden">
          {/* Group header */}
          <button
            className="w-full flex items-center gap-2 px-4 py-3 bg-muted/50 hover:bg-muted transition-colors text-left"
            onClick={() => toggleGroup(group.id)}
          >
            {collapsedGroups.has(group.id)
              ? <ChevronRight className="w-4 h-4 text-muted-foreground" />
              : <ChevronDown className="w-4 h-4 text-muted-foreground" />
            }
            <div className={`w-3 h-3 rounded-full ${group.color}`} />
            <span className="font-medium text-foreground">{group.title}</span>
            <span className="ml-auto text-sm text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
              {group.tasks.length}
            </span>
          </button>

          {/* Task rows */}
          {!collapsedGroups.has(group.id) && group.tasks.length > 0 && (
            <div className="divide-y divide-border">
              {group.tasks.map((task) => {
                const isOverdue = task.due_date && new Date(task.due_date) < new Date() && task.status !== 'done'
                return (
                  <div
                    key={task.id}
                    className="grid grid-cols-1 md:grid-cols-[1fr_90px_90px_80px_70px_70px_70px] gap-2 px-4 py-3 hover:bg-muted/30 cursor-pointer transition-colors items-center"
                    onClick={() => setSelectedTaskId(task.id)}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      {task.task_number && (
                        <span className="text-xs font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded shrink-0">
                          #{task.task_number}
                        </span>
                      )}
                      <span className="text-sm font-medium text-foreground truncate">{task.title}</span>
                    </div>
                    <div>
                      <Badge variant="secondary" className={`text-xs ${priorityColors[task.priority]}`}>
                        {priorityLabels[task.priority]}
                      </Badge>
                    </div>
                    <div>
                      {task.category && (
                        <Badge variant="secondary" className={`text-xs ${categoryColors[task.category] || categoryColors.task}`}>
                          {categoryIcons[task.category]} {categoryLabels[task.category] || 'Tarea'}
                        </Badge>
                      )}
                    </div>
                    <div>
                      {task.due_date && (
                        <span className={`flex items-center gap-1 text-xs ${isOverdue ? 'text-red-600 dark:text-red-400' : 'text-muted-foreground'}`}>
                          <Calendar className="w-3 h-3" />
                          {formatDate(task.due_date)}
                        </span>
                      )}
                    </div>
                    <div>
                      {task.complexity != null ? (
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Zap className="w-3 h-3 text-amber-500" />
                          {task.complexity}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground/40">-</span>
                      )}
                    </div>
                    <div>
                      {(task.openBugsCount ?? 0) > 0 ? (
                        <span className="flex items-center gap-1 text-xs font-medium text-red-600 dark:text-red-400">
                          <Bug className="w-3 h-3" />
                          {task.openBugsCount}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground/40">-</span>
                      )}
                    </div>
                    <div>
                      {task.assignees.length > 0 && (
                        <AvatarStack assignees={task.assignees} maxVisible={2} />
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {!collapsedGroups.has(group.id) && group.tasks.length === 0 && (
            <div className="px-4 py-6 text-center text-sm text-muted-foreground">
              Sin tareas
            </div>
          )}
        </div>
      ))}

      {/* Task Detail Dialog */}
      {selectedTaskId && (
        <TaskDetailDialog
          taskId={selectedTaskId}
          projectId={projectId}
          projectName={projectName}
          open={!!selectedTaskId}
          onOpenChange={(open) => { if (!open) setSelectedTaskId(null) }}
          members={members}
          allUsers={allUsers}
          currentUserId={currentUserId}
          onUpdate={onTasksChange}
        />
      )}
    </div>
  )
}
