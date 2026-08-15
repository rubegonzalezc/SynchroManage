'use client'

import { useState, useEffect } from 'react'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Loader2, ArrowRight, Archive, Bug, AlertTriangle, CheckCircle2, X } from 'lucide-react'
import type { Sprint } from './CreateSprintDialog'

type BugAction = 'ignore' | 'resolve_and_close'

interface CompleteSprintDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  sprint: Sprint
  nextSprintName: string | null
  pendingTasksCount: number
  pendingBugsCount: number
  onCompleted: (sprintId: string) => void
}

export function CompleteSprintDialog({
  open,
  onOpenChange,
  sprint,
  nextSprintName,
  pendingTasksCount,
  pendingBugsCount,
  onCompleted,
}: CompleteSprintDialogProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  // Mostrar alerta de bugs solo si hay bugs pendientes y aún no se eligió acción
  const [showBugAlert, setShowBugAlert] = useState(false)
  const [bugAction, setBugAction] = useState<BugAction | null>(null)

  const doneTasks = (sprint.tasks || []).filter(t => t.status === 'done').length
  const totalTasks = (sprint.tasks || []).length

  // Resetear estado al abrir
  useEffect(() => {
    if (open) {
      setError(null)
      setBugAction(null)
      setShowBugAlert(pendingBugsCount > 0)
    }
  }, [open, pendingBugsCount])

  const handleComplete = async (action: BugAction) => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/dashboard/sprints/${sprint.id}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bugAction: action }),
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

  // ── Vista: alerta de bugs pendientes ──────────────────────────────────────
  if (showBugAlert && bugAction === null) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              Bugs pendientes en el sprint
            </DialogTitle>
            <DialogDescription>
              El sprint <span className="font-medium text-foreground">{sprint.name}</span> tiene{' '}
              <span className="font-medium text-foreground">
                {pendingBugsCount} bug{pendingBugsCount !== 1 ? 's' : ''}
              </span>{' '}
              sin resolver. ¿Cómo deseas proceder?
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            {/* Opción 1: Completar sin afectar bugs */}
            <button
              onClick={() => handleComplete('ignore')}
              disabled={loading}
              className="w-full text-left rounded-lg border border-border p-4 hover:bg-muted/50 transition-colors disabled:opacity-50 group"
            >
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <ArrowRight className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">
                    Completar sprint sin afectar los bugs
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Los bugs pendientes quedan abiertos para gestionarlos en el siguiente sprint.
                    Los bugs ya resueltos se cerrarán.
                  </p>
                </div>
                {loading && <Loader2 className="w-4 h-4 animate-spin ml-auto flex-shrink-0 mt-1" />}
              </div>
            </button>

            {/* Opción 2: Marcar bugs como resueltos y completar */}
            <button
              onClick={() => handleComplete('resolve_and_close')}
              disabled={loading}
              className="w-full text-left rounded-lg border border-border p-4 hover:bg-muted/50 transition-colors disabled:opacity-50 group"
            >
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">
                    Marcar bugs como resueltos y completar sprint
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Los bugs abiertos pasan a <Badge variant="secondary" className="text-[10px] bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 mx-0.5">Resuelto</Badge>
                    y los ya resueltos se cierran automáticamente.
                  </p>
                </div>
              </div>
            </button>

            {/* Opción 3: Cancelar */}
            <button
              onClick={() => onOpenChange(false)}
              disabled={loading}
              className="w-full text-left rounded-lg border border-border p-4 hover:bg-muted/50 transition-colors disabled:opacity-50"
            >
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0 mt-0.5">
                  <X className="w-4 h-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">Cancelar</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Volver sin completar el sprint.
                  </p>
                </div>
              </div>
            </button>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  // ── Vista: resumen normal (sin bugs pendientes o ya eligió acción) ─────────
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
            {pendingBugsCount === 0 && (
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <Bug className="w-3.5 h-3.5 text-green-500" /> Bugs
                </span>
                <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                  Sin pendientes
                </Badge>
              </div>
            )}
          </div>

          {/* Aviso carry-over de tareas */}
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

          {pendingTasksCount === 0 && pendingBugsCount === 0 && (
            <p className="text-sm text-muted-foreground text-center">
              Todas las tareas y bugs están completados. ¡Buen trabajo!
            </p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button
            onClick={() => handleComplete('ignore')}
            disabled={loading}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            {loading
              ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Completando...</>
              : 'Completar Sprint'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
