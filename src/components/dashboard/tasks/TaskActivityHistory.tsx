'use client'

import { useCallback, useEffect, useState } from 'react'
import {
  ArrowRight,
  GitBranch,
  History,
  Link2,
  Paperclip,
  Pencil,
  Plus,
  ShieldCheck,
  Trash2,
  UserMinus,
  UserPlus,
} from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import { createClient } from '@/lib/supabase/client'
import {
  type ActivityLogEntry,
  formatActivityRelativeDate,
  getTaskActivityDescription,
} from '@/lib/utils/activity-format'

const TASK_ACTIVITY_LIMIT = 50

const actionIcons: Record<string, React.ReactNode> = {
  created: <Plus className="w-4 h-4 text-green-500" />,
  updated: <Pencil className="w-4 h-4 text-blue-500" />,
  deleted: <Trash2 className="w-4 h-4 text-red-500" />,
  assigned: <UserPlus className="w-4 h-4 text-purple-500" />,
  unassigned: <UserMinus className="w-4 h-4 text-orange-500" />,
  status_changed: <ArrowRight className="w-4 h-4 text-amber-500" />,
  attached: <Paperclip className="w-4 h-4 text-indigo-500" />,
  detached: <Paperclip className="w-4 h-4 text-red-500" />,
  reviewer_assigned: <ShieldCheck className="w-4 h-4 text-violet-500" />,
  reviewer_removed: <ShieldCheck className="w-4 h-4 text-red-400" />,
  sprint_changed: <GitBranch className="w-4 h-4 text-cyan-500" />,
  dependency_changed: <Link2 className="w-4 h-4 text-sky-500" />,
}

interface TaskActivityHistoryProps {
  taskId: string
  refreshKey?: number
}

function getInitials(name: string | null) {
  if (!name) return '??'
  return name.split(' ').map((part) => part[0]).join('').toUpperCase().slice(0, 2)
}

export function TaskActivityHistory({ taskId, refreshKey = 0 }: TaskActivityHistoryProps) {
  const [activities, setActivities] = useState<ActivityLogEntry[]>([])
  const [loading, setLoading] = useState(true)

  const fetchActivities = useCallback(async () => {
    try {
      const response = await fetch(
        `/api/dashboard/activity?entity_type=task&entity_id=${taskId}&limit=${TASK_ACTIVITY_LIMIT}`
      )
      const data = await response.json()
      if (response.ok) {
        setActivities(data.activities || [])
      }
    } catch (error) {
      console.error('Error fetching task activity:', error)
    } finally {
      setLoading(false)
    }
  }, [taskId])

  useEffect(() => {
    setLoading(true)
    fetchActivities()
  }, [fetchActivities, refreshKey])

  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel(`task-activity-${taskId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'activity_log',
        },
        (payload) => {
          const newActivity = payload.new as { entity_type?: string; entity_id?: string | null }
          if (newActivity.entity_type === 'task' && newActivity.entity_id === taskId) {
            fetchActivities()
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [taskId, fetchActivities])

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((item) => (
          <div key={item} className="flex gap-3">
            <Skeleton className="w-8 h-8 rounded-full flex-shrink-0" />
            <div className="flex-1 space-y-2 pt-0.5">
              <Skeleton className="h-4 w-4/5" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (activities.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-4">
        No hay historial para esta tarea
      </p>
    )
  }

  return (
    <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
      {activities.map((activity) => (
        <div key={activity.id} className="flex gap-3">
          <Avatar className="w-8 h-8 flex-shrink-0">
            <AvatarImage src={activity.user?.avatar_url || undefined} />
            <AvatarFallback className="bg-muted text-muted-foreground text-xs">
              {getInitials(activity.user?.full_name || null)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-start gap-2">
              <div className="flex-shrink-0 mt-0.5">
                {actionIcons[activity.action] || <History className="w-4 h-4 text-muted-foreground" />}
              </div>
              <p className="text-sm text-foreground">
                <span className="font-medium">{activity.user?.full_name || 'Usuario'}</span>
                {' '}
                <span className="text-muted-foreground">{getTaskActivityDescription(activity)}</span>
              </p>
            </div>
            <p className="text-xs text-muted-foreground mt-1 ml-6">
              {formatActivityRelativeDate(activity.created_at)}
            </p>
          </div>
        </div>
      ))}
      {activities.length >= TASK_ACTIVITY_LIMIT && (
        <p className="text-[11px] text-muted-foreground text-center pt-1">
          Mostrando los últimos {TASK_ACTIVITY_LIMIT} eventos
        </p>
      )}
    </div>
  )
}
