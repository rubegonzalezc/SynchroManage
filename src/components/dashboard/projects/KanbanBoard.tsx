'use client'

import { useState, useEffect, useRef } from 'react'
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
}

const columns = [
  { id: 'backlog', title: 'Backlog', color: 'bg-slate-500' },
  { id: 'todo', title: 'Por Hacer', color: 'bg-blue-500' },
  { id: 'in_progress', title: 'En Progreso', color: 'bg-amber-500' },
  { id: 'review', title: 'En Revisión', color: 'bg-purple-500' },
  { id: 'done', title: 'Completado', color: 'bg-green-500' },
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
}: KanbanBoardProps) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks)
  const [activeTask, setActiveTask] = useState<Task | null>(null)

  // useState (not useRef) so column highlight re-renders reactively during drag
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null)
  // Keep a ref in sync for use inside async callbacks (onDragEnd)
  const dragOverColumnRef = useRef<string | null>(null)

  // Sync with props when they change from the parent
  useEffect(() => {
    setTasks(initialTasks)
  }, [initialTasks])

  // Realtime subscription for task updates
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
          onTasksChange()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [projectId, onTasksChange])

  const sensors = useSensors(
    useSensor(PointerSensor, {
      // Require 8px movement before activating drag — prevents accidental drags
      activationConstraint: { distance: 8 },
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
      setActiveTask(task)
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

    // Clear the drag-over state and reference
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
    setTasks((prevTasks) =>
      prevTasks.map((t) =>
        t.id === draggedTask.id
          ? { ...t, status: newStatus, position: newPosition }
          : t
      )
    )

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

      if (!response.ok) {
        throw new Error(`Server responded with ${response.status}`)
      }

      // Sync latest data from server
      onTasksChange()
    } catch (error) {
      console.error('Error updating task:', error)
      // Revert optimistic update on failure
      setTasks(initialTasks)
    }
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={customCollisionDetection}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
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
                    />
                  ))}
                </KanbanColumn>
              </SortableContext>
            )
          })}
        </div>
      </div>

      <DragOverlay
        dropAnimation={{
          duration: 200,
          easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)',
        }}
      >
        {activeTask && (
          <TaskCard
            task={activeTask}
            projectId={projectId}
            projectName={projectName}
            members={members}
            allUsers={allUsers}
            currentUserId={currentUserId}
            onUpdate={() => {}}
            isDragging
          />
        )}
      </DragOverlay>
    </DndContext>
  )
}
