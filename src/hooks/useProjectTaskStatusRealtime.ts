import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

export function useProjectTaskStatusRealtime(
  projectId: string | undefined,
  enabled: boolean,
  onTaskStatusUpdate: (taskId: string, status: string) => void
) {
  useEffect(() => {
    if (!enabled || !projectId) return

    const supabase = createClient()
    const channel = supabase
      .channel(`project-task-status-${projectId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'tasks',
          filter: `project_id=eq.${projectId}`,
        },
        (payload) => {
          const updated = payload.new as { id?: string; status?: string }
          if (updated.id && updated.status) {
            onTaskStatusUpdate(updated.id, updated.status)
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [enabled, projectId, onTaskStatusUpdate])
}
