'use client'

import { useState, useEffect } from 'react'
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
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { MentionInput, renderMentions, extractMentionedUserIds, extractMentionAll } from '@/components/ui/mention-input'
import { DatePicker } from '@/components/ui/date-picker'
import { Loader2, Trash2, Send, RefreshCw } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { FileAttachments } from '@/components/ui/file-attachments'

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
  due_date: string | null
  sprint_id: string | null
  is_carry_over: boolean
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

export function TaskDetailDialog({ taskId, projectId, projectName, open, onOpenChange, members, allUsers, currentUserId, onUpdate }: TaskDetailDialogProps) {
  const [task, setTask] = useState<TaskDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [newComment, setNewComment] = useState('')
  const [sendingComment, setSendingComment] = useState(false)
  const [deletingCommentId, setDeletingCommentId] = useState<string | null>(null)
  const [deleteTaskDialogOpen, setDeleteTaskDialogOpen] = useState(false)
  const [deleteCommentDialogOpen, setDeleteCommentDialogOpen] = useState(false)
  const [commentToDelete, setCommentToDelete] = useState<string | null>(null)
  const [hasNewComments, setHasNewComments] = useState(false)
  const [projectSprints, setProjectSprints] = useState<SprintOption[]>([])

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: '',
    priority: '',
    category: 'task',
    assignee_ids: [] as string[],
    due_date: '',
    sprint_id: '',
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
          due_date: data.task.due_date || '',
          sprint_id: data.task.sprint_id || '',
        })
        setHasNewComments(false)
      }
    } catch (error) {
      console.error('Error fetching task:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (open && taskId) {
      fetchTask()
    }
  }, [open, taskId])

  // Cargar sprints del proyecto al abrir
  useEffect(() => {
    if (!open || !projectId) return
    fetch(`/api/dashboard/projects/${projectId}/sprints`)
      .then(r => r.json())
      .then(data => { if (data.sprints) setProjectSprints(data.sprints) })
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
    try {
      const previousAssigneeIds = (task?.assignees || []).map(a => a.id)
      
      await fetch(`/api/dashboard/tasks/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      
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
      onOpenChange(false)
    } catch (error) {
      console.error('Error saving task:', error)
    } finally {
      setSaving(false)
    }
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {task?.task_number ? `Tarea #${task.task_number}` : 'Detalle de Tarea'}
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : task ? (
          <div className="space-y-6">
            {/* Form */}
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
                  placeholder="Describe la tarea en detalle..."
                  className="min-h-[100px] resize-y"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Estado</Label>
                  <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="backlog">Backlog</SelectItem>
                      <SelectItem value="todo">Por Hacer</SelectItem>
                      <SelectItem value="in_progress">En Progreso</SelectItem>
                      <SelectItem value="review">En Revisión</SelectItem>
                      <SelectItem value="done">Completado</SelectItem>
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
                    <SelectItem value="task">📋 Tarea</SelectItem>
                    <SelectItem value="bug">🐛 Bug</SelectItem>
                    <SelectItem value="feature">✨ Feature</SelectItem>
                    <SelectItem value="hotfix">🔥 Hotfix</SelectItem>
                    <SelectItem value="fix">🔧 Fix</SelectItem>
                    <SelectItem value="improvement">📈 Mejora</SelectItem>
                    <SelectItem value="refactor">♻️ Refactor</SelectItem>
                    <SelectItem value="docs">📝 Documentación</SelectItem>
                    <SelectItem value="test">🧪 Test</SelectItem>
                    <SelectItem value="chore">🔨 Chore</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
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
                  <Label>Fecha límite</Label>
                  <DatePicker
                    value={formData.due_date ? new Date(formData.due_date + 'T00:00:00') : null}
                    onChange={(date) => setFormData({ ...formData, due_date: date ? format(date, 'yyyy-MM-dd') : '' })}
                    placeholder="Seleccionar fecha"
                  />
                </div>
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
            </div>

            {/* Assignees display */}
            {task.assignees && task.assignees.length > 0 && (
              <div className="border-t border-border pt-4">
                <h4 className="font-medium text-foreground mb-3">Asignados</h4>
                <div className="flex flex-wrap gap-2">
                  {task.assignees.map((assignee) => (
                    <div key={assignee.id} className="flex items-center gap-2 rounded-md border border-border px-2 py-1.5">
                      <Avatar className="w-6 h-6">
                        <AvatarImage src={assignee.avatar_url || undefined} />
                        <AvatarFallback className="bg-muted text-muted-foreground text-xs">
                          {getInitials(assignee.full_name)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm text-foreground">{assignee.full_name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Attachments */}
            <div className="border-t border-border pt-4">
              <FileAttachments
                taskId={taskId}
                currentUserId={currentUserId}
              />
            </div>

            {/* Comments */}
            <div className="border-t border-border pt-4">
              <h4 className="font-medium text-foreground mb-3">Comentarios</h4>
              
              {hasNewComments && (
                <button
                  onClick={fetchTask}
                  className="w-full mb-3 py-2 px-3 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg text-blue-700 dark:bg-blue-900/20 dark:hover:bg-blue-900/30 dark:border-blue-800 dark:text-blue-400 text-xs font-medium flex items-center justify-center gap-2 transition-colors"
                >
                  <RefreshCw className="w-3 h-3" />
                  Hay nuevos comentarios. Click para actualizar
                </button>
              )}
              
              <div className="space-y-3 max-h-48 overflow-y-auto mb-4">
                {task.comments.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">No hay comentarios</p>
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

              <div className="flex gap-2">
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
            </div>

            {/* Actions */}
            <div className="flex justify-between pt-4 border-t border-border">
              <Button variant="destructive" onClick={() => setDeleteTaskDialogOpen(true)} disabled={deleting}>
                {deleting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Trash2 className="w-4 h-4 mr-2" />}
                Eliminar
              </Button>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
                <Button onClick={handleSave} disabled={saving} className="bg-primary hover:bg-primary/90">
                  {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                  Guardar
                </Button>
              </div>
            </div>
          </div>
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
