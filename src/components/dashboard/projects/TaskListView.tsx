'use client'

import { useMemo, useState, useCallback, useEffect } from 'react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Badge } from '@/components/ui/badge'
import { AvatarStack } from '@/components/ui/avatar-stack'
import {
  Calendar,
  ChevronDown,
  ChevronRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Bug,
  Zap,
  Package,
  GripVertical,
  ChevronUp,
  ChevronDown as ChevronDownIcon,
} from 'lucide-react'
import { TaskDetailDialog } from './TaskDetailDialog'
import { categoryIcons, categoryLabels, categoryColors } from '@/lib/constants/categories'
import { SprintTaskReferenceBadge } from '@/components/ui/sprint-task-reference-badge'
import { formatSprintTaskReferenceLabel } from '@/lib/utils/task-sprint-order'
import {
  compareTasksBySprintOrder,
  getSprintGroupCollapseKey,
  groupTasksBySprint,
  type TaskSprintGroup,
} from '@/lib/utils/task-list-sprint-groups'
import {
  buildSprintOrderUpdates,
  moveTaskInOrderedList,
  reorderTaskInOrderedList,
} from '@/lib/utils/reorder-sprint-tasks'
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
  canReorder?: boolean
  showReorderHint?: boolean
  onSprintOrderUpdates?: (updates: { id: string; sprint_order: number }[]) => void
  highlightId?: string | null
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

interface TaskRowContentProps {
  task: Task
  sprints: SprintRef[]
  formatDate: (date: string | null) => string
  onOpen?: () => void
}

function TaskRowCells({ task, sprints, formatDate, onOpen }: TaskRowContentProps) {
  const isOverdue = task.due_date && new Date(task.due_date) < new Date() && task.status !== 'done'
  const sprintReferenceLabel = formatSprintTaskReferenceLabel({
    sprintId: task.sprint_id,
    sprintOrder: task.sprint_order,
    sprints,
  })
  const cellClass = onOpen ? 'cursor-pointer' : undefined
  const handleClick = onOpen

  return (
    <>
      <div className={cn('flex items-center gap-2 min-w-0', cellClass)} onClick={handleClick}>
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
      <div className={cellClass} onClick={handleClick}>
        <Badge variant="secondary" className={`text-xs ${statusColors[task.status] || statusColors.todo}`}>
          {statusLabels[task.status] || task.status}
        </Badge>
      </div>
      <div className={cellClass} onClick={handleClick}>
        <Badge variant="secondary" className={`text-xs ${priorityColors[task.priority]}`}>
          {priorityLabels[task.priority]}
        </Badge>
      </div>
      <div className={cellClass} onClick={handleClick}>
        {task.category && (
          <Badge variant="secondary" className={`text-xs ${categoryColors[task.category] || categoryColors.task}`}>
            {categoryIcons[task.category]} {categoryLabels[task.category] || 'Tarea'}
          </Badge>
        )}
      </div>
      <div className={cellClass} onClick={handleClick}>
        {task.due_date ? (
          <span className={`flex items-center gap-1 text-xs ${isOverdue ? 'text-red-600 dark:text-red-400' : 'text-muted-foreground'}`}>
            <Calendar className="w-3 h-3" />
            {formatDate(task.due_date)}
          </span>
        ) : (
          <span className="text-xs text-muted-foreground/40">-</span>
        )}
      </div>
      <div className={cellClass} onClick={handleClick}>
        {task.complexity != null ? (
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Zap className="w-3 h-3 text-amber-500" />
            {task.complexity}
          </span>
        ) : (
          <span className="text-xs text-muted-foreground/40">-</span>
        )}
      </div>
      <div className={cellClass} onClick={handleClick}>
        {(task.openBugsCount ?? 0) > 0 ? (
          <span className="flex items-center gap-1 text-xs font-medium text-red-600 dark:text-red-400">
            <Bug className="w-3 h-3" />
            {task.openBugsCount}
          </span>
        ) : (
          <span className="text-xs text-muted-foreground/40">-</span>
        )}
      </div>
      <div className={cellClass} onClick={handleClick}>
        {task.assignees.length > 0 && (
          <AvatarStack assignees={task.assignees} maxVisible={2} />
        )}
      </div>
    </>
  )
}

interface SortableSprintTaskRowProps extends TaskRowContentProps {
  index: number
  total: number
  disabled: boolean
  onOpen: () => void
  onMove: (direction: 'up' | 'down') => void
}

function SortableSprintTaskRow({
  task,
  index,
  total,
  disabled,
  onOpen,
  onMove,
  ...contentProps
}: SortableSprintTaskRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id, disabled })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'grid grid-cols-1 md:grid-cols-[72px_1fr_90px_90px_80px_80px_70px_70px_70px] gap-2 px-4 py-3 hover:bg-muted/30 transition-colors items-center',
        isDragging && 'opacity-60 bg-muted/40 z-10 relative'
      )}
    >
      <div className="hidden md:flex items-center gap-0.5">
        <button
          type="button"
          className="p-1 rounded text-muted-foreground hover:text-foreground cursor-grab active:cursor-grabbing touch-none disabled:opacity-40"
          aria-label="Arrastrar para reordenar"
          disabled={disabled}
          onClick={(e) => e.stopPropagation()}
          {...attributes}
          {...listeners}
        >
          <GripVertical className="w-4 h-4" />
        </button>
        <div className="flex flex-col">
          <button
            type="button"
            className="p-0.5 rounded text-muted-foreground hover:text-foreground disabled:opacity-30"
            aria-label="Subir prioridad en sprint"
            disabled={disabled || index === 0}
            onClick={(e) => {
              e.stopPropagation()
              onMove('up')
            }}
          >
            <ChevronUp className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            className="p-0.5 rounded text-muted-foreground hover:text-foreground disabled:opacity-30"
            aria-label="Bajar prioridad en sprint"
            disabled={disabled || index === total - 1}
            onClick={(e) => {
              e.stopPropagation()
              onMove('down')
            }}
          >
            <ChevronDownIcon className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
      <TaskRowCells task={task} sprints={contentProps.sprints} formatDate={contentProps.formatDate} onOpen={onOpen} />
      <div className="flex md:hidden items-center gap-1 col-span-full -mt-1">
        <button
          type="button"
          className="p-1.5 rounded border border-border text-muted-foreground disabled:opacity-30"
          disabled={disabled || index === 0}
          onClick={() => onMove('up')}
        >
          <ChevronUp className="w-4 h-4" />
        </button>
        <button
          type="button"
          className="p-1.5 rounded border border-border text-muted-foreground disabled:opacity-30"
          disabled={disabled || index === total - 1}
          onClick={() => onMove('down')}
        >
          <ChevronDownIcon className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

interface SprintTaskGroupListProps {
  group: TaskSprintGroup<Task>
  sprints: SprintRef[]
  canReorder: boolean
  isSaving: boolean
  formatDate: (date: string | null) => string
  onOpenTask: (taskId: string) => void
  onReorder: (sprintId: string, orderedTaskIds: string[]) => Promise<void>
}

function SprintTaskGroupList({
  group,
  sprints,
  canReorder,
  isSaving,
  formatDate,
  onOpenTask,
  onReorder,
}: SprintTaskGroupListProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const orderedIds = useMemo(() => group.tasks.map((task) => task.id), [group.tasks])
  const reorderEnabled = canReorder && group.id !== null && !isSaving

  const applyReorder = useCallback(
    (nextOrderedIds: string[] | null) => {
      if (!nextOrderedIds || !group.id) return
      void onReorder(group.id, nextOrderedIds)
    },
    [group.id, onReorder]
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    applyReorder(reorderTaskInOrderedList(orderedIds, String(active.id), String(over.id)))
  }

  const handleMove = (taskId: string, direction: 'up' | 'down') => {
    applyReorder(moveTaskInOrderedList(orderedIds, taskId, direction))
  }

  if (!reorderEnabled) {
    return (
      <div className="divide-y divide-border">
        {group.tasks.map((task) => (
          <div
            key={task.id}
            className="grid grid-cols-1 md:grid-cols-[1fr_90px_90px_80px_80px_70px_70px_70px] gap-2 px-4 py-3 hover:bg-muted/30 cursor-pointer transition-colors items-center"
            onClick={() => onOpenTask(task.id)}
          >
            <TaskRowCells task={task} sprints={sprints} formatDate={formatDate} onOpen={() => onOpenTask(task.id)} />
          </div>
        ))}
      </div>
    )
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={orderedIds} strategy={verticalListSortingStrategy}>
        <div className="divide-y divide-border">
          {group.tasks.map((task, index) => (
            <SortableSprintTaskRow
              key={task.id}
              task={task}
              index={index}
              total={group.tasks.length}
              disabled={isSaving}
              sprints={sprints}
              formatDate={formatDate}
              onOpen={() => onOpenTask(task.id)}
              onMove={(direction) => handleMove(task.id, direction)}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  )
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
  canReorder = false,
  showReorderHint = false,
  onSprintOrderUpdates,
  highlightId = null,
}: TaskListViewProps) {
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set())
  const [sortField, setSortField] = useState<SortField>('priority')
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc')
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)
  const [savingSprintId, setSavingSprintId] = useState<string | null>(null)

  useEffect(() => {
    if (!highlightId) return
    if (tasks.some((task) => task.id === highlightId)) {
      setSelectedTaskId(highlightId)
    }
  }, [highlightId, tasks])

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

  const handleSprintReorder = useCallback(
    async (sprintId: string, orderedTaskIds: string[]) => {
      const updates = buildSprintOrderUpdates(orderedTaskIds)
      onSprintOrderUpdates?.(updates)
      setSavingSprintId(sprintId)

      try {
        const response = await fetch('/api/dashboard/tasks/reorder-sprint', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ projectId, sprintId, orderedTaskIds }),
        })

        if (!response.ok) {
          const data = await response.json().catch(() => ({}))
          throw new Error(data.error || 'Error al reordenar tareas')
        }

        onTasksChange()
      } catch (error) {
        console.error(error)
        onTasksChange()
      } finally {
        setSavingSprintId(null)
      }
    },
    [projectId, onSprintOrderUpdates, onTasksChange]
  )

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUpDown className="w-3 h-3 ml-1 opacity-40" />
    return sortDirection === 'asc'
      ? <ArrowUp className="w-3 h-3 ml-1" />
      : <ArrowDown className="w-3 h-3 ml-1" />
  }

  const gridCols = canReorder
    ? 'md:grid-cols-[72px_1fr_90px_90px_80px_80px_70px_70px_70px]'
    : 'md:grid-cols-[1fr_90px_90px_80px_80px_70px_70px_70px]'

  return (
    <div className="space-y-3">
      <div className={cn('hidden md:grid gap-2 px-4 py-2 text-xs font-medium text-muted-foreground border-b border-border', gridCols)}>
        {canReorder && <span>Orden</span>}
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

      {showReorderHint && (
        <p className="text-xs text-muted-foreground px-1">
          Limpia los filtros de búsqueda para reordenar historias dentro del sprint.
        </p>
      )}

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
                  {canReorder && group.id !== null && savingSprintId === group.id && (
                    <span className="ml-2 text-[11px] text-muted-foreground">Guardando…</span>
                  )}
                </div>
                <span className="ml-auto text-sm text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                  {group.tasks.length}
                </span>
              </button>

              {!collapsedGroups.has(groupKey) && group.tasks.length > 0 && (
                <SprintTaskGroupList
                  group={group}
                  sprints={sprints}
                  canReorder={canReorder}
                  isSaving={group.id !== null && savingSprintId === group.id}
                  formatDate={formatDate}
                  onOpenTask={setSelectedTaskId}
                  onReorder={handleSprintReorder}
                />
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
