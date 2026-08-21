'use client'

import { useMemo, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { AvatarStack } from '@/components/ui/avatar-stack'
import { Calendar, ChevronDown, ChevronRight, ArrowUpDown, ArrowUp, ArrowDown, Bug, Zap, Package } from 'lucide-react'
import { TaskDetailDialog } from './TaskDetailDialog'
import { categoryIcons, categoryLabels, categoryColors } from '@/lib/constants/categories'
import { SprintTaskReferenceBadge } from '@/components/ui/sprint-task-reference-badge'
import { formatSprintTaskReferenceLabel } from '@/lib/utils/task-sprint-order'
import {
  compareTasksBySprintOrder,
  getSprintGroupCollapseKey,
  groupTasksBySprint,
} from '@/lib/utils/task-list-sprint-groups'
import { cn } from '@/lib/utils'

interface SprintRef {
  id: string
  name: string
  order_index?: number
  status?: string
}

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
  sprint_id?: string | null
  sprint_order?: number | null
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
  sprints?: SprintRef[]
  selectedSprintId?: string | null
}

const statusLabels: Record<string, string> = {
  backlog: 'Backlog',
  todo: 'Por Hacer',
  in_progress: 'En Progreso',
  review: 'En Revisión',
  done: 'Completado',
}

const statusColors: Record<string, string> = {
  backlog: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
  todo: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
  in_progress: 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400',
  review: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400',
  done: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400',
}

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

function compareWithUserSort(
  a: Task,
  b: Task,
  sortField: SortField,
  sortDirection: SortDirection
): number {
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
}

function sortGroupTasks(
  tasks: Task[],
  sortField: SortField,
  sortDirection: SortDirection
): Task[] {
  return [...tasks].sort((a, b) => {
    const sprintOrderCmp = compareTasksBySprintOrder(a, b)
    if (sprintOrderCmp !== 0) return sprintOrderCmp
    return compareWithUserSort(a, b, sortField, sortDirection)
  })
}

export function TaskListView({
  tasks,
  projectId,
  projectName,
  members,
  allUsers,
  currentUserId,
  onTasksChange,
  sprints = [],
  selectedSprintId = null,
}: TaskListViewProps) {
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set())
  const [sortField, setSortField] = useState<SortField>('priority')
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc')
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)

  const sprintGroups = useMemo(() => {
    const groups = groupTasksBySprint(tasks, sprints)
    return groups.map((group) => ({
      ...group,
      tasks: sortGroupTasks(group.tasks, sortField, sortDirection),
    }))
  }, [tasks, sprints, sortField, sortDirection])

  const visibleGroups = useMemo(
    () => sprintGroups.filter((group) => group.id === null || group.tasks.length > 0),
    [sprintGroups]
  )

  const toggleGroup = (groupKey: string) => {
    setCollapsedGroups((prev) => {
      const next = new Set(prev)
      if (next.has(groupKey)) next.delete(groupKey)
      else next.add(groupKey)
      return next
    })
  }

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

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
      <div className="hidden md:grid grid-cols-[1fr_90px_90px_80px_80px_70px_70px_70px] gap-2 px-4 py-2 text-xs font-medium text-muted-foreground border-b border-border">
        <button className="flex items-center hover:text-foreground transition-colors text-left" onClick={() => handleSort('title')}>
          Título <SortIcon field="title" />
        </button>
        <span>Estado</span>
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

      {visibleGroups.length === 0 ? (
        <div className="rounded-lg border border-border px-4 py-10 text-center text-sm text-muted-foreground">
          No hay tareas que coincidan con los filtros
        </div>
      ) : (
        visibleGroups.map((group) => {
          const groupKey = getSprintGroupCollapseKey(group.id)
          const isSelected = group.id !== null && group.id === selectedSprintId
          const sprintMeta = group.id ? sprints.find((sprint) => sprint.id === group.id) : null

          return (
            <div
              key={groupKey}
              className={cn(
                'border rounded-lg overflow-hidden transition-colors',
                isSelected
                  ? 'border-primary/40 ring-1 ring-primary/20'
                  : 'border-border'
              )}
            >
              <button
                className={cn(
                  'w-full flex items-center gap-2 px-4 py-3 text-left transition-colors',
                  isSelected ? 'bg-primary/5 hover:bg-primary/10' : 'bg-muted/50 hover:bg-muted'
                )}
                onClick={() => toggleGroup(groupKey)}
              >
                {collapsedGroups.has(groupKey)
                  ? <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                {group.id === null ? (
                  <Package className="w-4 h-4 text-muted-foreground" />
                ) : (
                  <div className={cn(
                    'w-3 h-3 rounded-full',
                    sprintMeta?.status === 'active' ? 'bg-primary' :
                    sprintMeta?.status === 'completed' ? 'bg-green-500' : 'bg-amber-500'
                  )} />
                )}
                <div className="min-w-0">
                  <span className="font-medium text-foreground">{group.label}</span>
                  {isSelected && (
                    <span className="ml-2 text-[11px] font-medium text-primary">Seleccionado</span>
                  )}
                </div>
                <span className="ml-auto text-sm text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                  {group.tasks.length}
                </span>
              </button>

              {!collapsedGroups.has(groupKey) && group.tasks.length > 0 && (
                <div className="divide-y divide-border">
                  {group.tasks.map((task) => {
                    const isOverdue = task.due_date && new Date(task.due_date) < new Date() && task.status !== 'done'
                    const sprintReferenceLabel = formatSprintTaskReferenceLabel({
                      sprintId: task.sprint_id,
                      sprintOrder: task.sprint_order,
                      sprints,
                    })

                    return (
                      <div
                        key={task.id}
                        className="grid grid-cols-1 md:grid-cols-[1fr_90px_90px_80px_80px_70px_70px_70px] gap-2 px-4 py-3 hover:bg-muted/30 cursor-pointer transition-colors items-center"
                        onClick={() => setSelectedTaskId(task.id)}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          {task.task_number != null && (
                            <span className="text-xs font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded shrink-0">
                              #{task.task_number}
                            </span>
                          )}
                          {sprintReferenceLabel && (
                            <SprintTaskReferenceBadge label={sprintReferenceLabel} />
                          )}
                          <span className="text-sm font-medium text-foreground truncate">{task.title}</span>
                        </div>
                        <div>
                          <Badge variant="secondary" className={`text-xs ${statusColors[task.status] || statusColors.todo}`}>
                            {statusLabels[task.status] || task.status}
                          </Badge>
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
                          {task.due_date ? (
                            <span className={`flex items-center gap-1 text-xs ${isOverdue ? 'text-red-600 dark:text-red-400' : 'text-muted-foreground'}`}>
                              <Calendar className="w-3 h-3" />
                              {formatDate(task.due_date)}
                            </span>
                          ) : (
                            <span className="text-xs text-muted-foreground/40">-</span>
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

              {!collapsedGroups.has(groupKey) && group.tasks.length === 0 && (
                <div className="px-4 py-6 text-center text-sm text-muted-foreground">
                  Sin tareas
                </div>
              )}
            </div>
          )
        })
      )}

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
