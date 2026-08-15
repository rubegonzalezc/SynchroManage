'use client'

import { useMemo } from 'react'
import { CalendarDays } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { GlassPanel } from '@/components/ui/glass-panel'

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
      <GlassPanel padding={2} className="flex-shrink-0">
        <p className="text-[14px] text-muted-foreground">
          No hay un sprint activo en <span className="font-semibold text-foreground">{projectName}</span>
        </p>
      </GlassPanel>
    )
  }

  return (
    <GlassPanel padding={2.25} className="flex-shrink-0">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex-1 min-w-0">
          <p className="text-[12px] font-medium text-muted-foreground tracking-tight">Sprint activo</p>
          <h3 className="text-[17px] font-semibold tracking-tight text-foreground truncate mt-0.5">{activeSprint.name}</h3>
          {activeSprint.goal && (
            <p className="text-[13px] text-muted-foreground mt-0.5 line-clamp-1">{activeSprint.goal}</p>
          )}
          <div className="flex items-center gap-1.5 mt-1.5 text-[12px] text-muted-foreground">
            <CalendarDays className="w-3.5 h-3.5" />
            <span>{formatDate(activeSprint.start_date)} — {formatDate(activeSprint.end_date)}</span>
          </div>
        </div>

        <div className="flex items-center gap-5 flex-shrink-0">
          <div>
            <p className="text-[22px] font-semibold tracking-tight leading-none" style={{ color: '#30D158' }}>
              {doneTasks}/{totalTasks}
            </p>
            <p className="text-[11px] text-muted-foreground mt-1">Completadas</p>
          </div>

          {pendingCount > 0 && (
            <div>
              <p className="text-[22px] font-semibold tracking-tight leading-none" style={{ color: '#FF9F0A' }}>
                {pendingCount}
              </p>
              <p className="text-[11px] text-muted-foreground mt-1">Pendientes</p>
            </div>
          )}

          {carryOverCount > 0 && (
            <div>
              <p className="text-[22px] font-semibold tracking-tight leading-none" style={{ color: '#FF9F0A' }}>
                {carryOverCount}
              </p>
              <p className="text-[11px] text-muted-foreground mt-1">Carry Over</p>
            </div>
          )}
        </div>
      </div>

      <div className="mt-3">
        <div className="flex items-center justify-between text-[12px] text-muted-foreground mb-1.5">
          <span>Progreso del sprint</span>
          <span className="font-semibold text-foreground">{progress}%</span>
        </div>
        <div className="w-full h-1.5 bg-black/[0.06] dark:bg-white/[0.08] rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${progress}%`, backgroundColor: '#2563EB' }}
          />
        </div>
      </div>
    </GlassPanel>
  )
}
