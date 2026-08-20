'use client'

import { useState, useEffect, useCallback, type ReactNode } from 'react'
import { format } from 'date-fns'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { MultiSelectDeveloper } from '@/components/ui/multi-select-developer'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { MentionInput, renderMentions, extractMentionedUserIds, extractMentionAll } from '@/components/ui/mention-input'
import { DatePicker } from '@/components/ui/date-picker'
import { Loader2, Trash2, Send, RefreshCw, GitBranch, Pencil, ArrowLeft, Calendar, User } from 'lucide-react'
import { CopyButton } from '@/components/ui/copy-button'
import { createClient } from '@/lib/supabase/client'
import { FileAttachments } from '@/components/ui/file-attachments'
import { TASK_CATEGORIES, categoryIcons, categoryLabels } from '@/lib/constants/categories'
import { SingleSelectUser } from '@/components/ui/single-select-user'
import { MultiSelectTask, type TaskOption } from '@/components/ui/multi-select-task'
import {
  formatDependencyLabel,
  resolveDependencyTasks,
} from '@/lib/utils/task-dependency'
import { DependencyBlockedWarning, renderTaskStatusSelectItems } from '@/components/dashboard/tasks/task-status-select'
import { useProjectTaskStatusRealtime } from '@/hooks/useProjectTaskStatusRealtime'
import { formatCarryOverLabel, formatSprintHuLabel } from '@/lib/utils/task-sprint-order'
import { FormattedText } from '@/components/ui/formatted-text'
import { useDynamicIslandToast } from '@/components/ui/dynamic-island-toast'
import { readApiError } from '@/lib/utils/api-error'
import { AvatarStack } from '@/components/ui/avatar-stack'

interface Member {
  id: string
  full_name: string
  avatar_url: string | null
  roles?: string[]
}

interface Comment {
  id: string
  content: string
  created_at: string
  user: {
    id: string
    full_name: string
    avatar_url: string | null
    role: { name: string } | null
  }
}

interface SprintOption {
  id: string
  name: string
  status: 'planning' | 'active' | 'completed'
}

interface TaskDetail {
  id: string
  task_number: number | null
  title: string
  description: string | null
  status: string
  priority: string
  category?: string
  branch_name?: string | null
  complexity?: number | null
  due_date: string | null
  sprint_id: string | null
  sprint_order?: number | null
  is_carry_over: boolean
  carry_over_sprint_order?: number | null
  reviewer_id?: string | null
  reviewer?: { id: string; full_name: string; avatar_url: string | null } | null
  depends_on_task_id?: string | null
  depends_on_task_ids?: string[]
  depends_on?: { id: string; task_number: number | null; title: string; status: string } | null
  dependencies?: { id: string; task_number: number | null; title: string; status: string }[]
  sprint?: SprintOption | null
  assignee: { id: string; full_name: string; avatar_url: string | null } | null
  assignees: { id: string; full_name: string; avatar_url: string | null }[]
  comments: Comment[]
}

interface TaskDetailDialogProps {
  taskId: string
  projectId: string
  projectName: string
  open: boolean
  onOpenChange: (open: boolean) => void
  members: Member[]
  allUsers: Member[]
  currentUserId: string
  onUpdate: () => void
  /** 'view' = lectura + cambio de estado; 'edit' = formulario completo */
  initialMode?: 'view' | 'edit'
}

const roleColors: Record<string, string> = {
  admin: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  pm: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  tech_lead: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  developer: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  stakeholder: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400',
}

const roleLabels: Record<string, string> = {
  admin: 'Admin',
  pm: 'PM',
  tech_lead: 'Tech Lead',
  developer: 'Dev',
  stakeholder: 'Stakeholder',
}

const taskPriorityLabels: Record<string, string> = {
  low: 'Baja',
  medium: 'Media',
  high: 'Alta',
  urgent: 'Urgente',
}

const taskPriorityColors: Record<string, string> = {
  low: '#8E8E93',
  medium: '#0A84FF',
  high: '#FF9F0A',
  urgent: '#FF453A',
}

function SheetSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="space-y-2">
      <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground px-0.5">
        {title}
      </p>
      <div className="rounded-[18px] bg-white/55 dark:bg-white/[0.04] border border-white/70 dark:border-white/10 p-4 space-y-4 min-w-0 w-full">
        {children}
      </div>
    </div>
  )
}

export function TaskDetailDialog({
  taskId,
  projectId,
  projectName,
  open,
  onOpenChange,
  members,
  allUsers,
  currentUserId,
  onUpdate,
  initialMode = 'view',
}: TaskDetailDialogProps) {
  const { showError } = useDynamicIslandToast()
  const [mode, setMode] = useState<'view' | 'edit'>(initialMode)
  const [task, setTask] = useState<TaskDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [statusSaving, setStatusSaving] = useState(false)
  const [statusError, setStatusError] = useState<string | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [newComment, setNewComment] = useState('')
  const [sendingComment, setSendingComment] = useState(false)
  const [deletingCommentId, setDeletingCommentId] = useState<string | null>(null)
  const [deleteTaskDialogOpen, setDeleteTaskDialogOpen] = useState(false)
  const [deleteCommentDialogOpen, setDeleteCommentDialogOpen] = useState(false)
  const [commentToDelete, setCommentToDelete] = useState<string | null>(null)
  const [hasNewComments, setHasNewComments] = useState(false)
  const [projectSprints, setProjectSprints] = useState<SprintOption[]>([])
  const [projectTasks, setProjectTasks] = useState<TaskOption[]>([])
  const [autoBranchName, setAutoBranchName] = useState(true)

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: '',
    priority: '',
    category: 'task',
    assignee_ids: [] as string[],
    reviewer_id: null as string | null,
    due_date: '',
    sprint_id: '',
    branch_name: '',
    complexity: null as number | null,
    depends_on_task_ids: [] as string[],
  })

  const fetchTask = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/dashboard/tasks/${taskId}`)
      const data = await response.json()
      if (response.ok) {
        setTask(data.task)
        setFormData({
          title: data.task.title,
          description: data.task.description || '',
          status: data.task.status,
          priority: data.task.priority,
          category: data.task.category || 'task',
          assignee_ids: (data.task.assignees || []).map((a: { id: string }) => a.id),
          reviewer_id: data.task.reviewer_id ?? null,
          due_date: data.task.due_date || '',
          sprint_id: data.task.sprint_id || '',
          branch_name: data.task.branch_name || '',
          complexity: data.task.complexity ?? null,
          depends_on_task_ids: data.task.depends_on_task_ids
            ?? data.task.dependencies?.map((dep: { id: string }) => dep.id)
            ?? (data.task.depends_on_task_id ? [data.task.depends_on_task_id] : []),
        })
        setHasNewComments(false)
      }
    } catch (error) {
      console.error('Error fetching task:', error)
    } finally {
      setLoading(false)
    }
  }

  // Autocompletar branch_name cuando autoBranchName es true
  useEffect(() => {
    if (autoBranchName) {
      if (!formData.title) {
        setFormData(prev => ({ ...prev, branch_name: '' }))
        return
      }
      const slug = formData.title
        .toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
      
      const newBranch = `${formData.category}/${slug}-${task?.task_number || ''}`
      setFormData(prev => ({ ...prev, branch_name: newBranch }))
    }
  }, [formData.title, formData.category, autoBranchName, task?.task_number])

  useEffect(() => {
    if (open && taskId) {
      fetchTask()
    }
  }, [open, taskId])

  useEffect(() => {
    if (open) {
      setMode(initialMode)
      setStatusError(null)
    }
  }, [open, initialMode])

  // Cargar sprints y tareas del proyecto al abrir
  useEffect(() => {
    if (!open || !projectId) return
    fetch(`/api/dashboard/projects/${projectId}/sprints`)
      .then(r => r.json())
      .then(data => { if (data.sprints) setProjectSprints(data.sprints) })
      .catch(() => {})
    fetch(`/api/dashboard/projects/${projectId}`)
      .then(r => r.json())
      .then(data => {
        if (data.project?.tasks) {
          setProjectTasks(data.project.tasks.map((t: TaskOption) => ({
            id: t.id,
            task_number: t.task_number,
            title: t.title,
            status: t.status,
          })))
        }
      })
      .catch(() => {})
  }, [open, projectId])

  // Suscribirse a cambios en comentarios de esta tarea
  useEffect(() => {
    if (!open || !taskId) return

    const supabase = createClient()
    
    const channel = supabase
      .channel(`task-comments-${taskId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'comments',
          filter: `task_id=eq.${taskId}`,
        },
        (payload) => {
          const newCommentUserId = (payload.new as { user_id: string }).user_id
          if (newCommentUserId !== currentUserId) {
            setHasNewComments(true)
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'comments',
          filter: `task_id=eq.${taskId}`,
        },
        () => {
          // Recargar para actualizar la lista
          fetchTask()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [open, taskId, currentUserId])

  const handleSave = async () => {
    setSaving(true)
    setSaveError(null)
    try {
      const previousAssigneeIds = (task?.assignees || []).map(a => a.id)

      const response = await fetch(`/api/dashboard/tasks/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const errorMessage = await readApiError(response, 'No se pudo guardar la tarea')
        setSaveError(errorMessage)
        showError(errorMessage)
        return
      }
      
      // Notificar a los nuevos asignados (los que no estaban antes)
      const newAssigneeIds = formData.assignee_ids.filter(id => !previousAssigneeIds.includes(id))
      for (const assigneeId of newAssigneeIds) {
        await fetch('/api/dashboard/notifications', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id: assigneeId,
            type: 'task_assigned',
            title: 'Te asignaron una tarea',
            message: `Te asignaron la tarea "${formData.title}" en el proyecto "${projectName}"`,
            link: `/projects/${projectId}`,
            task_id: taskId,
            project_id: projectId,
          }),
        })
      }
      
      onUpdate()
      if (initialMode === 'view') {
        await fetchTask()
        setMode('view')
      } else {
        onOpenChange(false)
      }
    } catch (error) {
      console.error('Error saving task:', error)
      const errorMessage = 'No se pudo guardar la tarea'
      setSaveError(errorMessage)
      showError(errorMessage)
    } finally {
      setSaving(false)
    }
  }

  const handleStatusChange = async (newStatus: string) => {
    if (!task || newStatus === task.status) return

    setStatusSaving(true)
    setStatusError(null)
    try {
      const response = await fetch(`/api/dashboard/tasks/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, status: newStatus }),
      })
      const data = await response.json().catch(() => ({}))

      if (!response.ok) {
        const errorMessage = typeof data.error === 'string'
          ? data.error
          : 'No se pudo cambiar el estado'
        setStatusError(errorMessage)
        showError(errorMessage)
        return
      }

      setFormData((prev) => ({ ...prev, status: newStatus }))
      setTask((prev) => (prev ? { ...prev, status: newStatus } : null))
      onUpdate()
    } catch (error) {
      console.error('Error updating status:', error)
      const errorMessage = 'No se pudo cambiar el estado'
      setStatusError(errorMessage)
      showError(errorMessage)
    } finally {
      setStatusSaving(false)
    }
  }

  const resetFormFromTask = () => {
    if (!task) return
    setFormData({
      title: task.title,
      description: task.description || '',
      status: task.status,
      priority: task.priority,
      category: task.category || 'task',
      assignee_ids: (task.assignees || []).map((a) => a.id),
      reviewer_id: task.reviewer_id ?? null,
      due_date: task.due_date || '',
      sprint_id: task.sprint_id || '',
      branch_name: task.branch_name || '',
      complexity: task.complexity ?? null,
      depends_on_task_ids: task.depends_on_task_ids
        ?? task.dependencies?.map((dep) => dep.id)
        ?? (task.depends_on_task_id ? [task.depends_on_task_id] : []),
    })
  }

  const handleCancelEdit = () => {
    if (initialMode === 'view') {
      resetFormFromTask()
      setMode('view')
      return
    }
    onOpenChange(false)
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await fetch(`/api/dashboard/tasks/${taskId}`, { method: 'DELETE' })
      onUpdate()
      onOpenChange(false)
    } catch (error) {
      console.error('Error deleting task:', error)
    } finally {
      setDeleting(false)
      setDeleteTaskDialogOpen(false)
    }
  }

  const handleSendComment = async () => {
    if (!newComment.trim()) return
    setSendingComment(true)
    try {
      const response = await fetch('/api/dashboard/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ task_id: taskId, content: newComment }),
      })
      
      if (response.ok) {
        const data = await response.json()

        // Añadir el comentario al estado local sin recargar la tarea
        if (data.comment) {
          setTask(prev => prev ? { ...prev, comments: [...prev.comments, data.comment] } : null)
        }

        setNewComment('')

        // Crear notificaciones para usuarios mencionados individualmente
        const mentionedUserIds = extractMentionedUserIds(newComment, allUsers)
        for (const userId of mentionedUserIds) {
          await fetch('/api/dashboard/notifications', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              user_id: userId,
              type: 'mention',
              title: 'Te mencionaron en un comentario',
              message: `Te mencionaron en la tarea "${task?.title}" del proyecto "${projectName}"`,
              link: `/projects/${projectId}`,
              task_id: taskId,
              project_id: projectId,
              comment_id: data.comment?.id,
            }),
          })
        }

        // Si se usó @Todos, notificar a todos los integrantes del proyecto
        if (extractMentionAll(newComment)) {
          const allMembersToNotify = allUsers.filter(u => u.id !== currentUserId && !mentionedUserIds.includes(u.id))
          for (const member of allMembersToNotify) {
            await fetch('/api/dashboard/notifications', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                user_id: member.id,
                type: 'mention',
                title: 'Te mencionaron en un comentario',
                message: `Mencionaron a @Todos en la tarea "${task?.title}" del proyecto "${projectName}"`,
                link: `/projects/${projectId}`,
                task_id: taskId,
                project_id: projectId,
                comment_id: data.comment?.id,
              }),
            })
          }
        }
      }
    } catch (error) {
      console.error('Error sending comment:', error)
    } finally {
      setSendingComment(false)
    }
  }

  const handleDeleteCommentClick = (commentId: string) => {
    setCommentToDelete(commentId)
    setDeleteCommentDialogOpen(true)
  }

  const handleDeleteCommentConfirm = async () => {
    if (!commentToDelete) return
    setDeletingCommentId(commentToDelete)
    try {
      const response = await fetch(`/api/dashboard/comments/${commentToDelete}`, { method: 'DELETE' })
      if (response.ok) {
        fetchTask()
      }
    } catch (error) {
      console.error('Error deleting comment:', error)
    } finally {
      setDeletingCommentId(null)
      setDeleteCommentDialogOpen(false)
      setCommentToDelete(null)
    }
  }

  const getInitials = (name: string | null) => {
    if (!name) return '??'
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  const developerMembers = members.filter(u => u.roles?.includes('developer'))

  const formatDateTime = (date: string) => {
    return new Date(date).toLocaleString('es-CL', {
      day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
    })
  }

  const dependencyTasks = resolveDependencyTasks(
    formData.depends_on_task_ids,
    task?.dependencies,
    projectTasks
  )

  const handleProjectTaskStatusUpdate = useCallback((updatedTaskId: string, status: string) => {
    setProjectTasks((prev) =>
      prev.map((t) => (t.id === updatedTaskId ? { ...t, status } : t))
    )
    setTask((prev) => {
      if (!prev?.dependencies?.length) return prev
      return {
        ...prev,
        dependencies: prev.dependencies.map((dep) =>
          dep.id === updatedTaskId ? { ...dep, status } : dep
        ),
      }
    })
  }, [])

  useProjectTaskStatusRealtime(projectId, open, handleProjectTaskStatusUpdate)

  const formatDate = (date: string | null) => {
    if (!date) return null
    return new Date(date).toLocaleDateString('es-CL', { day: '2-digit', month: 'short', year: 'numeric' })
  }

  const isOverdue = Boolean(task?.due_date && new Date(task.due_date) < new Date() && task.status !== 'done')
  const sprintHuLabel = formatSprintHuLabel(task?.sprint_order)
  const carryOverLabel = task?.is_carry_over
    ? formatCarryOverLabel(task.carry_over_sprint_order)
    : null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-2xl"
        footer={task && !loading ? (
          mode === 'view' ? (
            <div className="flex justify-end">
              <Button variant="outline" onClick={() => onOpenChange(false)}>Cerrar</Button>
            </div>
          ) : (
            <div className="flex justify-between gap-2">
              <Button variant="destructive" onClick={() => setDeleteTaskDialogOpen(true)} disabled={deleting}>
                {deleting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Trash2 className="w-4 h-4 mr-2" />}
                Eliminar
              </Button>
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleCancelEdit}>Cancelar</Button>
                <Button onClick={handleSave} disabled={saving}>
                  {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                  Guardar
                </Button>
              </div>
            </div>
          )
        ) : undefined}
      >
        <DialogHeader className="flex flex-row items-start justify-between gap-3 pr-10">
          <DialogTitle className="flex-1 min-w-0">
            {mode === 'edit'
              ? (task?.task_number ? `Editar tarea #${task.task_number}` : 'Editar tarea')
              : (task?.task_number ? `Tarea #${task.task_number}` : 'Detalle de tarea')}
          </DialogTitle>
          {task && !loading && (
            <div className="flex items-center gap-1 shrink-0 -mt-0.5">
              {mode === 'view' ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 gap-1.5"
                  onClick={() => setMode('edit')}
                >
                  <Pencil className="w-3.5 h-3.5" />
                  Editar
                </Button>
              ) : initialMode === 'view' ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => {
                    resetFormFromTask()
                    setMode('view')
                  }}
                  aria-label="Volver a vista"
                >
                  <ArrowLeft className="w-4 h-4" />
                </Button>
              ) : null}
            </div>
          )}
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : task ? (
          mode === 'view' ? (
            <div className="space-y-5">
              <div className="space-y-2">
                <h2 className="text-xl font-semibold tracking-tight text-foreground leading-snug">
                  {task.title}
                </h2>
                <div className="flex flex-wrap items-center gap-2">
                  {task.task_number != null && (
                    <Badge variant="secondary" className="font-mono font-normal">
                      #{task.task_number}
                    </Badge>
                  )}
                  {sprintHuLabel && (
                    <Badge variant="outline" className="font-mono font-normal text-blue-700 border-blue-300 dark:text-blue-300 dark:border-blue-800">
                      {sprintHuLabel}
                    </Badge>
                  )}
                  <Badge variant="secondary" className="font-normal">
                    {categoryIcons[task.category || 'task']} {categoryLabels[task.category || 'task'] || 'Tarea'}
                  </Badge>
                  <Badge variant="outline" className="font-normal gap-1.5">
                    <span
                      className="inline-block w-2 h-2 rounded-full"
                      style={{ backgroundColor: taskPriorityColors[task.priority] || taskPriorityColors.medium }}
                    />
                    {taskPriorityLabels[task.priority] || 'Media'}
                  </Badge>
                  {task.complexity != null && (
                    <Badge variant="outline" className="font-mono font-normal">
                      {task.complexity} pts
                    </Badge>
                  )}
                  {task.is_carry_over && (
                    <Badge
                      variant="outline"
                      className="font-normal text-amber-700 border-amber-300 dark:text-amber-300"
                      title={carryOverLabel ?? 'Tarea arrastrada del sprint anterior'}
                    >
                      <RefreshCw className="w-3 h-3 mr-1" />
                      {carryOverLabel ?? 'Carry over'}
                    </Badge>
                  )}
                </div>
              </div>

              <SheetSection title="Estado">
                <DependencyBlockedWarning dependencyTasks={dependencyTasks} className="mb-3" />
                <Select
                  value={task.status}
                  onValueChange={handleStatusChange}
                  disabled={statusSaving}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {renderTaskStatusSelectItems(dependencyTasks)}
                  </SelectContent>
                </Select>
                {statusSaving && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-2">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Actualizando estado...
                  </p>
                )}
                {statusError && (
                  <p className="text-sm text-destructive mt-2">{statusError}</p>
                )}
              </SheetSection>

              <SheetSection title="Detalles">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  {task.due_date && (
                    <div className="space-y-1">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Fecha límite</p>
                      <p className={`flex items-center gap-1.5 ${isOverdue ? 'text-red-600 dark:text-red-400 font-medium' : 'text-foreground'}`}>
                        <Calendar className="w-3.5 h-3.5" />
                        {formatDate(task.due_date)}
                        {isOverdue ? ' · Vencida' : ''}
                      </p>
                    </div>
                  )}
                  {task.sprint && (
                    <div className="space-y-1">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Sprint</p>
                      <p className="text-foreground">{task.sprint.name}</p>
                    </div>
                  )}
                  {dependencyTasks.length > 0 && (
                    <div className="space-y-1 sm:col-span-2">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Dependencias</p>
                      <div className="flex flex-wrap gap-1.5">
                        {dependencyTasks.map((dep) => (
                          <Badge
                            key={dep.id}
                            variant={dep.status === 'done' ? 'secondary' : 'outline'}
                            className="font-normal"
                          >
                            {formatDependencyLabel(dep)}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {task.assignees.length > 0 && (
                    <div className="space-y-1">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Asignados</p>
                      <AvatarStack assignees={task.assignees} maxVisible={5} />
                    </div>
                  )}
                  {task.reviewer && (
                    <div className="space-y-1">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Revisor (QA)</p>
                      <p className="flex items-center gap-1.5 text-foreground">
                        <User className="w-3.5 h-3.5 text-muted-foreground" />
                        {task.reviewer.full_name}
                      </p>
                    </div>
                  )}
                </div>
              </SheetSection>

              {task.description && (
                <SheetSection title="Descripción">
                  <div className="text-sm text-muted-foreground leading-relaxed">
                    <FormattedText>{task.description}</FormattedText>
                  </div>
                </SheetSection>
              )}

              {task.branch_name && (
                <SheetSection title="Desarrollo">
                  <div className="flex items-center gap-2">
                    <GitBranch className="w-4 h-4 text-muted-foreground shrink-0" />
                    <code className="text-sm bg-muted/60 px-2 py-1 rounded-md flex-1 min-w-0 truncate">
                      {task.branch_name}
                    </code>
                    <CopyButton value={task.branch_name} />
                  </div>
                </SheetSection>
              )}

              <SheetSection title="Archivos">
                <FileAttachments taskId={taskId} currentUserId={currentUserId} />
              </SheetSection>

              <SheetSection title="Comentarios">
                {hasNewComments && (
                  <button
                    onClick={fetchTask}
                    className="w-full py-2 px-3 rounded-xl bg-blue-500/10 text-blue-700 dark:text-blue-400 text-xs font-medium flex items-center justify-center gap-2 mb-3"
                  >
                    <RefreshCw className="w-3 h-3" />
                    Hay nuevos comentarios. Toca para actualizar
                  </button>
                )}

                <div className="space-y-3">
                  {task.comments.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-3">No hay comentarios</p>
                  ) : (
                    task.comments.map((comment) => (
                      <div key={comment.id} className="flex gap-3 group">
                        <Avatar className="w-8 h-8 flex-shrink-0">
                          <AvatarImage src={comment.user.avatar_url || undefined} />
                          <AvatarFallback className="bg-muted text-muted-foreground text-xs">
                            {getInitials(comment.user.full_name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium text-sm text-foreground">{comment.user.full_name}</span>
                            {comment.user.role && (
                              <Badge variant="secondary" className={`text-xs ${roleColors[comment.user.role.name] || ''}`}>
                                {roleLabels[comment.user.role.name] || comment.user.role.name}
                              </Badge>
                            )}
                            <span className="text-xs text-muted-foreground">{formatDateTime(comment.created_at)}</span>
                            <button
                              onClick={() => handleDeleteCommentClick(comment.id)}
                              disabled={deletingCommentId === comment.id}
                              className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-red-600 dark:hover:text-red-400 disabled:opacity-50"
                            >
                              {deletingCommentId === comment.id ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                <Trash2 className="w-3 h-3" />
                              )}
                            </button>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">{renderMentions(comment.content, allUsers, currentUserId)}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="flex gap-2 pt-1">
                  <MentionInput
                    value={newComment}
                    onChange={setNewComment}
                    onSubmit={handleSendComment}
                    users={allUsers}
                    placeholder="Escribe un comentario... usa @ para mencionar"
                    disabled={sendingComment}
                  />
                  <Button onClick={handleSendComment} disabled={sendingComment || !newComment.trim()} size="icon">
                    {sendingComment ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  </Button>
                </div>
              </SheetSection>
            </div>
          ) : (
          <div className="space-y-5">
            <SheetSection title="Información">
              <div className="space-y-2">
                <Label>Título</Label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Descripción</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe la tarea. Usa **negrita** o *cursiva*."
                  className="min-h-[88px] resize-y"
                />
                {formData.description.trim() && (
                  <div className="rounded-md border border-border/60 bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
                    <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground/80 mb-1">Vista previa</p>
                    <FormattedText>{formData.description}</FormattedText>
                  </div>
                )}
              </div>
            </SheetSection>

            <SheetSection title="Planificación">
                <DependencyBlockedWarning dependencyTasks={dependencyTasks} />
                {saveError && (
                  <div className="rounded-lg border border-red-200 bg-red-50 dark:bg-red-950/30 dark:border-red-800 px-3 py-2 text-sm text-red-900 dark:text-red-200">
                    {saveError}
                  </div>
                )}
              <div className="grid grid-cols-2 gap-4 min-w-0">
                <div className="space-y-2">
                  <Label>Estado</Label>
                  <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {renderTaskStatusSelectItems(dependencyTasks)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Prioridad</Label>
                  <Select value={formData.priority} onValueChange={(v) => setFormData({ ...formData, priority: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Baja</SelectItem>
                      <SelectItem value="medium">Media</SelectItem>
                      <SelectItem value="high">Alta</SelectItem>
                      <SelectItem value="urgent">Urgente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Categoría</Label>
                  <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {TASK_CATEGORIES.map(cat => (
                        <SelectItem key={cat.slug} value={cat.slug}>
                          {cat.icon} {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Complejidad</Label>
                  <Select
                    value={formData.complexity === null ? '?' : String(formData.complexity)}
                    onValueChange={(v) => setFormData({ ...formData, complexity: v === '?' ? null : Number(v) })}
                  >
                    <SelectTrigger><SelectValue placeholder="Seleccionar complejidad" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="?">? — No sé</SelectItem>
                      {[1,2,3,4,5,6,7,8,9,10].map(n => (
                        <SelectItem key={n} value={String(n)}>{n}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Fecha límite</Label>
                  <DatePicker
                    value={formData.due_date ? new Date(formData.due_date + 'T00:00:00') : null}
                    onChange={(date) => setFormData({ ...formData, due_date: date ? format(date, 'yyyy-MM-dd') : '' })}
                    placeholder="Seleccionar fecha"
                  />
                </div>
                {projectSprints.length > 0 && (
                  <div className="space-y-2">
                    <Label>Sprint</Label>
                    <Select
                      value={formData.sprint_id || 'none'}
                      onValueChange={(v) => setFormData(prev => ({ ...prev, sprint_id: v === 'none' ? '' : v }))}
                    >
                      <SelectTrigger><SelectValue placeholder="Sin sprint (Backlog)" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Sin sprint (Backlog)</SelectItem>
                        {projectSprints.map(s => (
                          <SelectItem key={s.id} value={s.id}>
                            {s.name}{s.status === 'active' ? ' (Activo)' : ''}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <div className="col-span-2">
                  <MultiSelectTask
                    tasks={projectTasks}
                    selectedIds={formData.depends_on_task_ids}
                    onSelectionChange={(ids) => setFormData(prev => ({ ...prev, depends_on_task_ids: ids }))}
                    excludeTaskId={taskId}
                    placeholder="Buscar por # o título..."
                    hint="Para avanzar en esta tarea, primero deben completarse todas las dependencias seleccionadas."
                  />
                </div>
              </div>
            </SheetSection>

            <SheetSection title="Personas">
              <div className="grid grid-cols-2 gap-4 min-w-0">
                <div className="space-y-2">
                  <Label>Asignados</Label>
                  <MultiSelectDeveloper
                    members={developerMembers}
                    selectedIds={formData.assignee_ids}
                    onSelectionChange={(ids) => setFormData(prev => ({ ...prev, assignee_ids: ids }))}
                    placeholder="Buscar desarrollador..."
                  />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-1.5">
                    Revisor (QA)
                    <span className="text-[10px] font-normal text-muted-foreground">opcional</span>
                  </Label>
                  <SingleSelectUser
                    users={members}
                    selectedId={formData.reviewer_id}
                    onSelectionChange={(id) => setFormData(prev => ({ ...prev, reviewer_id: id }))}
                    placeholder="Asignar revisor..."
                    emptyLabel="Sin revisor"
                  />
                </div>
              </div>
            </SheetSection>

            <SheetSection title="Desarrollo">
              <div className="flex items-center justify-between mb-1">
                <Label className="flex items-center gap-1.5">
                  <GitBranch className="w-3.5 h-3.5" />
                  Nombre de rama
                </Label>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="autoBranchEdit"
                    checked={autoBranchName}
                    onCheckedChange={(checked) => setAutoBranchName(checked === true)}
                    disabled={saving}
                  />
                  <Label htmlFor="autoBranchEdit" className="text-xs text-muted-foreground font-normal cursor-pointer">
                    Autocompletar
                  </Label>
                </div>
              </div>
              <div className="flex gap-2">
                <Input
                  value={formData.branch_name}
                  onChange={(e) => {
                    setFormData({ ...formData, branch_name: e.target.value })
                    if (autoBranchName) setAutoBranchName(false)
                  }}
                  placeholder="feat/nombre-de-la-tarea"
                  disabled={saving || autoBranchName}
                />
                <CopyButton value={formData.branch_name} />
              </div>
            </SheetSection>

            <SheetSection title="Archivos">
              <FileAttachments taskId={taskId} currentUserId={currentUserId} />
            </SheetSection>

            <SheetSection title="Comentarios">
              {hasNewComments && (
                <button
                  onClick={fetchTask}
                  className="w-full py-2 px-3 rounded-xl bg-blue-500/10 text-blue-700 dark:text-blue-400 text-xs font-medium flex items-center justify-center gap-2"
                >
                  <RefreshCw className="w-3 h-3" />
                  Hay nuevos comentarios. Toca para actualizar
                </button>
              )}

              <div className="space-y-3">
                {task.comments.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-3">No hay comentarios</p>
                ) : (
                  task.comments.map((comment) => (
                    <div key={comment.id} className="flex gap-3 group">
                      <Avatar className="w-8 h-8 flex-shrink-0">
                        <AvatarImage src={comment.user.avatar_url || undefined} />
                        <AvatarFallback className="bg-muted text-muted-foreground text-xs">
                          {getInitials(comment.user.full_name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-sm text-foreground">{comment.user.full_name}</span>
                          {comment.user.role && (
                            <Badge variant="secondary" className={`text-xs ${roleColors[comment.user.role.name] || ''}`}>
                              {roleLabels[comment.user.role.name] || comment.user.role.name}
                            </Badge>
                          )}
                          <span className="text-xs text-muted-foreground">{formatDateTime(comment.created_at)}</span>
                          <button
                            onClick={() => handleDeleteCommentClick(comment.id)}
                            disabled={deletingCommentId === comment.id}
                            className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-red-600 dark:hover:text-red-400 disabled:opacity-50"
                          >
                            {deletingCommentId === comment.id ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <Trash2 className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">{renderMentions(comment.content, allUsers, currentUserId)}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="flex gap-2 pt-1">
                <MentionInput
                  value={newComment}
                  onChange={setNewComment}
                  onSubmit={handleSendComment}
                  users={allUsers}
                  placeholder="Escribe un comentario... usa @ para mencionar"
                  disabled={sendingComment}
                />
                <Button onClick={handleSendComment} disabled={sendingComment || !newComment.trim()} size="icon">
                  {sendingComment ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </Button>
              </div>
            </SheetSection>
          </div>
          )
        ) : null}
      </DialogContent>

      {/* AlertDialog para eliminar tarea */}
      <AlertDialog open={deleteTaskDialogOpen} onOpenChange={setDeleteTaskDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar esta tarea?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. La tarea y todos sus comentarios serán eliminados permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* AlertDialog para eliminar comentario */}
      <AlertDialog open={deleteCommentDialogOpen} onOpenChange={setDeleteCommentDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar comentario?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. El comentario será eliminado permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={!!deletingCommentId}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteCommentConfirm}
              disabled={!!deletingCommentId}
              className="bg-red-600 hover:bg-red-700"
            >
              {deletingCommentId ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  )
}
