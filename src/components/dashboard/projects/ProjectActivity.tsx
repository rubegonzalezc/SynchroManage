'use client'

import { useState, useEffect } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { 
  History, Plus, Pencil, Trash2, UserPlus, UserMinus,
  CheckCircle, MessageSquare, ArrowRight, Paperclip, ShieldCheck
} from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { createClient } from '@/lib/supabase/client'

interface Activity {
  id: string
  action: string
  entity_type: string
  entity_id: string | null
  entity_name: string | null
  details: Record<string, unknown> | null
  created_at: string
  user: {
    id: string
    full_name: string
    avatar_url: string | null
  } | null
}

interface ProjectActivityProps {
  projectId: string
}

const actionIcons: Record<string, React.ReactNode> = {
  created: <Plus className="w-4 h-4 text-green-500" />,
  updated: <Pencil className="w-4 h-4 text-blue-500" />,
  deleted: <Trash2 className="w-4 h-4 text-red-500" />,
  assigned: <UserPlus className="w-4 h-4 text-purple-500" />,
  unassigned: <UserMinus className="w-4 h-4 text-orange-500" />,
  completed: <CheckCircle className="w-4 h-4 text-green-500" />,
  commented: <MessageSquare className="w-4 h-4 text-cyan-500" />,
  status_changed: <ArrowRight className="w-4 h-4 text-amber-500" />,
  attached: <Paperclip className="w-4 h-4 text-indigo-500" />,
  detached: <Paperclip className="w-4 h-4 text-red-500" />,
  reviewer_assigned: <ShieldCheck className="w-4 h-4 text-violet-500" />,
  reviewer_removed: <ShieldCheck className="w-4 h-4 text-red-400" />,
}

const actionLabels: Record<string, string> = {
  created: 'creó',
  updated: 'actualizó',
  deleted: 'eliminó',
  assigned: 'asignó',
  unassigned: 'desasignó',
  completed: 'completó',
  commented: 'comentó en',
  status_changed: 'cambió el estado de',
  attached: 'adjuntó un archivo en',
  detached: 'eliminó un archivo de',
  reviewer_assigned: 'asignó revisor en',
  reviewer_removed: 'removió el revisor de',
}

const entityLabels: Record<string, string> = {
  project: 'el proyecto',
  change_control: 'el control de cambios',
  task: 'la tarea',
  comment: 'un comentario',
  member: 'un miembro',
}

export function ProjectActivity({ projectId }: ProjectActivityProps) {
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchActivities()

    // Configurar Realtime subscription
    const supabase = createClient()
    const channel = supabase
      .channel(`activity-${projectId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'activity_log',
        },
        async (payload) => {
          // Verificar si la actividad pertenece a este proyecto
          const newActivity = payload.new as { 
            id: string
            entity_type: string
            entity_id: string | null
            details: Record<string, unknown> | null 
          }
          
          const isProjectActivity = 
            (['project', 'change_control'].includes(newActivity.entity_type) && newActivity.entity_id === projectId) ||
            (newActivity.details?.project_id === projectId)
          
          if (isProjectActivity) {
            // Refetch para obtener los datos completos con el usuario
            fetchActivities()
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId])

  const fetchActivities = async () => {
    try {
      const response = await fetch(`/api/dashboard/activity?project_id=${projectId}&limit=20`)
      const data = await response.json()
      if (response.ok) {
        setActivities(data.activities || [])
      }
    } catch (error) {
      console.error('Error fetching activities:', error)
    } finally {
      setLoading(false)
    }
  }

  const getInitials = (name: string | null) => {
    if (!name) return '??'
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  const formatDateTime = (date: string) => {
    const now = new Date()
    const activityDate = new Date(date)
    const diffMs = now.getTime() - activityDate.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Ahora'
    if (diffMins < 60) return `Hace ${diffMins} min`
    if (diffHours < 24) return `Hace ${diffHours}h`
    if (diffDays < 7) return `Hace ${diffDays}d`
    
    return activityDate.toLocaleDateString('es-CL', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getActivityDescription = (activity: Activity) => {
    const action = actionLabels[activity.action] || activity.action
    const entity = entityLabels[activity.entity_type] || activity.entity_type
    const entityName = activity.entity_name ? `"${activity.entity_name}"` : ''
    
    // Detalles adicionales
    let extra = ''
    if (activity.details) {
      if (activity.action === 'status_changed' && activity.details.from && activity.details.to) {
        extra = ` de "${activity.details.from}" a "${activity.details.to}"`
      }
      if (activity.action === 'assigned' && activity.details.assignee_name) {
        extra = ` a ${activity.details.assignee_name}`
      }
      if (activity.action === 'unassigned' && activity.details.unassigned_user_name) {
        extra = ` a ${activity.details.unassigned_user_name}`
      }
      if (activity.action === 'reviewer_assigned' && activity.details.reviewer_name) {
        extra = ` → ${activity.details.reviewer_name}`
      }
      if (activity.action === 'reviewer_removed' && activity.details.reviewer_name) {
        extra = ` (${activity.details.reviewer_name})`
      }
      if ((activity.action === 'attached' || activity.action === 'detached') && activity.details.file_name) {
        extra = ` (${activity.details.file_name})`
      }
    }
    
    return `${action} ${entity} ${entityName}${extra}`
  }

  return (
    <div className="bg-card rounded-lg border border-border p-6">
      <h3 className="font-semibold text-foreground flex items-center gap-2 mb-4">
        <History className="w-5 h-5" /> Historial de Actividad
      </h3>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex gap-3">
              <Skeleton className="w-8 h-8 rounded-full flex-shrink-0" />
              <div className="flex-1 space-y-2 pt-0.5">
                <Skeleton className="h-4 w-4/5" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
          ))}
        </div>
      ) : activities.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">
          No hay actividad registrada en este proyecto
        </p>
      ) : (
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {activities.map((activity) => (
            <div key={activity.id} className="flex gap-3">
              <div className="flex-shrink-0">
                <Avatar className="w-8 h-8">
                  <AvatarImage src={activity.user?.avatar_url || undefined} />
                  <AvatarFallback className="bg-muted text-muted-foreground text-xs">
                    {getInitials(activity.user?.full_name || null)}
                  </AvatarFallback>
                </Avatar>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <div className="flex-shrink-0">
                    {actionIcons[activity.action] || <History className="w-4 h-4 text-muted-foreground" />}
                  </div>
                  <p className="text-sm text-foreground">
                    <span className="font-medium">{activity.user?.full_name || 'Usuario'}</span>
                    {' '}
                    <span className="text-muted-foreground">{getActivityDescription(activity)}</span>
                  </p>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {formatDateTime(activity.created_at)}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
