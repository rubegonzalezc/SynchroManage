'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Loader2, Send, Users, Trash2, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

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

interface StakeholderMessagesForPMProps {
  projectId: string
  projectName: string
  currentUserId: string
  stakeholderIds?: string[]
}

const roleColors: Record<string, string> = {
  admin: 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800',
  pm: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800',
  stakeholder: 'bg-cyan-100 text-cyan-700 border-cyan-200 dark:bg-cyan-900/30 dark:text-cyan-400 dark:border-cyan-800',
}

const roleLabels: Record<string, string> = {
  admin: 'Administrador',
  pm: 'Project Manager',
  stakeholder: 'Stakeholder',
}


export function StakeholderMessagesForPM({ projectId, projectName, currentUserId, stakeholderIds = [] }: StakeholderMessagesForPMProps) {
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)
  const [newComment, setNewComment] = useState('')
  const [sending, setSending] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [commentToDelete, setCommentToDelete] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [hasNewComments, setHasNewComments] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)

  const fetchComments = async () => {
    try {
      const commentsResponse = await fetch(`/api/dashboard/projects/${projectId}/comments?stakeholder=true`)
      const commentsData = await commentsResponse.json()
      setComments(commentsData.comments || [])
      setHasNewComments(false)
    } catch (error) {
      console.error('Error fetching stakeholder comments:', error)
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
      .channel(`pm-stakeholder-comments-${projectId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'comments',
          filter: `project_id=eq.${projectId}`,
        },
        (payload) => {
          const newCommentUserId = (payload.new as { user_id: string }).user_id
          const isStakeholderMessage = (payload.new as { is_stakeholder_message: boolean }).is_stakeholder_message
          if (newCommentUserId !== currentUserId && isStakeholderMessage) {
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
        body: JSON.stringify({ 
          project_id: projectId, 
          content: newComment,
          is_stakeholder_message: true
        }),
      })
      if (response.ok) {
        const data = await response.json()
        setComments([...comments, data.comment])
        
        // Notificar a todos los stakeholders del proyecto
        for (const stakeholderId of stakeholderIds) {
          await fetch('/api/dashboard/notifications', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              user_id: stakeholderId,
              type: 'stakeholder_comment',
              title: 'Nueva respuesta del PM',
              message: `El Project Manager respondió en el proyecto "${projectName}"`,
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

  const stakeholderCount = new Set(
    comments.filter(c => c.user.role?.name === 'stakeholder').map(c => c.user.id)
  ).size


  return (
    <>
      <div className="bg-card rounded-lg border border-cyan-200 dark:border-cyan-800 p-6">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full flex items-center justify-between"
        >
          <h3 className="font-semibold text-foreground flex items-center gap-2">
            <Users className="w-5 h-5 text-cyan-600 dark:text-cyan-400" /> 
            Mensajes de Stakeholders
            {comments.length > 0 && (
              <Badge variant="secondary" className="bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400">
                {comments.length} {comments.length === 1 ? 'mensaje' : 'mensajes'}
              </Badge>
            )}
            {hasNewComments && (
              <Badge variant="secondary" className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 animate-pulse">
                Nuevo
              </Badge>
            )}
          </h3>
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-muted-foreground" />
          ) : (
            <ChevronDown className="w-5 h-5 text-muted-foreground" />
          )}
        </button>

        {isExpanded && (
          <div className="mt-4">
            <p className="text-sm text-muted-foreground mb-4">
              Comunicación privada con los stakeholders del proyecto.
              {stakeholderCount > 0 && ` ${stakeholderCount} stakeholder${stakeholderCount > 1 ? 's' : ''} activo${stakeholderCount > 1 ? 's' : ''}.`}
            </p>

            {hasNewComments && (
              <button
                onClick={fetchComments}
                className="w-full mb-4 py-2 px-4 bg-cyan-50 hover:bg-cyan-100 border border-cyan-200 rounded-lg text-cyan-700 dark:bg-cyan-900/20 dark:hover:bg-cyan-900/30 dark:border-cyan-800 dark:text-cyan-400 text-sm font-medium flex items-center justify-center gap-2 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Hay nuevos mensajes. Click para actualizar
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
                      No hay mensajes de stakeholders aún.
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
                            {comment.user.id === currentUserId && (
                              <button
                                onClick={() => handleDeleteClick(comment.id)}
                                className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-red-600 dark:hover:text-red-400"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                          <p className="text-muted-foreground">{comment.content}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="flex gap-2 pt-4 border-t border-border">
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault()
                        handleSendComment()
                      }
                    }}
                    placeholder="Responder a los stakeholders..."
                    disabled={sending}
                    className="flex-1 min-h-[80px] px-3 py-2 text-sm rounded-md border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                  />
                  <Button onClick={handleSendComment} disabled={sending || !newComment.trim()} className="self-end">
                    {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  </Button>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar mensaje?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. El mensaje será eliminado permanentemente.
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
