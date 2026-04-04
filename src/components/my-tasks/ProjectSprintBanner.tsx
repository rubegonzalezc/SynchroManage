'use client'

import { useMemo } from 'react'
import { Badge } from '@/components/ui/badge'
import { CalendarDays, Zap, CheckCircle2, Clock, RefreshCw } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

interface Sprint {
  id: string
  name: string
  goal: string | null
  start_date: string
  end_date: string
  status: 'planning' | 'active' | 'completed'
  order_index: number
}

interface Task {
  id: string
  status: string
  sprint_id: string | null
  is_carry_over?: boolean
}

interface ProjectSprintBannerProps {
  sprints: Sprint[]
  tasks: Task[]
  projectName: string
}

export function ProjectSprintBanner({ sprints, tasks, projectName }: ProjectSprintBannerProps) {
  const activeSprint = useMemo(
    () => sprints.find(s => s.status === 'active') ?? null,
    [sprints]
  )

  const sprintTasks = useMemo(() => {
    if (!activeSprint) return []
    return tasks.filter(t => t.sprint_id === activeSprint.id)
  }, [activeSprint, tasks])

  const doneTasks = sprintTasks.filter(t => t.status === 'done').length
  const totalTasks = sprintTasks.length
  const progress = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0
  const carryOverCount = sprintTasks.filter(t => t.is_carry_over).length
  const pendingCount = sprintTasks.filter(t => t.status !== 'done').length

  const formatDate = (dateStr: string) => {
    return format(new Date(dateStr + 'T00:00:00'), "d MMM", { locale: es })
  }

  if (!activeSprint) {
    return (
      <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-dashed border-border bg-muted/30 text-muted-foreground text-sm">
        <Clock className="w-4 h-4 flex-shrink-0" />
        <span>No hay un sprint activo en <span className="font-medium text-foreground">{projectName}</span></span>
      </div>
    )
  }

  return (
    <div className="relative overflow-hidden rounded-xl border border-primary/20 bg-gradient-to-r from-primary/5 via-primary/3 to-transparent p-4">
      {/* Decorative element */}
      <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-primary/5 -translate-y-1/2 translate-x-1/2" />

      <div className="relative flex flex-col sm:flex-row sm:items-center gap-4">
        {/* Sprint info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <div className="flex items-center gap-1.5 text-primary">
              <Zap className="w-4 h-4" />
              <span className="text-xs font-semibold uppercase tracking-wide">Sprint Activo</span>
            </div>
            <Badge className="bg-primary/10 text-primary border-primary/20 text-xs">
              Activo
            </Badge>
          </div>
          <h3 className="font-semibold text-foreground text-base truncate">{activeSprint.name}</h3>
          {activeSprint.goal && (
            <p className="text-sm text-muted-foreground mt-0.5 line-clamp-1">{activeSprint.goal}</p>
          )}
          <div className="flex items-center gap-1.5 mt-1.5 text-xs text-muted-foreground">
            <CalendarDays className="w-3.5 h-3.5" />
            <span>{formatDate(activeSprint.start_date)} — {formatDate(activeSprint.end_date)}</span>
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-4 sm:gap-6 flex-shrink-0">
          <div className="flex items-center gap-2 text-center">
            <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
            <div>
              <p className="text-lg font-bold text-foreground leading-none">{doneTasks}/{totalTasks}</p>
              <p className="text-xs text-muted-foreground mt-0.5">Completadas</p>
            </div>
          </div>

          {pendingCount > 0 && (
            <div className="flex items-center gap-2 text-center">
              <Clock className="w-4 h-4 text-amber-500 flex-shrink-0" />
              <div>
                <p className="text-lg font-bold text-foreground leading-none">{pendingCount}</p>
                <p className="text-xs text-muted-foreground mt-0.5">Pendientes</p>
              </div>
            </div>
          )}

          {carryOverCount > 0 && (
            <div className="flex items-center gap-2 text-center">
              <RefreshCw className="w-4 h-4 text-orange-500 flex-shrink-0" />
              <div>
                <p className="text-lg font-bold text-foreground leading-none">{carryOverCount}</p>
                <p className="text-xs text-muted-foreground mt-0.5">Carry Over</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Progress bar */}
      <div className="mt-3">
        <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
          <span>Progreso del sprint</span>
          <span className="font-semibold text-foreground">{progress}%</span>
        </div>
        <div className="w-full h-2 bg-primary/10 rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  )
}
