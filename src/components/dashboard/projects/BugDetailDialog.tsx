'use client'

import { useState, useEffect } from 'react'
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
import { MentionInput, renderMentions, extractMentionedUserIds, extractMentionAll } from '@/components/ui/mention-input'
import { Loader2, Trash2, Send, Bug } from 'lucide-react'
import { FileAttachments } from '@/components/ui/file-attachments'
import { SingleSelectUser } from '@/components/ui/single-select-user'

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
  status: string
}

interface TaskOption {
  id: string
  task_number: number | null
  title: string
}

interface BugDetail {
  id: string
  title: string
  description: string | null
  steps_to_reproduce: string | null
  severity: string
  status: string
  sprint_id?: string | null
  task_id?: string | null
  sprint?: { id: string; name: string; status: string } | null
  task?: { id: string; task_number: number | null; title: string } | null
  assignee?: { id: string; full_name: string; avatar_url: string | null } | null
  reporter?: { id: string; full_name: string; avatar_url: string | null } | null
  comments: Comment[]
}

interface BugDetailDialogProps {
  bugId: string
  projectId: string
  projectName: string
  open: boolean
  onOpenChange: (open: boolean) => void
  members: Member[]
  allUsers: Member[]
  currentUserId: string
  sprints?: SprintOption[]
  tasks?: TaskOption[]
  onUpdate: () => void
}

const severityConfig: Record<string, { label: string; color: string }> = {
  low: { label: 'Baja', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
  medium: { label: 'Media', color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' },
  high: { label: 'Alta', color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' },
  critical: { label: 'Crítica', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
}

const statusConfig: Record<string, { label: string; color: string }> = {
  open: { label: 'Abierto', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
  in_progress: { label: 'En Progreso', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  resolved: { label: 'Resuelto', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
  closed: { label: 'Cerrado', color: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400' },
}

const roleColors: Record<string, string> = {
  admin: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  pm: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  tech_lead: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  developer: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
}

const roleLabels: Record<string, string> = {
  admin: 'Admin', pm: 'PM', tech_lead: 'Tech Lead', developer: 'Dev', stakeholder: 'Stakeholder',
}

export function BugDetailDialog({
  bugId, projectId, projectName, open, onOpenChange,
  members, allUsers, currentUserId, sprints = [], tasks = [], onUpdate,
}: BugDetailDialogProps) {
  const [bug, setBug] = useState<BugDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [newComment, setNewComment] = useState('')
  const [sendingComment, setSendingComment] = useState(false)
  const [deletingCommentId, setDeletingCommentId] = useState<string | null>(null)
  const [deleteBugOpen, setDeleteBugOpen] = useState(false)
  const [deleteCommentOpen, setDeleteCommentOpen] = useState(false)
  const [commentToDelete, setCommentToDelete] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    steps_to_reproduce: '',
    severity: 'medium',
    status: 'open',
    sprint_id: '',
    task_id: '',
    assignee_id: null as string | null,
  })

  const fetchBug = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/dashboard/bugs/${bugId}`)
      const data = await res.json()
      if (res.ok) {
        setBug(data.bug)
        setFormData({
          title: data.bug.title,
          description: data.bug.description || '',
          steps_to_reproduce: data.bug.steps_to_reproduce || '',
          severity: data.bug.severity,
          status: data.bug.status,
          sprint_id: data.bug.sprint_id || '',
          task_id: data.bug.task_id || '',
          assignee_id: data.bug.assignee_id || data.bug.assignee?.id || null,
        })
      }
    } catch (err) {
      console.error('Error fetching bug:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (open && bugId) fetchBug()
  }, [open, bugId])

  const handleSave = async () => {
    setSaving(true)
    try {
      await fetch(`/api/dashboard/bugs/${bugId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          sprint_id: formData.sprint_id || null,
          task_id: formData.task_id || null,
        }),
      })
      onUpdate()
      onOpenChange(false)
    } catch (err) {
      console.error('Error saving bug:', err)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await fetch(`/api/dashboard/bugs/${bugId}`, { method: 'DELETE' })
      onUpdate()
      onOpenChange(false)
    } catch (err) {
      console.error('Error deleting bug:', err)
    } finally {
      setDeleting(false)
      setDeleteBugOpen(false)
    }
  }

  const handleSendComment = async () => {
    if (!newComment.trim()) return
    setSendingComment(true)
    try {
      const res = await fetch('/api/dashboard/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bug_id: bugId, project_id: projectId, content: newComment }),
      })
      if (res.ok) {
        const data = await res.json()
        if (data.comment) {
          setBug(prev => prev ? { ...prev, comments: [...prev.comments, data.comment] } : null)
        }
        setNewComment('')

        const mentionedUserIds = extractMentionedUserIds(newComment, allUsers)
        for (const userId of mentionedUserIds) {
          await fetch('/api/dashboard/notifications', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              user_id: userId, type: 'mention',
              title: 'Te mencionaron en un bug',
              message: `Te mencionaron en el bug "${bug?.title}" del proyecto "${projectName}"`,
              link: `/projects/${projectId}?tab=bugs`,
              project_id: projectId,
            }),
          })
        }

        if (extractMentionAll(newComment)) {
          const rest = allUsers.filter(u => u.id !== currentUserId && !mentionedUserIds.includes(u.id))
          for (const member of rest) {
            await fetch('/api/dashboard/notifications', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                user_id: member.id, type: 'mention',
                title: 'Te mencionaron en un bug',
                message: `Mencionaron a @Todos en el bug "${bug?.title}" del proyecto "${projectName}"`,
                link: `/projects/${projectId}?tab=bugs`,
                project_id: projectId,
              }),
            })
          }
        }
      }
    } catch (err) {
      console.error('Error sending comment:', err)
    } finally {
      setSendingComment(false)
    }
  }

  const handleDeleteComment = async () => {
    if (!commentToDelete) return
    setDeletingCommentId(commentToDelete)
    try {
      await fetch(`/api/dashboard/comments/${commentToDelete}`, { method: 'DELETE' })
      setBug(prev => prev ? { ...prev, comments: prev.comments.filter(c => c.id !== commentToDelete) } : null)
    } catch (err) {
      console.error('Error deleting comment:', err)
    } finally {
      setDeletingCommentId(null)
      setDeleteCommentOpen(false)
      setCommentToDelete(null)
    }
  }

  const getInitials = (name: string | null) => {
    if (!name) return '??'
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  const formatDateTime = (date: string) =>
    new Date(date).toLocaleString('es-CL', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bug className="w-5 h-5 text-red-500" /> Detalle del Bug
            </DialogTitle>
          </DialogHeader>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : bug ? (
            <div className="space-y-5">
              <div className="space-y-2">
                <Label>Título</Label>
                <Input value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} />
              </div>

              <div className="space-y-2">
                <Label>Descripción</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe el comportamiento incorrecto..."
                  className="min-h-[80px] resize-y"
                />
              </div>

              <div className="space-y-2">
                <Label>Pasos para reproducir</Label>
                <Textarea
                  value={formData.steps_to_reproduce}
                  onChange={(e) => setFormData({ ...formData, steps_to_reproduce: e.target.value })}
                  placeholder="1. Ir a...\n2. Hacer clic en...\n3. Observar que..."
                  className="min-h-[80px] resize-y font-mono text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Severidad</Label>
                  <Select value={formData.severity} onValueChange={(v) => setFormData({ ...formData, severity: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(severityConfig).map(([val, cfg]) => (
                        <SelectItem key={val} value={val}>
                          <Badge variant="secondary" className={cfg.color}>{cfg.label}</Badge>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Estado</Label>
                  <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(statusConfig).map(([val, cfg]) => (
                        <SelectItem key={val} value={val}>
                          <Badge variant="secondary" className={cfg.color}>{cfg.label}</Badge>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Sprint</Label>
                  <Select
                    value={formData.sprint_id || 'none'}
                    onValueChange={(v) => setFormData({ ...formData, sprint_id: v === 'none' ? '' : v })}
                  >
                    <SelectTrigger><SelectValue placeholder="Sin sprint" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Sin sprint</SelectItem>
                      {sprints.map(s => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.name}{s.status === 'active' ? ' (Activo)' : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Tarea relacionada</Label>
                  <Select
                    value={formData.task_id || 'none'}
                    onValueChange={(v) => setFormData({ ...formData, task_id: v === 'none' ? '' : v })}
                  >
                    <SelectTrigger><SelectValue placeholder="Sin tarea" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Sin tarea relacionada</SelectItem>
                      {tasks.map(t => (
                        <SelectItem key={t.id} value={t.id}>
                          {t.task_number ? `#${t.task_number} - ` : ''}{t.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Asignado a</Label>
                <SingleSelectUser
                  users={members}
                  selectedId={formData.assignee_id}
                  onSelectionChange={(id) => setFormData({ ...formData, assignee_id: id })}
                  placeholder="Asignar desarrollador..."
                  emptyLabel="Sin asignar"
                />
              </div>

              {/* Reporter */}
              {bug.reporter && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>Reportado por:</span>
                  <Avatar className="w-5 h-5">
                    <AvatarImage src={bug.reporter.avatar_url || undefined} />
                    <AvatarFallback className="text-[10px]">{getInitials(bug.reporter.full_name)}</AvatarFallback>
                  </Avatar>
                  <span className="text-foreground">{bug.reporter.full_name}</span>
                </div>
              )}

              {/* Attachments */}
              <div className="border-t border-border pt-4">
                <FileAttachments bugId={bugId} currentUserId={currentUserId} />
              </div>

              {/* Comments */}
              <div className="border-t border-border pt-4">
                <h4 className="font-medium text-foreground mb-3">Comentarios</h4>
                <div className="space-y-3 max-h-48 overflow-y-auto mb-4">
                  {bug.comments.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">No hay comentarios</p>
                  ) : (
                    bug.comments.map((comment) => (
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
                              onClick={() => { setCommentToDelete(comment.id); setDeleteCommentOpen(true) }}
                              disabled={deletingCommentId === comment.id}
                              className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-red-600 dark:hover:text-red-400"
                            >
                              {deletingCommentId === comment.id
                                ? <Loader2 className="w-3 h-3 animate-spin" />
                                : <Trash2 className="w-3 h-3" />}
                            </button>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            {renderMentions(comment.content, allUsers, currentUserId)}
                          </p>
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
                <Button variant="destructive" onClick={() => setDeleteBugOpen(true)} disabled={deleting}>
                  {deleting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Trash2 className="w-4 h-4 mr-2" />}
                  Eliminar
                </Button>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
                  <Button onClick={handleSave} disabled={saving} className="bg-primary hover:bg-primary/90">
                    {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Guardar
                  </Button>
                </div>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteBugOpen} onOpenChange={setDeleteBugOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar este bug?</AlertDialogTitle>
            <AlertDialogDescription>Esta acción no se puede deshacer.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={deleting} className="bg-red-600 hover:bg-red-700">
              {deleting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />} Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={deleteCommentOpen} onOpenChange={setDeleteCommentOpen}>
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
