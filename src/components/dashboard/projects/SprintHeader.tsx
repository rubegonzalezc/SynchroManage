'use client'

import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Calendar, Target, Play, CheckCircle2, Loader2 } from 'lucide-react'
import { CompleteSprintDialog } from './CompleteSprintDialog'
import type { Sprint } from './CreateSprintDialog'

interface SprintHeaderProps {
  sprint: Sprint
  nextSprint: Sprint | null
  canManage: boolean
  onSprintStarted: (sprint: Sprint) => void
  onSprintCompleted: (sprintId: string) => void
}

const statusConfig = {
  planning: { label: 'Planificación', className: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700' },
  active: { label: 'Activo', className: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800' },
  completed: { label: 'Completado', className: 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800' },
}

export function SprintHeader({ sprint, nextSprint, canManage, onSprintStarted, onSprintCompleted }: SprintHeaderProps) {
  const [startingLoading, setStartingLoading] = useState(false)
  const [startError, setStartError] = useState<string | null>(null)
  const [completeDialogOpen, setCompleteDialogOpen] = useState(false)

  const tasks = sprint.tasks || []
  const doneTasks = tasks.filter(t => t.status === 'done').length
  const totalTasks = tasks.length
  const pendingTasksCount = totalTasks - doneTasks
  const progressPercent = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0

  const formatDate = (d: string) =>
    new Date(d + 'T00:00:00').toLocaleDateString('es-CL', { day: '2-digit', month: 'short', year: 'numeric' })

  const handleStart = async () => {
    setStartingLoading(true)
    setStartError(null)
    try {
      const response = await fetch(`/api/dashboard/sprints/${sprint.id}/start`, { method: 'POST' })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error)
      onSprintStarted(data.sprint)
    } catch (err) {
      setStartError(err instanceof Error ? err.message : 'Error al iniciar sprint')
    } finally {
      setStartingLoading(false)
    }
  }

  const cfg = statusConfig[sprint.status] ?? statusConfig.planning

  return (
    <>
      <div className="bg-card rounded-lg border border-border p-4 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div className="space-y-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold text-foreground text-base">{sprint.name}</h3>
              <Badge variant="outline" className={`text-xs ${cfg.className}`}>
                {cfg.label}
              </Badge>
            </div>

            {sprint.goal && (
              <div className="flex items-start gap-1.5 text-sm text-muted-foreground">
                <Target className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                <span className="line-clamp-2">{sprint.goal}</span>
              </div>
            )}

            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Calendar className="w-3.5 h-3.5 shrink-0" />
              <span>{formatDate(sprint.start_date)} — {formatDate(sprint.end_date)}</span>
            </div>
          </div>

          {canManage && sprint.status !== 'completed' && (
            <div className="flex items-center gap-2 shrink-0">
              {sprint.status === 'planning' && (
                <Button
                  size="sm"
                  onClick={handleStart}
                  disabled={startingLoading}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {startingLoading
                    ? <><Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> Iniciando...</>
                    : <><Play className="w-3.5 h-3.5 mr-1.5" /> Iniciar Sprint</>}
                </Button>
              )}
              {sprint.status === 'active' && (
                <Button
                  size="sm"
                  onClick={() => setCompleteDialogOpen(true)}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" /> Completar Sprint
                </Button>
              )}
            </div>
          )}
        </div>

        {startError && (
          <p className="text-xs text-red-600 dark:text-red-400">{startError}</p>
        )}

        {/* Barra de progreso */}
        {totalTasks > 0 && (
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{doneTasks} de {totalTasks} tareas completadas</span>
              <span>{progressPercent}%</span>
            </div>
            <div className="w-full bg-muted rounded-full h-1.5">
              <div
                className="bg-green-500 dark:bg-green-600 h-1.5 rounded-full transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        )}

        {totalTasks === 0 && sprint.status !== 'completed' && (
          <p className="text-xs text-muted-foreground">Sin tareas asignadas a este sprint aún.</p>
        )}
      </div>

      <CompleteSprintDialog
        open={completeDialogOpen}
        onOpenChange={setCompleteDialogOpen}
        sprint={sprint}
        nextSprintName={nextSprint?.name ?? null}
        pendingTasksCount={pendingTasksCount}
        onCompleted={onSprintCompleted}
      />
    </>
  )
}
