'use client'

import { useState, useEffect } from 'react'
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
import { Loader2, Trash2, Send, RefreshCw, ExternalLink } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { FileAttachments } from '@/components/ui/file-attachments'
import { TASK_CATEGORIES } from '@/lib/constants/categories'

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
  assignee: { id: string; full_name: string; avatar_url: string | null } | null
  project: { id: string; name: string } | null
  comments: Comment[]
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
  const [task, setTask] = useState<TaskDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
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

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: '',
    priority: '',
    category: 'task',
    assignee_id: '',
    due_date: '',
    sprint_id: '',
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
          due_date: data.task.due_date || '',
          sprint_id: data.task.sprint_id || '',
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
      }
    } catch (err) {
      console.error('Error fetching project members:', err)
    }
  }

  useEffect(() => {
    if (open && taskId) {
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
    try {
      const response = await fetch(`/api/dashboard/tasks/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, sprint_id: formData.sprint_id || null }),
      })
      if (response.ok) {
        fetchTask()
        onTaskUpdated?.()
      }
    } catch (error) {
      console.error('Error saving task:', error)
    } finally {
      setSaving(false)
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


  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {task && (
                <>
                  <span className="text-muted-foreground font-mono">#{task.task_number}</span>
                  <span>{task.title}</span>
                </>
              )}
            </DialogTitle>
          </DialogHeader>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : task ? (
            <div className="space-y-6">
              {/* Project Link */}
              {task.project && (
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground">Proyecto:</span>
                  <Link 
                    href={`/projects/${task.project.id}`}
                    className="text-foreground hover:underline flex items-center gap-1"
                  >
                    {task.project.name}
                    <ExternalLink className="w-3 h-3" />
                  </Link>
                </div>
              )}

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

                <Button onClick={handleSave} disabled={saving} className="w-full">
                  {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Guardando...</> : 'Guardar Cambios'}
                </Button>
              </div>


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
                    Hay nuevos comentarios
                  </button>
                )}

                <div className="space-y-3 max-h-48 overflow-y-auto mb-3">
                  {task.comments.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">Sin comentarios</p>
                  ) : (
                    task.comments.map((comment) => (
                      <div key={comment.id} className="flex gap-2 p-2 rounded-lg bg-muted/50 group">
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
