'use client'

import { useState, useEffect, useRef, memo, type CSSProperties } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { FormattedText } from '@/components/ui/formatted-text'
import type { DraggableAttributes } from '@dnd-kit/core'
import type { SyntheticListenerMap } from '@dnd-kit/core/dist/hooks/utilities'
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

interface TaskCardBaseProps {
  task: Task
  projectId: string
  projectName: string
  members: Member[]
  allUsers: Member[]
  currentUserId: string
  onUpdate: () => void
  highlightId?: string | null
}

interface TaskCardProps extends TaskCardBaseProps {
  /** Tarjeta arrastrada en DragOverlay — sin useSortable ni diálogo */
  variant?: 'default' | 'overlay'
  /** @deprecated Usar variant="overlay" */
  isDragging?: boolean
}

const priorityMeta: Record<string, { label: string; color: string }> = {
  low: { label: 'Baja', color: '#8E8E93' },
  medium: { label: 'Media', color: '#0A84FF' },
  high: { label: 'Alta', color: '#FF9F0A' },
  urgent: { label: 'Urgente', color: '#FF453A' },
}

interface TaskCardViewProps extends TaskCardBaseProps {
  variant: 'default' | 'overlay'
  cardRef?: React.Ref<HTMLDivElement>
  style?: CSSProperties
  isSortableDragging?: boolean
  dragHandleProps?: {
    attributes: DraggableAttributes
    listeners: SyntheticListenerMap | undefined
  }
  onOpenDetail?: () => void
}

function TaskCardView({
  task,
  variant,
  cardRef,
  style,
  isSortableDragging = false,
  dragHandleProps,
  onOpenDetail,
}: TaskCardViewProps) {
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme === 'dark'
  const isOverlay = variant === 'overlay'

  const formatDate = (date: string | null) => {
    if (!date) return null
    return new Date(date).toLocaleDateString('es-CL', { day: '2-digit', month: 'short' })
  }

  const isOverdue = Boolean(task.due_date && new Date(task.due_date) < new Date() && task.status !== 'done')
  const priority = priorityMeta[task.priority] || priorityMeta.medium

  return (
    <Box
      ref={cardRef}
      style={style}
      onClick={isOverlay ? undefined : onOpenDetail}
      sx={{
        p: 1.5,
        borderRadius: '16px',
        cursor: isOverlay ? 'grabbing' : 'pointer',
        opacity: isSortableDragging ? 0 : 1,
        pointerEvents: isSortableDragging ? 'none' : 'auto',
        bgcolor: isDark ? 'rgba(15, 23, 42, 0.72)' : 'rgba(255, 255, 255, 0.82)',
        backdropFilter: 'blur(16px) saturate(160%)',
        WebkitBackdropFilter: 'blur(16px) saturate(160%)',
        border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(255,255,255,0.8)',
        boxShadow: isOverlay
          ? (isDark
            ? '0 20px 48px rgba(0,0,0,0.45), 0 0 0 1px rgba(255,255,255,0.12)'
            : '0 20px 48px rgba(15, 23, 42, 0.18), 0 0 0 1px rgba(255,255,255,0.95)')
          : (isDark
            ? '0 6px 18px rgba(0,0,0,0.22), inset 0 1px 0 rgba(255,255,255,0.06)'
            : '0 6px 18px rgba(15, 23, 42, 0.05), inset 0 1px 0 rgba(255,255,255,0.9)'),
        transition: isSortableDragging ? 'none' : `box-shadow 280ms ${tokens.ease}`,
        '&:hover': isOverlay || isSortableDragging
          ? undefined
          : {
              transform: 'translateY(-1px)',
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
          {...(dragHandleProps?.attributes ?? {})}
          {...(dragHandleProps?.listeners ?? {})}
          onClick={(e: React.MouseEvent) => e.stopPropagation()}
          sx={{
            mt: 0.25,
            p: 0,
            border: 0,
            bgcolor: 'transparent',
            color: 'text.secondary',
            cursor: isOverlay ? 'grabbing' : 'grab',
            touchAction: 'none',
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
              component="div"
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
              <FormattedText boldClassName="font-semibold">{task.description}</FormattedText>
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
  )
}

function SortableTaskCard(props: TaskCardBaseProps & { highlightId?: string | null }) {
  const [showDetail, setShowDetail] = useState(false)
  const [highlighted, setHighlighted] = useState(false)
  const cardRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (props.highlightId === props.task.id) {
      setTimeout(() => {
        cardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
        setHighlighted(true)
        setTimeout(() => setHighlighted(false), 2000)
      }, 400)
    }
  }, [props.highlightId, props.task.id])

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({ id: props.task.id })

  const style: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition: isSortableDragging ? undefined : transition,
    ...(highlighted
      ? {
          outline: `2px solid ${tokens.primary}`,
          outlineOffset: 2,
          borderRadius: 16,
        }
      : {}),
  }

  return (
    <>
      <TaskCardView
        {...props}
        variant="default"
        cardRef={(node) => {
          const el = (node as HTMLDivElement | null) ?? null
          setNodeRef(el)
          cardRef.current = el
        }}
        style={style}
        isSortableDragging={isSortableDragging}
        dragHandleProps={{ attributes, listeners }}
        onOpenDetail={() => setShowDetail(true)}
      />

      <TaskDetailDialog
        taskId={props.task.id}
        projectId={props.projectId}
        projectName={props.projectName}
        open={showDetail}
        onOpenChange={setShowDetail}
        members={props.members}
        allUsers={props.allUsers}
        currentUserId={props.currentUserId}
        onUpdate={props.onUpdate}
      />
    </>
  )
}

export const TaskCard = memo(function TaskCard({
  variant = 'default',
  isDragging: legacyIsDragging,
  ...props
}: TaskCardProps) {
  if (variant === 'overlay' || legacyIsDragging) {
    return <TaskCardView {...props} variant="overlay" />
  }

  return <SortableTaskCard {...props} />
}, (prev, next) => {
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
    prev.variant === next.variant &&
    prev.isDragging === next.isDragging &&
    prev.highlightId === next.highlightId &&
    prev.currentUserId === next.currentUserId
  )
})
