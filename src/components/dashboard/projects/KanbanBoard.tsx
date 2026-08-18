'use client'

import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
  DragOverEvent,
  pointerWithin,
  rectIntersection,
  MeasuringStrategy,
} from '@dnd-kit/core'
import type { CollisionDetection } from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { KanbanColumn } from './KanbanColumn'
import { TaskCard } from './TaskCard'
import { createClient } from '@/lib/supabase/client'
import { snapPointerOffsetToCursor } from '@/lib/dnd/kanban-drag-modifiers'
import { useDynamicIslandToast } from '@/components/ui/dynamic-island-toast'

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
  is_carry_over?: boolean
  complexity?: number | null
  assignees: { id: string; full_name: string; avatar_url: string | null }[]
  assignee?: { id: string; full_name: string; avatar_url: string | null } | null
}

interface Member {
  id: string
  full_name: string
  avatar_url: string | null
}

interface KanbanBoardProps {
  tasks: Task[]
  projectId: string
  projectName: string
  members: Member[]
  allUsers: Member[]
  currentUserId: string
  onTasksChange: () => void
  onOptimisticMove?: (taskId: string, newStatus: string, newPosition: number) => void
  onTaskPatched?: (task: { id: string; status: string; position: number }) => void
  highlightId?: string | null
}

const columns = [
  { id: 'backlog', title: 'Backlog', color: '#8E8E93' },
  { id: 'todo', title: 'Por Hacer', color: '#0A84FF' },
  { id: 'in_progress', title: 'En Progreso', color: '#FF9F0A' },
  { id: 'review', title: 'En Revisión', color: '#BF5AF2' },
  { id: 'done', title: 'Completado', color: '#30D158' },
]

const columnIds = new Set(columns.map((c) => c.id))

/**
 * Custom collision detection that uses pointerWithin (checks if the pointer
 * is inside a droppable rect) with a rectIntersection fallback.
 * 
 * This correctly handles browser zoom because @dnd-kit reads element bounds
 * via getBoundingClientRect(), which always returns values in CSS pixels
 * (already accounting for devicePixelRatio and CSS zoom transforms).
 */
const customCollisionDetection: CollisionDetection = (args) => {
  const pointerCollisions = pointerWithin(args)
  if (pointerCollisions.length > 0) return pointerCollisions
  return rectIntersection(args)
}

export function KanbanBoard({
  tasks: initialTasks,
  projectId,
  projectName,
  members,
  allUsers,
  currentUserId,
  onTasksChange,
  onOptimisticMove,
  onTaskPatched,
  highlightId,
}: KanbanBoardProps) {
  const { showError } = useDynamicIslandToast()
  const [tasks, setTasks] = useState<Task[]>(initialTasks)
  const tasksBeforeMoveRef = useRef<Task[] | null>(null)
  const isDraggingRef = useRef(false)
  const isSyncingRef = useRef(false)
  // Evita que realtime/refetch con datos viejos pisen el estado tras un move local
  const ignoreExternalSyncUntilRef = useRef(0)

  const shouldIgnoreExternalSync = () =>
    isDraggingRef.current ||
    isSyncingRef.current ||
    Date.now() < ignoreExternalSyncUntilRef.current
  const [activeTask, setActiveTask] = useState<Task | null>(null)
  const [activeCardWidth, setActiveCardWidth] = useState<number | null>(null)
  const [portalRoot, setPortalRoot] = useState<HTMLElement | null>(null)

  useEffect(() => {
    setPortalRoot(document.body)
  }, [])

  // useState (not useRef) so column highlight re-renders reactively during drag
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null)
  // Keep a ref in sync for use inside async callbacks (onDragEnd)
  const dragOverColumnRef = useRef<string | null>(null)

  // Sync with props when they change from the parent
  useEffect(() => {
    if (shouldIgnoreExternalSync()) return
    setTasks(initialTasks)
  }, [initialTasks])

  // Ref estable para onTasksChange — evita recrear la suscripción Realtime en cada render
  const onTasksChangeRef = useRef(onTasksChange)
  useEffect(() => { onTasksChangeRef.current = onTasksChange }, [onTasksChange])

  // Realtime subscription for task updates (only from other users/sessions)
  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel(`tasks-${projectId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tasks',
          filter: `project_id=eq.${projectId}`,
        },
        () => {
          // Ignorar eventos propios o mientras hay drag/PATCH para no pisar el estado optimista
          if (!shouldIgnoreExternalSync()) {
            onTasksChangeRef.current()
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [projectId]) // Solo depende de projectId — onTasksChange se accede via ref

  const sensors = useSensors(
    useSensor(PointerSensor, {
      // El arrastre solo inicia desde el handle; no hace falta distancia extra
      activationConstraint: { distance: 1 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const getTasksByStatus = (status: string) => {
    return tasks
      .filter((t) => t.status === status)
      .sort((a, b) => a.position - b.position)
  }

  const handleDragStart = (event: DragStartEvent) => {
    const task = tasks.find((t) => t.id === event.active.id)
    if (task) {
      isDraggingRef.current = true
      setActiveTask(task)
      setActiveCardWidth(event.active.rect.current.initial?.width ?? null)
      dragOverColumnRef.current = task.status
      setDragOverColumn(task.status)
    }
  }

  /**
   * onDragOver fires continuously as the card moves.
   * We update both the ref (for onDragEnd async access) and the state
   * (to trigger re-renders so isHighlighted updates on every column).
   */
  const handleDragOver = (event: DragOverEvent) => {
    const { over } = event

    if (!over) {
      dragOverColumnRef.current = null
      setDragOverColumn(null)
      return
    }

    const overId = over.id as string
    let targetColumn: string | null = null

    if (columnIds.has(overId)) {
      // Pointer is directly over a column droppable zone
      targetColumn = overId
    } else {
      // Pointer is over a task card — find which column it belongs to
      const overTask = tasks.find((t) => t.id === overId)
      if (overTask) targetColumn = overTask.status
    }

    if (targetColumn !== dragOverColumnRef.current) {
      dragOverColumnRef.current = targetColumn
      setDragOverColumn(targetColumn)
    }
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    setActiveTask(null)
    setActiveCardWidth(null)

    const draggedTask = tasks.find((t) => t.id === active.id)
    if (!draggedTask) {
      dragOverColumnRef.current = null
      return
    }

    // Resolve destination column.
    // Priority: dragOverColumnRef (tracked throughout drag) > over.id fallback
    let newStatus = draggedTask.status

    if (dragOverColumnRef.current) {
      newStatus = dragOverColumnRef.current
    } else if (over) {
      const overId = over.id as string
      if (columnIds.has(overId)) {
        newStatus = overId
      } else {
        const overTask = tasks.find((t) => t.id === overId)
        if (overTask) newStatus = overTask.status
      }
    }

    // Clear the drag-over state. isDraggingRef se limpia al terminar el PATCH.
    dragOverColumnRef.current = null
    setDragOverColumn(null)

    // If dropped outside all droppable areas, abort
    if (!over) return

    // Calculate new position within the destination column
    const tasksInNewColumn = tasks
      .filter((t) => t.status === newStatus && t.id !== draggedTask.id)
      .sort((a, b) => a.position - b.position)

    let newPosition = tasksInNewColumn.length // Default: append at end

    const overId = over.id as string
    if (!columnIds.has(overId)) {
      // Dropped onto a specific task — insert before that task
      const overIndex = tasksInNewColumn.findIndex((t) => t.id === overId)
      if (overIndex >= 0) {
        newPosition = overIndex
      }
    }

    // Only update if something actually changed
    if (draggedTask.status === newStatus && draggedTask.position === newPosition) {
      return
    }

    // Optimistic UI — reflect the change immediately, before server confirms
    tasksBeforeMoveRef.current = tasks
    isSyncingRef.current = true
    setTasks((prevTasks) =>
      prevTasks.map((t) =>
        t.id === draggedTask.id
          ? { ...t, status: newStatus, position: newPosition }
          : t
      )
    )
    // También actualizar el estado del padre (SWR cache) optimísticamente
    onOptimisticMove?.(draggedTask.id, newStatus, newPosition)

    try {
      const response = await fetch('/api/dashboard/tasks', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taskId: draggedTask.id,
          status: newStatus,
          position: newPosition,
        }),
      })

      const data = await response.json().catch(() => ({}))

      if (!response.ok) {
        const errorMessage = typeof data.error === 'string'
          ? data.error
          : 'No se pudo mover la tarea'
        showError(errorMessage)
        if (tasksBeforeMoveRef.current) {
          setTasks(tasksBeforeMoveRef.current)
        }
        onOptimisticMove?.(draggedTask.id, draggedTask.status, draggedTask.position)
        onTasksChange()
        return
      }

      if (data.task) {
        onTaskPatched?.({
          id: data.task.id,
          status: data.task.status,
          position: data.task.position,
        })
        setTasks((prevTasks) =>
          prevTasks.map((t) =>
            t.id === data.task.id
              ? { ...t, status: data.task.status, position: data.task.position }
              : t
          )
        )
        // El evento realtime del mismo PATCH puede disparar un refetch con caché vieja
        ignoreExternalSyncUntilRef.current = Date.now() + 3000
      }
    } catch (error) {
      console.error('Error updating task:', error)
      showError('No se pudo mover la tarea')
      if (tasksBeforeMoveRef.current) {
        setTasks(tasksBeforeMoveRef.current)
      }
      onOptimisticMove?.(draggedTask.id, draggedTask.status, draggedTask.position)
      onTasksChange()
    } finally {
      isDraggingRef.current = false
      isSyncingRef.current = false
      tasksBeforeMoveRef.current = null
    }
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={customCollisionDetection}
      measuring={{
        droppable: { strategy: MeasuringStrategy.Always },
      }}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      onDragCancel={() => {
        isDraggingRef.current = false
        isSyncingRef.current = false
        dragOverColumnRef.current = null
        setDragOverColumn(null)
        setActiveTask(null)
        setActiveCardWidth(null)
      }}
    >
      <div className="space-y-2">
        <div className="flex gap-4 overflow-x-auto pb-4">
          {columns.map((column) => {
            const columnTasks = getTasksByStatus(column.id)
            // Show highlight when dragging into a different column
            const isDragTarget =
              activeTask !== null &&
              dragOverColumn === column.id &&
              activeTask.status !== column.id

            return (
              <SortableContext
                key={column.id}
                items={columnTasks.map((t) => t.id)}
                strategy={verticalListSortingStrategy}
              >
                <KanbanColumn
                  id={column.id}
                  title={column.title}
                  color={column.color}
                  count={columnTasks.length}
                  isDragTarget={isDragTarget}
                >
                  {columnTasks.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      projectId={projectId}
                      projectName={projectName}
                      members={members}
                      allUsers={allUsers}
                      currentUserId={currentUserId}
                      onUpdate={onTasksChange}
                      highlightId={highlightId}
                    />
                  ))}
                </KanbanColumn>
              </SortableContext>
            )
          })}
        </div>
      </div>

      {portalRoot && createPortal(
        <DragOverlay
          adjustScale={false}
          zIndex={1400}
          modifiers={[snapPointerOffsetToCursor]}
          dropAnimation={{
            duration: 200,
            easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)',
          }}
        >
          {activeTask ? (
            <div
              style={{
                width: activeCardWidth ?? 272,
                cursor: 'grabbing',
              }}
            >
              <TaskCard
                variant="overlay"
                task={activeTask}
                projectId={projectId}
                projectName={projectName}
                members={members}
                allUsers={allUsers}
                currentUserId={currentUserId}
                onUpdate={() => {}}
              />
            </div>
          ) : null}
        </DragOverlay>,
        portalRoot
      )}
    </DndContext>
  )
}
