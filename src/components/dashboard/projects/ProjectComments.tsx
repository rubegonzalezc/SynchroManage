'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { MentionInput, renderMentions, extractMentionedUserIds } from '@/components/ui/mention-input'
import { Loader2, Send, MessageSquare, Trash2, RefreshCw } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

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

interface ProjectCommentsProps {
  projectId: string
  projectName: string
  users: User[]
  currentUserId: string
}

const roleColors: Record<string, string> = {
  admin: 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800',
  pm: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800',
  tech_lead: 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800',
  developer: 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800',
  stakeholder: 'bg-cyan-100 text-cyan-700 border-cyan-200 dark:bg-cyan-900/30 dark:text-cyan-400 dark:border-cyan-800',
}

const roleLabels: Record<string, string> = {
  admin: 'Administrador',
  pm: 'Project Manager',
  tech_lead: 'Tech Lead',
  developer: 'Desarrollador',
  stakeholder: 'Stakeholder',
}

export function ProjectComments({ projectId, projectName, users, currentUserId }: ProjectCommentsProps) {
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)
  const [newComment, setNewComment] = useState('')
  const [sending, setSending] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [commentToDelete, setCommentToDelete] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [hasNewComments, setHasNewComments] = useState(false)

  const fetchComments = async () => {
    try {
      const commentsResponse = await fetch(`/api/dashboard/projects/${projectId}/comments`)
      const commentsData = await commentsResponse.json()
      setComments(commentsData.comments || [])
      setHasNewComments(false)
    } catch (error) {
      console.error('Error fetching comments:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchComments()
  }, [projectId])

  // Suscribirse a cambios en tiempo real
  useEffect(() => {
    const supabase = createClient()
    
    const channel = supabase
      .channel(`project-comments-${projectId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'comments',
          filter: `project_id=eq.${projectId}`,
        },
        (payload) => {
          // Solo mostrar alerta si el comentario es de otro usuario
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
          filter: `project_id=eq.${projectId}`,
        },
        (payload) => {
          // Eliminar comentario de la lista local
          const deletedId = (payload.old as { id: string }).id
          setComments(prev => prev.filter(c => c.id !== deletedId))
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [projectId, currentUserId])

  const handleSendComment = async () => {
    if (!newComment.trim()) return
    setSending(true)
    try {
      const response = await fetch('/api/dashboard/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ project_id: projectId, content: newComment }),
      })
      if (response.ok) {
        const data = await response.json()
        setComments([...comments, data.comment])
        
        // Crear notificaciones para usuarios mencionados
        const mentionedUserIds = extractMentionedUserIds(newComment, users)
        for (const userId of mentionedUserIds) {
          const mentionedUser = users.find(u => u.id === userId)
          await fetch('/api/dashboard/notifications', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              user_id: userId,
              type: 'mention',
              title: 'Te mencionaron en un comentario',
              message: `Te mencionaron en el proyecto "${projectName}"`,
              link: `/projects/${projectId}`,
              project_id: projectId,
              comment_id: data.comment.id,
            }),
          })
        }
        
        setNewComment('')
      }
    } catch (error) {
      console.error('Error sending comment:', error)
    } finally {
      setSending(false)
    }
  }

  const handleDeleteClick = (commentId: string) => {
    setCommentToDelete(commentId)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!commentToDelete) return
    setDeleting(true)
    try {
      const response = await fetch(`/api/dashboard/comments/${commentToDelete}`, { method: 'DELETE' })
      if (response.ok) {
        setComments(comments.filter(c => c.id !== commentToDelete))
      }
    } catch (error) {
      console.error('Error deleting comment:', error)
    } finally {
      setDeleting(false)
      setDeleteDialogOpen(false)
      setCommentToDelete(null)
    }
  }

  const getInitials = (name: string | null) => {
    if (!name) return '??'
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  const formatDateTime = (date: string) => {
    return new Date(date).toLocaleString('es-CL', {
      day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
    })
  }

  return (
    <>
      <div className="bg-card rounded-lg border border-border p-6">
        <h3 className="font-semibold text-foreground flex items-center gap-2 mb-4">
          <MessageSquare className="w-5 h-5" /> Comentarios del Proyecto
        </h3>

        {hasNewComments && (
          <button
            onClick={fetchComments}
            className="w-full mb-4 py-2 px-4 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg text-blue-700 dark:bg-blue-900/20 dark:hover:bg-blue-900/30 dark:border-blue-800 dark:text-blue-400 text-sm font-medium flex items-center justify-center gap-2 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Hay nuevos comentarios. Click para actualizar
          </button>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            <div className="space-y-4 max-h-96 overflow-y-auto mb-4">
              {comments.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No hay comentarios aún. ¡Sé el primero en comentar!
                </p>
              ) : (
                comments.map((comment) => (
                  <div key={comment.id} className="flex gap-3 p-3 rounded-lg bg-muted/50 group">
                    <Avatar className="w-10 h-10 flex-shrink-0">
                      <AvatarImage src={comment.user.avatar_url || undefined} />
                      <AvatarFallback className="bg-muted text-muted-foreground text-sm">
                        {getInitials(comment.user.full_name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="font-medium text-foreground">{comment.user.full_name}</span>
                        {comment.user.role && (
                          <Badge variant="outline" className={`text-xs ${roleColors[comment.user.role.name] || ''}`}>
                            {roleLabels[comment.user.role.name] || comment.user.role.name}
                          </Badge>
                        )}
                        <span className="text-xs text-muted-foreground">{formatDateTime(comment.created_at)}</span>
                        <button
                          onClick={() => handleDeleteClick(comment.id)}
                          className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-red-600 dark:hover:text-red-400"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <p className="text-muted-foreground">{renderMentions(comment.content, users, currentUserId)}</p>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="flex gap-2 pt-4 border-t border-border">
              <MentionInput
                value={newComment}
                onChange={setNewComment}
                onSubmit={handleSendComment}
                users={users}
                placeholder="Escribe un comentario... usa @ para mencionar"
                disabled={sending}
              />
              <Button onClick={handleSendComment} disabled={sending || !newComment.trim()}>
                {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </Button>
            </div>
          </>
        )}
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar comentario?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. El comentario será eliminado permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
