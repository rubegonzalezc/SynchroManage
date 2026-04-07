'use client'

import { useState, useEffect, useRef } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Badge } from '@/components/ui/badge'
import { AvatarStack } from '@/components/ui/avatar-stack'
import { Calendar, GripVertical, RefreshCw } from 'lucide-react'
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
  sprint_id?: string | null
  is_carry_over?: boolean
  complexity?: number | null
  assignees: { id: string; full_name: string; avatar_url: string | null }[]
}

interface Member {
  id: string
  full_name: string
  avatar_url: string | null
}

interface TaskCardProps {
  task: Task
  projectId: string
  projectName: string
  members: Member[]
  allUsers: Member[]
  currentUserId: string
  onUpdate: () => void
  isDragging?: boolean
  highlightId?: string | null
}

const priorityColors: Record<string, string> = {
  low: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
  medium: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
  high: 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400',
  urgent: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
}

const priorityLabels: Record<string, string> = {
  low: 'Baja',
  medium: 'Media',
  high: 'Alta',
  urgent: 'Urgente',
}


export function TaskCard({ task, projectId, projectName, members, allUsers, currentUserId, onUpdate, isDragging, highlightId }: TaskCardProps) {
  const [showDetail, setShowDetail] = useState(false)
  const [highlighted, setHighlighted] = useState(false)
  const cardRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (highlightId === task.id) {
      setTimeout(() => {
        cardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
        setHighlighted(true)
        setTimeout(() => setHighlighted(false), 2000)
      }, 400)
    }
  }, [highlightId, task.id])

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({ id: task.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const formatDate = (date: string | null) => {
    if (!date) return null
    return new Date(date).toLocaleDateString('es-CL', { day: '2-digit', month: 'short' })
  }

  const isOverdue = task.due_date && new Date(task.due_date) < new Date() && task.status !== 'done'

  return (
    <>
      <div
        ref={(node) => { setNodeRef(node); (cardRef as React.MutableRefObject<HTMLDivElement | null>).current = node }}
        style={style}
        className={`bg-card rounded-lg border p-3 cursor-pointer hover:shadow-md transition-all ${
          isDragging || isSortableDragging ? 'opacity-50 shadow-lg' : ''
        } ${highlighted ? 'border-primary shadow-[0_0_0_2px_hsl(var(--primary))] animate-pulse' : 'border-border'}`}
        onClick={() => setShowDetail(true)}
      >
        <div className="flex items-start gap-2">
          <button
            {...attributes}
            {...listeners}
            className="mt-0.5 text-muted-foreground hover:text-foreground cursor-grab active:cursor-grabbing"
            onClick={(e) => e.stopPropagation()}
          >
            <GripVertical className="w-4 h-4" />
          </button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              {task.task_number && (
                <span className="text-xs font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                  #{task.task_number}
                </span>
              )}
              <p className="font-medium text-foreground text-sm truncate">{task.title}</p>
            </div>
            {task.description && (
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{task.description}</p>
            )}
            
            <div className="flex items-center gap-2 flex-wrap">
              {task.is_carry_over && (
                <Badge variant="secondary" className="text-xs bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 gap-1">
                  <RefreshCw className="w-3 h-3" />
                  Carry Over
                </Badge>
              )}

              <Badge variant="secondary" className={`text-xs ${priorityColors[task.priority]}`}>
                {priorityLabels[task.priority]}
              </Badge>
              
              {task.category && (
                <Badge variant="secondary" className={`text-xs ${categoryColors[task.category] || categoryColors.task}`}>
                  {categoryIcons[task.category]} {categoryLabels[task.category] || 'Tarea'}
                </Badge>
              )}

              {task.complexity != null ? (
                <Badge variant="secondary" className="text-xs bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400 font-mono">
                  ⚡ {task.complexity}
                </Badge>
              ) : (
                <Badge variant="secondary" className="text-xs bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 font-mono">
                  ⚡ ?
                </Badge>
              )}
              
              {task.due_date && (
                <span className={`flex items-center gap-1 text-xs ${isOverdue ? 'text-red-600 dark:text-red-400' : 'text-muted-foreground'}`}>
                  <Calendar className="w-3 h-3" />
                  {formatDate(task.due_date)}
                </span>
              )}
            </div>

            {task.assignees.length > 0 && (
              <div className="mt-2">
                <AvatarStack assignees={task.assignees} maxVisible={3} />
              </div>
            )}
          </div>
        </div>
      </div>

      <TaskDetailDialog
        taskId={task.id}
        projectId={projectId}
        projectName={projectName}
        open={showDetail}
        onOpenChange={setShowDetail}
        members={members}
        allUsers={allUsers}
        currentUserId={currentUserId}
        onUpdate={onUpdate}
      />
    </>
  )
}
