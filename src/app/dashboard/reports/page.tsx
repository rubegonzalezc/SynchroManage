'use client'

import { useEffect, useState } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import { UnassignedTasks } from '@/components/dashboard/UnassignedTasks'
import { OpenBugsList } from '@/components/dashboard/OpenBugsList'
import { DashboardSection } from '@/components/dashboard/DashboardSection'
import { GlassPanel } from '@/components/ui/glass-panel'

interface UserStat {
  user: { id: string; full_name: string; avatar_url: string | null; role: string }
  done: number; pending: number; in_progress: number
  review: number; backlog: number; carry_over: number; total: number
  bugs_open: number; bugs_in_progress: number; bugs_resolved: number; bugs_total: number
}

interface GlobalTotals {
  done: number; in_progress: number; review: number
  pending: number; backlog: number; carry_over: number
}

interface BugTotals {
  open: number; in_progress: number; resolved: number; closed: number; total: number
}

const roleLabels: Record<string, string> = {
  admin: 'Admin', pm: 'PM', tech_lead: 'Tech Lead',
  developer: 'Developer', stakeholder: 'Stakeholder',
}
const roleColors: Record<string, string> = {
  admin: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  pm: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  tech_lead: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  developer: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  stakeholder: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400',
}

function getInitials(name: string) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

function StatNumber({ value, label, accent }: { value: number; label: string; accent: string }) {
  return (
    <GlassPanel padding={2.25}>
      <p className="text-[12px] font-medium text-muted-foreground tracking-tight">{label}</p>
      <p className="text-[28px] font-semibold tracking-tight leading-none mt-2" style={{ color: accent }}>{value}</p>
    </GlassPanel>
  )
}

function MiniStat({ value, label, accent }: { value: number; label: string; accent: string }) {
  return (
    <div className="min-w-[64px]">
      <p className="text-[18px] font-semibold tracking-tight leading-none" style={{ color: accent }}>{value}</p>
      <p className="text-[11px] text-muted-foreground mt-1">{label}</p>
    </div>
  )
}

function ProgressBar({ done, total }: { done: number; total: number }) {
  const pct = total > 0 ? Math.round((done / total) * 100) : 0
  return (
    <div className="w-full">
      <div className="flex justify-between text-[12px] text-muted-foreground mb-1.5">
        <span>Progreso</span><span className="font-semibold text-foreground">{pct}%</span>
      </div>
      <div className="h-1.5 w-full bg-black/[0.06] dark:bg-white/[0.08] rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: '#30D158' }} />
      </div>
    </div>
  )
}

export default function ReportsPage() {
  const [stats, setStats] = useState<UserStat[]>([])
  const [unassignedCount, setUnassignedCount] = useState(0)
  const [globalTotals, setGlobalTotals] = useState<GlobalTotals>({ done: 0, in_progress: 0, review: 0, pending: 0, backlog: 0, carry_over: 0 })
  const [bugTotals, setBugTotals] = useState<BugTotals>({ open: 0, in_progress: 0, resolved: 0, closed: 0, total: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/dashboard/reports/tasks')
      .then(r => r.json())
      .then(data => {
        if (data.error) setError(data.error)
        else {
          setStats(data.stats || [])
          setUnassignedCount((data.unassigned || []).length)
          setGlobalTotals(data.globalTotals ?? { done: 0, in_progress: 0, review: 0, pending: 0, backlog: 0, carry_over: 0 })
          setBugTotals(data.bugTotals ?? { open: 0, in_progress: 0, resolved: 0, closed: 0, total: 0 })
        }
      })
      .catch(() => setError('Error al cargar el reporte'))
      .finally(() => setLoading(false))
  }, [])

  const taskStats = [
    { label: 'Completadas', value: globalTotals.done, accent: '#30D158' },
    { label: 'En progreso', value: globalTotals.in_progress, accent: '#0A84FF' },
    { label: 'En revisión', value: globalTotals.review, accent: '#BF5AF2' },
    { label: 'Por hacer', value: globalTotals.pending, accent: '#8E8E93' },
    { label: 'Backlog', value: globalTotals.backlog, accent: '#636366' },
    { label: 'Carry over', value: globalTotals.carry_over, accent: '#FF9F0A' },
    { label: 'Sin asignar', value: unassignedCount, accent: '#FF453A' },
  ]

  const bugStats = [
    { label: 'Bugs abiertos', value: bugTotals.open, accent: '#FF453A' },
    { label: 'En progreso', value: bugTotals.in_progress, accent: '#0A84FF' },
    { label: 'Resueltos', value: bugTotals.resolved, accent: '#30D158' },
    { label: 'Total bugs', value: bugTotals.total, accent: '#8E8E93' },
  ]

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-[28px] font-semibold tracking-tight text-foreground leading-tight">Reporte</h1>
        <p className="text-[15px] text-muted-foreground mt-1">Estadísticas de tareas, bugs y carga por usuario</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
          {Array.from({ length: 7 }).map((_, i) => (
            <GlassPanel key={i} padding={2.25}>
              <Skeleton className="h-3 w-16 mb-2" />
              <Skeleton className="h-7 w-10" />
            </GlassPanel>
          ))}
        </div>
      ) : !error && (
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
          {taskStats.map((s) => (
            <StatNumber key={s.label} value={s.value} label={s.label} accent={s.accent} />
          ))}
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <GlassPanel key={i} padding={2.25}>
              <Skeleton className="h-3 w-16 mb-2" />
              <Skeleton className="h-7 w-10" />
            </GlassPanel>
          ))}
        </div>
      ) : !error && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {bugStats.map((s) => (
            <StatNumber key={s.label} value={s.value} label={s.label} accent={s.accent} />
          ))}
        </div>
      )}

      <DashboardSection title="Detalle por usuario" description="Carga de trabajo y progreso">
        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="flex items-center gap-3 rounded-2xl px-2 py-3">
                <Skeleton className="w-10 h-10 rounded-full" />
                <Skeleton className="h-4 flex-1" />
              </div>
            ))}
          </div>
        ) : error ? (
          <p className="text-[14px] text-red-500 text-center py-8">{error}</p>
        ) : stats.length === 0 ? (
          <p className="text-[14px] text-muted-foreground text-center py-8">No hay datos disponibles</p>
        ) : (
          <div className="space-y-1">
            {stats.map(s => (
              <div key={s.user.id} className="flex flex-col lg:flex-row lg:items-center gap-3 rounded-2xl px-2 py-3">
                <div className="flex items-center gap-3 min-w-[180px]">
                  <Avatar className="w-9 h-9">
                    <AvatarImage src={s.user.avatar_url || undefined} />
                    <AvatarFallback className="text-[11px]">{getInitials(s.user.full_name || '?')}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="text-[14px] font-medium text-foreground truncate">{s.user.full_name}</p>
                    <span className={`text-[11px] font-semibold rounded-full px-2 py-0.5 ${roleColors[s.user.role] || ''}`}>
                      {roleLabels[s.user.role] || s.user.role}
                    </span>
                  </div>
                </div>
                <div className="flex-1 min-w-[120px]">
                  <ProgressBar done={s.done} total={s.total} />
                  <p className="text-[12px] text-muted-foreground mt-1">{s.total} tareas en total</p>
                </div>
                <div className="flex gap-4 flex-wrap">
                  <MiniStat value={s.done} label="Hechas" accent="#30D158" />
                  <MiniStat value={s.in_progress} label="En curso" accent="#0A84FF" />
                  <MiniStat value={s.review} label="Revisión" accent="#BF5AF2" />
                  <MiniStat value={s.pending} label="Por hacer" accent="#8E8E93" />
                  <MiniStat value={s.backlog} label="Backlog" accent="#636366" />
                  <MiniStat value={s.carry_over} label="Carry over" accent="#FF9F0A" />
                  {s.bugs_total > 0 && (
                    <MiniStat value={s.bugs_open + s.bugs_in_progress} label="Bugs" accent="#FF453A" />
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </DashboardSection>

      <DashboardSection title="Bugs por usuario" description="Incidencias asignadas">
        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex items-center gap-3 rounded-2xl px-2 py-3">
                <Skeleton className="w-8 h-8 rounded-full" />
                <Skeleton className="h-4 flex-1" />
              </div>
            ))}
          </div>
        ) : !error && stats.some(s => s.bugs_total > 0) ? (
          <div className="space-y-1">
            {stats.filter(s => s.bugs_total > 0).map(s => (
              <div key={s.user.id} className="flex flex-col sm:flex-row sm:items-center gap-3 rounded-2xl px-2 py-3">
                <div className="flex items-center gap-3 min-w-[180px]">
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={s.user.avatar_url || undefined} />
                    <AvatarFallback className="text-[10px]">{getInitials(s.user.full_name || '?')}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-[14px] font-medium text-foreground">{s.user.full_name}</p>
                    <span className={`text-[11px] font-semibold rounded-full px-2 py-0.5 ${roleColors[s.user.role] || ''}`}>
                      {roleLabels[s.user.role] || s.user.role}
                    </span>
                  </div>
                </div>
                <div className="flex gap-4 flex-wrap">
                  <MiniStat value={s.bugs_open} label="Abiertos" accent="#FF453A" />
                  <MiniStat value={s.bugs_in_progress} label="En curso" accent="#0A84FF" />
                  <MiniStat value={s.bugs_resolved} label="Resueltos" accent="#30D158" />
                  <MiniStat value={s.bugs_total} label="Total" accent="#8E8E93" />
                </div>
              </div>
            ))}
          </div>
        ) : !loading ? (
          <p className="text-[14px] text-muted-foreground text-center py-8">No hay bugs asignados a usuarios</p>
        ) : null}
      </DashboardSection>

      <UnassignedTasks />
      <OpenBugsList />
    </div>
  )
}
