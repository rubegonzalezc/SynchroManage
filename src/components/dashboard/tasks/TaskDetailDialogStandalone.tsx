'use client'

import { useState, useEffect, useCallback } from 'react'
import { format } from 'date-fns'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { MentionInput, renderMentions, extractMentionedUserIds } from '@/components/ui/mention-input'
import { DatePicker } from '@/components/ui/date-picker'
import { Loader2, Trash2, Send, RefreshCw, ExternalLink, GitBranch, Copy, Check, Pencil, ArrowLeft, Calendar, User } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { FileAttachments } from '@/components/ui/file-attachments'
import { useDynamicIslandToast } from '@/components/ui/dynamic-island-toast'
import { readApiError } from '@/lib/utils/api-error'
import { TASK_CATEGORIES, categoryIcons, categoryLabels } from '@/lib/constants/categories'
import { getBranchName } from '@/lib/utils/branch-name'
import { SingleSelectUser } from '@/components/ui/single-select-user'
import { MultiSelectTask, type TaskOption } from '@/components/ui/multi-select-task'
import { SprintTaskReferenceBadge } from '@/components/ui/sprint-task-reference-badge'
import { formatSprintTaskReferenceLabel } from '@/lib/utils/task-sprint-order'
import { FormattedText } from '@/components/ui/formatted-text'
import { resolveDependencyTasks, formatDependencyLabel, getPendingDependencies, isAdvancedTaskStatus } from '@/lib/utils/task-dependency'
import { DependencyBlockedWarning, OpenBugsBlockedWarning, renderTaskStatusSelectItems, TASK_STATUS_OPTIONS, TASK_STATUS_PILL, TASK_STATUS_WASH } from '@/components/dashboard/tasks/task-status-select'
import type { BlockingBugRef } from '@/lib/utils/task-open-bugs'
import { TaskActivityHistory } from '@/components/dashboard/tasks/TaskActivityHistory'
import { useProjectTaskStatusRealtime } from '@/hooks/useProjectTaskStatusRealtime'

interface User {
  id: string
  full_name: string
  avatar_url: string | null
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
  due_date: string | null
  sprint_id: string | null
  sprint_order?: number | null
  is_carry_over?: boolean
  carry_over_sprint_order?: number | null
  reviewer_id?: string | null
  reviewer?: { id: string; full_name: string; avatar_url: string | null } | null
  depends_on_task_id?: string | null
  depends_on_task_ids?: string[]
  depends_on?: { id: string; task_number: number | null; title: string; status: string } | null
  dependencies?: {
    id: string
    task_number: number | null
    title: string
    status: string
    sprint_id?: string | null
    sprint_order?: number | null
  }[]
  assignee: { id: string; full_name: string; avatar_url: string | null } | null
  assignees?: { id: string; full_name: string; avatar_url: string | null }[]
  sprint?: { id: string; name: string; status: string } | null
  branch_name?: string | null
  project: { id: string; name: string } | null
  comments: Comment[]
  blocking_bugs?: BlockingBugRef[]
}

interface TaskDetailDialogStandaloneProps {
  taskId: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onTaskUpdated?: () => void
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

export function TaskDetailDialogStandalone({ taskId, open, onOpenChange, onTaskUpdated }: TaskDetailDialogStandaloneProps) {
  const { showError } = useDynamicIslandToast()
  const [mode, setMode] = useState<'view' | 'edit'>('view')
  const [task, setTask] = useState<TaskDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [statusSaving, setStatusSaving] = useState(false)
  const [statusError, setStatusError] = useState<string | null>(null)
  const [branchCopied, setBranchCopied] = useState(false)
  const [newComment, setNewComment] = useState('')
  const [sendingComment, setSendingComment] = useState(false)
  const [deleteCommentDialogOpen, setDeleteCommentDialogOpen] = useState(false)
  const [commentToDelete, setCommentToDelete] = useState<string | null>(null)
  const [deletingCommentId, setDeletingCommentId] = useState<string | null>(null)
  const [hasNewComments, setHasNewComments] = useState(false)
  const [allUsers, setAllUsers] = useState<User[]>([])
  const [currentUserId, setCurrentUserId] = useState<string>('')
  const [members, setMembers] = useState<User[]>([])
  const [projectSprints, setProjectSprints] = useState<SprintOption[]>([])
  const [projectTasks, setProjectTasks] = useState<TaskOption[]>([])
  const [saveError, setSaveError] = useState<string | null>(null)
  const [activityRefreshKey, setActivityRefreshKey] = useState(0)

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: '',
    priority: '',
    category: 'task',
    assignee_id: '',
    reviewer_id: '',
    due_date: '',
    sprint_id: '',
    depends_on_task_ids: [] as string[],
  })

  const fetchTask = async () => {
    try {
      const response = await fetch(`/api/dashboard/tasks/${taskId}`)
      const data = await response.json()
      if (response.ok && data.task) {
        setTask(data.task)
        setFormData({
          title: data.task.title,
          description: data.task.description || '',
          status: data.task.status,
          priority: data.task.priority,
          category: data.task.category || 'task',
          assignee_id: data.task.assignee?.id || '',
          reviewer_id: data.task.reviewer?.id || data.task.reviewer_id || '',
          due_date: data.task.due_date || '',
          sprint_id: data.task.sprint_id || '',
          depends_on_task_ids: data.task.depends_on_task_ids
            ?? data.task.dependencies?.map((dep: { id: string }) => dep.id)
            ?? (data.task.depends_on_task_id ? [data.task.depends_on_task_id] : []),
        })
        setHasNewComments(false)
        // Cargar sprints del proyecto
        if (data.task.project?.id) {
          fetch(`/api/dashboard/projects/${data.task.project.id}/sprints`)
            .then(r => r.json())
            .then(d => { if (d.sprints) setProjectSprints(d.sprints) })
            .catch(() => {})
        }
      }
    } catch (error) {
      console.error('Error fetching task:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/dashboard/users')
      const data = await response.json()
      if (response.ok) {
        setAllUsers(data.users.map((u: User) => ({
          id: u.id,
          full_name: u.full_name,
          avatar_url: u.avatar_url
        })))
      }
    } catch (err) {
      console.error('Error fetching users:', err)
    }
  }

  const fetchCurrentUser = async () => {
    try {
      const response = await fetch('/api/dashboard/me')
      const data = await response.json()
      if (response.ok && data.user) {
        setCurrentUserId(data.user.id)
      }
    } catch (err) {
      console.error('Error fetching current user:', err)
    }
  }

  const fetchProjectMembers = async (projectId: string) => {
    try {
      const response = await fetch(`/api/dashboard/projects/${projectId}`)
      const data = await response.json()
      if (response.ok && data.project) {
        const membersMap = new Map<string, User>()
        if (data.project.pm) {
          membersMap.set(data.project.pm.id, data.project.pm)
        }
        if (data.project.tech_lead) {
          membersMap.set(data.project.tech_lead.id, data.project.tech_lead)
        }
        data.project.members?.forEach((m: { user: User }) => {
          membersMap.set(m.user.id, m.user)
        })
        setMembers(Array.from(membersMap.values()))
        setProjectTasks((data.project.tasks || []).map((t: TaskOption & { sprint_id?: string | null; sprint_order?: number | null }) => ({
          id: t.id,
          task_number: t.task_number,
          title: t.title,
          status: t.status,
          sprint_id: t.sprint_id ?? null,
          sprint_order: t.sprint_order ?? null,
        })))
      }
    } catch (err) {
      console.error('Error fetching project members:', err)
    }
  }

  useEffect(() => {
    if (open && taskId) {
      setMode('view')
      setLoading(true)
      fetchTask()
      fetchUsers()
      fetchCurrentUser()
    }
  }, [open, taskId])

  useEffect(() => {
    if (task?.project?.id) {
      fetchProjectMembers(task.project.id)
    }
  }, [task?.project?.id])


  // Realtime para comentarios
  useEffect(() => {
    if (!open || !taskId) return
    
    const supabase = createClient()
    const channel = supabase
      .channel(`task-comments-standalone-${taskId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'comments', filter: `task_id=eq.${taskId}` },
        (payload) => {
          const newCommentUserId = (payload.new as { user_id: string }).user_id
          if (newCommentUserId !== currentUserId) {
            setHasNewComments(true)
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'comments', filter: `task_id=eq.${taskId}` },
        (payload) => {
          const deletedId = (payload.old as { id: string }).id
          setTask(prev => prev ? { ...prev, comments: prev.comments.filter(c => c.id !== deletedId) } : null)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [open, taskId, currentUserId])

  const handleSave = async () => {
    if (!task) return
    setSaving(true)
    setSaveError(null)
    try {
      const response = await fetch(`/api/dashboard/tasks/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          sprint_id: formData.sprint_id || null,
          reviewer_id: formData.reviewer_id || null,
          depends_on_task_ids: formData.depends_on_task_ids,
        }),
      })
      if (!response.ok) {
        const errorMessage = await readApiError(response, 'No se pudo guardar la tarea')
        setSaveError(errorMessage)
        showError(errorMessage)
        return
      }

      fetchTask()
      onTaskUpdated?.()
      setActivityRefreshKey((key) => key + 1)
      setMode('view')
    } catch (error) {
      console.error('Error saving task:', error)
      const errorMessage = 'No se pudo guardar la tarea'
      setSaveError(errorMessage)
      showError(errorMessage)
    } finally {
      setSaving(false)
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
      assignee_id: task.assignee?.id || '',
      reviewer_id: task.reviewer?.id || task.reviewer_id || '',
      due_date: task.due_date || '',
      sprint_id: task.sprint_id || '',
      depends_on_task_ids: task.depends_on_task_ids
        ?? task.dependencies?.map((dep) => dep.id)
        ?? (task.depends_on_task_id ? [task.depends_on_task_id] : []),
    })
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
      if (!response.ok) {
        const errorMessage = await readApiError(response, 'No se pudo cambiar el estado')
        setStatusError(errorMessage)
        showError(errorMessage)
        return
      }
      setFormData((prev) => ({ ...prev, status: newStatus }))
      setTask((prev) => (prev ? { ...prev, status: newStatus } : null))
      onTaskUpdated?.()
      setActivityRefreshKey((key) => key + 1)
    } catch (error) {
      console.error('Error updating status:', error)
      const errorMessage = 'No se pudo cambiar el estado'
      setStatusError(errorMessage)
      showError(errorMessage)
    } finally {
      setStatusSaving(false)
    }
  }

  const handleSendComment = async () => {
    if (!newComment.trim() || !task) return
    setSendingComment(true)
    try {
      const response = await fetch('/api/dashboard/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ task_id: taskId, content: newComment }),
      })
      if (response.ok) {
        const data = await response.json()
        setTask(prev => prev ? { ...prev, comments: [...prev.comments, data.comment] } : null)
        
        // Notificar menciones
        const mentionedUserIds = extractMentionedUserIds(newComment, allUsers)
        for (const userId of mentionedUserIds) {
          await fetch('/api/dashboard/notifications', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              user_id: userId,
              type: 'mention',
              title: 'Te mencionaron en un comentario',
              message: `Te mencionaron en la tarea "${task.title}"`,
              link: `/projects/${task.project?.id}`,
              task_id: taskId,
              comment_id: data.comment.id,
            }),
          })
        }
        setNewComment('')
      }
    } catch (error) {
      console.error('Error sending comment:', error)
    } finally {
      setSendingComment(false)
    }
  }

  const handleDeleteComment = async () => {
    if (!commentToDelete) return
    setDeletingCommentId(commentToDelete)
    try {
      const response = await fetch(`/api/dashboard/comments/${commentToDelete}`, { method: 'DELETE' })
      if (response.ok) {
        setTask(prev => prev ? { ...prev, comments: prev.comments.filter(c => c.id !== commentToDelete) } : null)
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
  const blockingBugs = task?.blocking_bugs ?? []

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

  useProjectTaskStatusRealtime(task?.project?.id, open, handleProjectTaskStatusUpdate)

  const sprintReferenceLabel = formatSprintTaskReferenceLabel({
    sprintId: task?.sprint_id,
    sprintOrder: task?.sprint_order,
    sprints: projectSprints,
  })

  const priorityLabels: Record<string, string> = {
    low: 'Baja',
    medium: 'Media',
    high: 'Alta',
    urgent: 'Urgente',
  }
  const assignees = task?.assignees?.length
    ? task.assignees
    : task?.assignee
      ? [task.assignee]
      : []
  const sprintName = task?.sprint?.name
    || projectSprints.find((sprint) => sprint.id === task?.sprint_id)?.name
  const dueLabel = task?.due_date
    ? new Date(task.due_date + 'T00:00:00').toLocaleDateString('es-CL', { day: '2-digit', month: 'short', year: 'numeric' })
    : null
  const overdue = Boolean(task?.due_date && task.status !== 'done' && new Date(task.due_date + 'T00:00:00') < new Date())

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-2xl bg-[#f3f6fb] dark:bg-[#10141b]">
          <DialogHeader className="flex flex-row items-start justify-between gap-3 pr-8">
            <DialogTitle className="flex-1 min-w-0">
              {mode === 'edit'
                ? (task?.task_number != null ? `Editar tarea #${task.task_number}` : 'Editar tarea')
                : 'Vista de la tarea'}
            </DialogTitle>
            {task && !loading && (
              mode === 'view' ? (
                <Button type="button" variant="outline" size="sm" className="h-8 gap-1.5 shrink-0" onClick={() => setMode('edit')}>
                  <Pencil className="w-3.5 h-3.5" />
                  Editar
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0"
                  aria-label="Volver a la vista"
                  onClick={() => {
                    resetFormFromTask()
                    setMode('view')
                  }}
                >
                  <ArrowLeft className="w-4 h-4" />
                </Button>
              )
            )}
          </DialogHeader>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : task ? (
            <div className="space-y-6">
              {mode === 'view' ? (
                <div className="space-y-5">
                  <div className={`space-y-2 rounded-2xl border px-4 py-4 ${TASK_STATUS_WASH[task.status] || TASK_STATUS_WASH.todo}`}>
                    <h2 className="text-xl font-semibold tracking-tight leading-snug">{task.title}</h2>
                    <div className="flex flex-wrap items-center gap-2">
                      {task.task_number != null && (
                        <span className="rounded-full bg-white/80 px-2.5 py-0.5 font-mono text-[12px] text-foreground dark:bg-white/10">#{task.task_number}</span>
                      )}
                      {sprintReferenceLabel && <SprintTaskReferenceBadge label={sprintReferenceLabel} />}
                      <span className="rounded-full bg-violet-100 px-2.5 py-0.5 text-[12px] font-medium text-violet-800 dark:bg-violet-900/50 dark:text-violet-100">
                        {categoryIcons[task.category || 'task']} {categoryLabels[task.category || 'task'] || 'Tarea'}
                      </span>
                      <span className={`rounded-full px-2.5 py-0.5 text-[12px] font-medium ${
                        task.priority === 'urgent'
                          ? 'bg-rose-100 text-rose-800 dark:bg-rose-900/50 dark:text-rose-100'
                          : task.priority === 'high'
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-100'
                            : task.priority === 'low'
                              ? 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-200'
                              : 'bg-sky-100 text-sky-800 dark:bg-sky-900/50 dark:text-sky-100'
                      }`}>{priorityLabels[task.priority] || task.priority}</span>
                    </div>
                  </div>

                  <div className={`space-y-2 rounded-2xl border p-4 ${TASK_STATUS_WASH[task.status] || TASK_STATUS_WASH.todo}`}>
                    <p className="text-[13px] font-medium text-muted-foreground">Estado</p>
                    <DependencyBlockedWarning dependencyTasks={dependencyTasks} />
                    <OpenBugsBlockedWarning
                      blockingBugs={blockingBugs}
                      projectId={task.project?.id ?? ''}
                    />
                    <div className="flex flex-wrap gap-2">
                      {TASK_STATUS_OPTIONS.map((option) => {
                        const pending = getPendingDependencies(dependencyTasks)
                        const blocked = (pending.length > 0 && isAdvancedTaskStatus(option.value))
                          || (option.value === 'done' && blockingBugs.length > 0)
                        const selected = task.status === option.value
                        return (
                          <button
                            key={option.value}
                            type="button"
                            disabled={statusSaving || blocked}
                            onClick={() => handleStatusChange(option.value)}
                            className={`rounded-full px-3 py-1 text-[12px] font-semibold ${
                              selected
                                ? TASK_STATUS_PILL[option.value]
                                : 'border border-current/15 bg-white/70 text-foreground dark:bg-white/10'
                            } ${blocked ? 'cursor-not-allowed opacity-40' : ''}`}
                          >
                            {option.label}
                          </button>
                        )
                      })}
                    </div>
                    {statusSaving && <p className="text-xs text-muted-foreground">Actualizando estado...</p>}
                    {statusError && <p className="text-sm text-destructive">{statusError}</p>}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                    {task.project && (
                      <div className="space-y-1 rounded-2xl border border-sky-200 bg-sky-50 p-4 dark:border-sky-800 dark:bg-sky-950/35">
                        <p className="text-[13px] font-medium text-muted-foreground">Proyecto</p>
                        <Link href={`/projects/${task.project.id}`} className="inline-flex items-center gap-1 hover:underline">
                          {task.project.name}
                          <ExternalLink className="w-3 h-3" />
                        </Link>
                      </div>
                    )}
                    {dueLabel && (
                      <div className={`space-y-1 rounded-2xl border p-4 ${overdue ? 'border-rose-200 bg-rose-50 dark:border-rose-800 dark:bg-rose-950/35' : 'border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30'}`}>
                        <p className="text-[13px] font-medium text-muted-foreground">Fecha límite</p>
                        <p className={`flex items-center gap-1.5 ${overdue ? 'font-medium text-rose-700 dark:text-rose-200' : ''}`}>
                          <Calendar className="w-3.5 h-3.5" />
                          {dueLabel}{overdue ? ' · Vencida' : ''}
                        </p>
                      </div>
                    )}
                    {sprintName && (
                      <div className="space-y-1 rounded-2xl border border-violet-200 bg-violet-50 p-4 dark:border-violet-800 dark:bg-violet-950/35">
                        <p className="text-[13px] font-medium text-muted-foreground">Sprint</p>
                        <p>{sprintName}</p>
                      </div>
                    )}
                    {assignees.length > 0 && (
                      <div className="space-y-1 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-800 dark:bg-emerald-950/35">
                        <p className="text-[13px] font-medium text-muted-foreground">Asignados</p>
                        <p>{assignees.map((person) => person.full_name).join(', ')}</p>
                      </div>
                    )}
                    {task.reviewer && (
                      <div className="space-y-1 rounded-2xl border border-sky-200 bg-sky-50 p-4 dark:border-sky-800 dark:bg-sky-950/35">
                        <p className="text-[13px] font-medium text-muted-foreground">Revisor</p>
                        <p className="flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-muted-foreground" />
                          {task.reviewer.full_name}
                        </p>
                      </div>
                    )}
                  </div>

                  {dependencyTasks.length > 0 && (
                    <div className="space-y-1.5">
                      <p className="text-[13px] font-medium text-muted-foreground">Dependencias</p>
                      <div className="flex flex-wrap gap-1.5">
                        {dependencyTasks.map((dep) => (
                          <Badge key={dep.id} variant={dep.status === 'done' ? 'secondary' : 'outline'} className="font-normal">
                            {formatDependencyLabel(dep)}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {task.description && (
                    <div className="space-y-1.5 rounded-2xl border border-violet-200 bg-violet-50 p-4 dark:border-violet-800 dark:bg-violet-950/30">
                      <p className="text-[13px] font-medium text-muted-foreground">Descripción</p>
                      <div className="text-sm text-muted-foreground leading-relaxed">
                        <FormattedText>{task.description}</FormattedText>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground text-sm">Rama</span>
                    <div className="flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 flex-1 min-w-0 dark:border-emerald-800 dark:bg-emerald-950/35">
                      <GitBranch className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                      <span className="font-mono text-xs truncate">{getBranchName(task)}</span>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(getBranchName(task))
                          setBranchCopied(true)
                          setTimeout(() => setBranchCopied(false), 1500)
                        }}
                        className="ml-auto text-muted-foreground hover:text-foreground"
                        title="Copiar nombre de rama"
                      >
                        {branchCopied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
              <div className="space-y-4">
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
                    className="min-h-[100px] resize-y"
                  />
                  {formData.description.trim() && (
                    <div className="rounded-md border border-border/60 bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
                      <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground/80 mb-1">Vista previa</p>
                      <FormattedText>{formData.description}</FormattedText>
                    </div>
                  )}
                </div>

                {saveError && (
                  <div className="rounded-lg border border-red-200 bg-red-50 dark:bg-red-950/30 dark:border-red-800 px-3 py-2 text-sm text-red-900 dark:text-red-200">
                    {saveError}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Estado</Label>
                    <DependencyBlockedWarning dependencyTasks={dependencyTasks} />
                    <OpenBugsBlockedWarning
                      blockingBugs={blockingBugs}
                      projectId={task.project?.id ?? ''}
                      className="mt-2"
                    />
                    <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {renderTaskStatusSelectItems(dependencyTasks, blockingBugs)}
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

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Asignado a</Label>
                    <Select value={formData.assignee_id} onValueChange={(v) => setFormData({ ...formData, assignee_id: v })}>
                      <SelectTrigger><SelectValue placeholder="Sin asignar" /></SelectTrigger>
                      <SelectContent>
                        {members.map((m) => (
                          <SelectItem key={m.id} value={m.id}>{m.full_name}</SelectItem>
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
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-1.5">
                    Revisor (QA)
                    <span className="text-[10px] font-normal text-muted-foreground">opcional</span>
                  </Label>
                  <SingleSelectUser
                    users={members}
                    selectedId={formData.reviewer_id || null}
                    onSelectionChange={(id) => setFormData(prev => ({ ...prev, reviewer_id: id || '' }))}
                    placeholder="Asignar revisor..."
                    emptyLabel="Sin revisor"
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

                <MultiSelectTask
                  tasks={projectTasks}
                  sprints={projectSprints}
                  currentSprintId={formData.sprint_id || task?.sprint_id}
                  selectedIds={formData.depends_on_task_ids}
                  onSelectionChange={(ids) => setFormData(prev => ({ ...prev, depends_on_task_ids: ids }))}
                  excludeTaskId={taskId}
                  hint="Para avanzar en esta tarea, primero deben completarse todas las dependencias seleccionadas."
                />

                <Button onClick={handleSave} disabled={saving} className="w-full">
                  {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Guardando...</> : 'Guardar Cambios'}
                </Button>
              </div>
              )}

              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950/30">
                <FileAttachments
                  taskId={taskId}
                  currentUserId={currentUserId}
                />
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-900/40">
                <h4 className="font-medium text-foreground mb-3">Historial</h4>
                <TaskActivityHistory taskId={taskId} refreshKey={activityRefreshKey} />
              </div>

              <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 dark:border-rose-800 dark:bg-rose-950/30">
                <h4 className="font-medium text-foreground mb-3">Comentarios</h4>
                
                {hasNewComments && (
                  <button
                    onClick={fetchTask}
                    className="w-full mb-3 py-2 px-3 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg text-blue-700 dark:bg-blue-900/20 dark:hover:bg-blue-900/30 dark:border-blue-800 dark:text-blue-400 text-xs font-medium flex items-center justify-center gap-2 transition-colors"
                  >
                    <RefreshCw className="w-3 h-3" />
                    Hay nuevos comentarios
                  </button>
                )}

                <div className="space-y-3 mb-3">
                  {task.comments.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">Sin comentarios</p>
                  ) : (
                    task.comments.map((comment) => (
                      <div key={comment.id} className="flex gap-2 rounded-xl bg-white/75 p-2 group dark:bg-black/20">
                        <Avatar className="w-8 h-8 flex-shrink-0">
                          <AvatarImage src={comment.user.avatar_url || undefined} />
                          <AvatarFallback className="text-xs">{getInitials(comment.user.full_name)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium text-sm text-foreground">{comment.user.full_name}</span>
                            {comment.user.role && (
                              <Badge variant="outline" className={`text-xs ${roleColors[comment.user.role.name] || ''}`}>
                                {roleLabels[comment.user.role.name] || comment.user.role.name}
                              </Badge>
                            )}
                            <span className="text-xs text-muted-foreground">{formatDateTime(comment.created_at)}</span>
                            {comment.user.id === currentUserId && (
                              <button
                                onClick={() => { setCommentToDelete(comment.id); setDeleteCommentDialogOpen(true) }}
                                className="ml-auto opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-red-600"
                                disabled={deletingCommentId === comment.id}
                              >
                                {deletingCommentId === comment.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                              </button>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">{renderMentions(comment.content, allUsers, currentUserId)}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="flex gap-2">
                  <MentionInput
                    value={newComment}
                    onChange={setNewComment}
                    onSubmit={handleSendComment}
                    users={allUsers}
                    placeholder="Escribe un comentario..."
                    disabled={sendingComment}
                  />
                  <Button onClick={handleSendComment} disabled={sendingComment || !newComment.trim()} size="sm">
                    {sendingComment ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">Tarea no encontrada</p>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteCommentDialogOpen} onOpenChange={setDeleteCommentDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar comentario?</AlertDialogTitle>
            <AlertDialogDescription>Esta acción no se puede deshacer.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteComment} className="bg-red-600 hover:bg-red-700">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
