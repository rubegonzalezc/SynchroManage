'use client'

import { useState, useEffect } from 'react'
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
} from '@dnd-kit/core'
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
  assignee?: { id: string; full_name: string; avatar_url: string | null } | null // deprecated: kept for backward compat until TaskCard is updated
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

export function KanbanBoard({ tasks: initialTasks, projectId, projectName, members, allUsers, currentUserId, onTasksChange }: KanbanBoardProps) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks)
  const [activeTask, setActiveTask] = useState<Task | null>(null)

  // Sincronizar con props cuando cambian desde el padre
  useEffect(() => {
    setTasks(initialTasks)
  }, [initialTasks])

  // Configurar Realtime subscription para tareas
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
          // Refetch cuando hay cambios en las tareas del proyecto
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
      activationConstraint: { distance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const getTasksByStatus = (status: string) => {
    return tasks
      .filter(t => t.status === status)
      .sort((a, b) => a.position - b.position)
  }

  const handleDragStart = (event: DragStartEvent) => {
    const task = tasks.find(t => t.id === event.active.id)
    if (task) setActiveTask(task)
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    setActiveTask(null)

    if (!over) return

    const draggedTask = tasks.find(t => t.id === active.id)
    if (!draggedTask) return

    // Determinar la columna destino
    let newStatus = draggedTask.status
    
    // Si se soltó sobre una columna
    if (columns.some(c => c.id === over.id)) {
      newStatus = over.id as string
    } else {
      // Si se soltó sobre otra tarea, obtener su status
      const overTask = tasks.find(t => t.id === over.id)
      if (overTask) {
        newStatus = overTask.status
      }
    }

    // Calcular nueva posición
    const tasksInNewColumn = tasks
      .filter(t => t.status === newStatus && t.id !== draggedTask.id)
      .sort((a, b) => a.position - b.position)
    
    let newPosition = tasksInNewColumn.length

    if (over.id !== newStatus) {
      // Se soltó sobre una tarea específica
      const overIndex = tasksInNewColumn.findIndex(t => t.id === over.id)
      if (overIndex >= 0) {
        newPosition = overIndex
      }
    }

    // Solo actualizar si cambió algo
    if (draggedTask.status !== newStatus || draggedTask.position !== newPosition) {
      // Actualización optimista - actualizar UI inmediatamente
      setTasks(prevTasks => {
        return prevTasks.map(t => {
          if (t.id === draggedTask.id) {
            return { ...t, status: newStatus, position: newPosition }
          }
          return t
        })
      })

      // Enviar al servidor en background
      try {
        await fetch('/api/dashboard/tasks', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            taskId: draggedTask.id,
            status: newStatus,
            position: newPosition,
          }),
        })
        // Sincronizar con el servidor después de guardar
        onTasksChange()
      } catch (error) {
        console.error('Error updating task:', error)
        // Revertir en caso de error
        setTasks(initialTasks)
      }
    }
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="space-y-2">
        <div className="flex gap-4 overflow-x-auto pb-4">
          {columns.map((column) => {
            const columnTasks = getTasksByStatus(column.id)
            return (
              <SortableContext
                key={column.id}
                items={columnTasks.map(t => t.id)}
                strategy={verticalListSortingStrategy}
              >
                <KanbanColumn
                  id={column.id}
                  title={column.title}
                  color={column.color}
                  count={columnTasks.length}
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

      <DragOverlay>
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
