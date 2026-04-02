'use client'

import { useState } from 'react'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Loader2, ArrowRight, Archive } from 'lucide-react'
import type { Sprint } from './CreateSprintDialog'

interface CompleteSprintDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  sprint: Sprint
  nextSprintName: string | null
  pendingTasksCount: number
  onCompleted: (sprintId: string) => void
}

export function CompleteSprintDialog({
  open,
  onOpenChange,
  sprint,
  nextSprintName,
  pendingTasksCount,
  onCompleted,
}: CompleteSprintDialogProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const doneTasks = (sprint.tasks || []).filter(t => t.status === 'done').length
  const totalTasks = (sprint.tasks || []).length

  const handleComplete = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/dashboard/sprints/${sprint.id}/complete`, {
        method: 'POST',
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error)
      onCompleted(sprint.id)
      onOpenChange(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al completar sprint')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Completar Sprint</DialogTitle>
          <DialogDescription>
            Resumen del sprint <span className="font-medium text-foreground">{sprint.name}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Resumen de tareas */}
          <div className="rounded-lg border border-border bg-muted/40 p-4 space-y-3">
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">Tareas completadas</span>
              <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                {doneTasks} / {totalTasks}
              </Badge>
            </div>
            {pendingTasksCount > 0 && (
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Tareas sin completar</span>
                <Badge variant="secondary" className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                  {pendingTasksCount}
                </Badge>
              </div>
            )}
          </div>

          {/* Aviso carry-over */}
          {pendingTasksCount > 0 && (
            <div className="rounded-lg border border-border p-4 space-y-2">
              {nextSprintName ? (
                <>
                  <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                    <ArrowRight className="w-4 h-4 text-amber-500" />
                    Carry Over al siguiente sprint
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Las <span className="font-medium text-foreground">{pendingTasksCount} tarea{pendingTasksCount !== 1 ? 's' : ''}</span> sin
                    completar se moverán al sprint <span className="font-medium text-foreground">&quot;{nextSprintName}&quot;</span> con
                    el badge <Badge variant="secondary" className="text-xs bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 ml-1">Carry Over</Badge> para
                    indicar que tienen prioridad.
                  </p>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                    <Archive className="w-4 h-4 text-slate-500" />
                    Sin siguiente sprint
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Las <span className="font-medium text-foreground">{pendingTasksCount} tarea{pendingTasksCount !== 1 ? 's' : ''}</span> sin
                    completar volverán al <span className="font-medium text-foreground">Backlog</span> (sin sprint asignado).
                  </p>
                </>
              )}
            </div>
          )}

          {pendingTasksCount === 0 && (
            <p className="text-sm text-muted-foreground text-center">
              Todas las tareas están completadas. ¡Buen trabajo!
            </p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={handleComplete} disabled={loading} className="bg-green-600 hover:bg-green-700 text-white">
            {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Completando...</> : 'Completar Sprint'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
