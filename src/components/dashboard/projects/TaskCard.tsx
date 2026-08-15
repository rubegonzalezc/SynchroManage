'use client'

import { useState, useEffect, useRef, memo } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Box, Typography } from '@mui/material'
import { AvatarStack } from '@/components/ui/avatar-stack'
import { Calendar, GripVertical, RefreshCw } from 'lucide-react'
import { TaskDetailDialog } from './TaskDetailDialog'
import { categoryIcons, categoryLabels } from '@/lib/constants/categories'
import { useTheme } from '@/components/theme-provider'
import { tokens } from '@/theme/designTokens'

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

const priorityMeta: Record<string, { label: string; color: string }> = {
  low: { label: 'Baja', color: '#8E8E93' },
  medium: { label: 'Media', color: '#0A84FF' },
  high: { label: 'Alta', color: '#FF9F0A' },
  urgent: { label: 'Urgente', color: '#FF453A' },
}

export const TaskCard = memo(function TaskCard({ task, projectId, projectName, members, allUsers, currentUserId, onUpdate, isDragging, highlightId }: TaskCardProps) {
  const [showDetail, setShowDetail] = useState(false)
  const [highlighted, setHighlighted] = useState(false)
  const cardRef = useRef<HTMLDivElement | null>(null)
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme === 'dark'

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

  const isOverdue = Boolean(task.due_date && new Date(task.due_date) < new Date() && task.status !== 'done')
  const priority = priorityMeta[task.priority] || priorityMeta.medium
  const dimmed = isDragging || isSortableDragging

  return (
    <>
      <Box
        ref={(node) => { setNodeRef(node); (cardRef as React.MutableRefObject<HTMLDivElement | null>).current = node }}
        style={style}
        onClick={() => setShowDetail(true)}
        sx={{
          p: 1.5,
          borderRadius: '16px',
          cursor: 'pointer',
          opacity: dimmed ? 0.55 : 1,
          bgcolor: isDark ? 'rgba(15, 23, 42, 0.72)' : 'rgba(255, 255, 255, 0.82)',
          backdropFilter: 'blur(16px) saturate(160%)',
          WebkitBackdropFilter: 'blur(16px) saturate(160%)',
          border: highlighted
            ? `1px solid ${tokens.primary}`
            : (isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(255,255,255,0.8)'),
          boxShadow: highlighted
            ? `0 0 0 3px rgba(37, 99, 235, 0.22), 0 12px 28px rgba(15,23,42,0.12)`
            : (isDark
              ? '0 6px 18px rgba(0,0,0,0.22), inset 0 1px 0 rgba(255,255,255,0.06)'
              : '0 6px 18px rgba(15, 23, 42, 0.05), inset 0 1px 0 rgba(255,255,255,0.9)'),
          transition: `transform 280ms ${tokens.ease}, box-shadow 280ms ${tokens.ease}`,
          '&:hover': {
            transform: dimmed ? undefined : 'translateY(-1px)',
            boxShadow: isDark
              ? '0 12px 28px rgba(0,0,0,0.32), inset 0 1px 0 rgba(255,255,255,0.08)'
              : '0 14px 32px rgba(15, 23, 42, 0.1), inset 0 1px 0 rgba(255,255,255,1)',
          },
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
          <Box
            component="button"
            type="button"
            {...attributes}
            {...listeners}
            onClick={(e: React.MouseEvent) => e.stopPropagation()}
            sx={{
              mt: 0.25,
              p: 0,
              border: 0,
              bgcolor: 'transparent',
              color: 'text.secondary',
              cursor: 'grab',
              '&:active': { cursor: 'grabbing' },
            }}
          >
            <GripVertical className="w-4 h-4" />
          </Box>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 0.5 }}>
              {task.task_number != null && (
                <Box
                  sx={{
                    fontSize: 11,
                    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                    color: 'text.secondary',
                    bgcolor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(15,23,42,0.05)',
                    px: 0.75,
                    py: 0.15,
                    borderRadius: 1,
                    flexShrink: 0,
                  }}
                >
                  #{task.task_number}
                </Box>
              )}
              <Typography noWrap sx={{ fontWeight: 600, fontSize: 13.5, letterSpacing: '-0.02em' }}>
                {task.title}
              </Typography>
            </Box>

            {task.description && (
              <Typography
                sx={{
                  fontSize: 12,
                  color: 'text.secondary',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                  mb: 1,
                }}
              >
                {task.description}
              </Typography>
            )}

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, flexWrap: 'wrap' }}>
              {task.is_carry_over && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.4, fontSize: 11, color: '#FF9F0A', fontWeight: 600 }}>
                  <RefreshCw className="w-3 h-3" />
                  Carry
                </Box>
              )}

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, fontSize: 11, color: 'text.secondary' }}>
                <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: priority.color }} />
                {priority.label}
              </Box>

              {task.category && (
                <Typography sx={{ fontSize: 11, color: 'text.secondary' }}>
                  {categoryIcons[task.category]} {categoryLabels[task.category] || 'Tarea'}
                </Typography>
              )}

              {task.complexity != null ? (
                <Typography sx={{ fontSize: 11, color: 'text.secondary', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace' }}>
                  {task.complexity} pts
                </Typography>
              ) : null}

              {task.due_date && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.4, fontSize: 11, color: isOverdue ? '#FF453A' : 'text.secondary', fontWeight: isOverdue ? 600 : 400 }}>
                  <Calendar className="w-3 h-3" />
                  {formatDate(task.due_date)}
                </Box>
              )}
            </Box>

            {task.assignees.length > 0 && (
              <Box sx={{ mt: 1 }}>
                <AvatarStack assignees={task.assignees} maxVisible={3} />
              </Box>
            )}
          </Box>
        </Box>
      </Box>

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
}, (prev, next) => {
  // Solo re-renderizar si cambian props relevantes
  return (
    prev.task.id === next.task.id &&
    prev.task.title === next.task.title &&
    prev.task.status === next.task.status &&
    prev.task.priority === next.task.priority &&
    prev.task.category === next.task.category &&
    prev.task.due_date === next.task.due_date &&
    prev.task.position === next.task.position &&
    prev.task.complexity === next.task.complexity &&
    prev.task.is_carry_over === next.task.is_carry_over &&
    prev.task.assignees.length === next.task.assignees.length &&
    prev.isDragging === next.isDragging &&
    prev.highlightId === next.highlightId &&
    prev.currentUserId === next.currentUserId
  )
})
