'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { CheckCircle2, Clock, RefreshCw, ListTodo, BarChart3, Eye, Inbox, UserX, Calendar, Bug, AlertTriangle } from 'lucide-react'
import Link from 'next/link'
import { UnassignedTasks } from '@/components/dashboard/UnassignedTasks'

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

interface OpenBug {
  id: string
  title: string
  severity: string
  status: string
  created_at: string
  project: { id: string; name: string } | null
  task: { id: string; task_number: number | null; title: string } | null
  assignee: { id: string; full_name: string; avatar_url: string | null } | null
}

interface UnassignedTask {
  id: string
  task_number: number | null
  title: string
  status: string
  priority: string
  category: string | null
  due_date: string | null
  project: { id: string; name: string; type: string } | null
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

const severityConfig: Record<string, { label: string; color: string }> = {
  low: { label: 'Baja', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
  medium: { label: 'Media', color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' },
  high: { label: 'Alta', color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' },
  critical: { label: 'Crítica', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
}

function getInitials(name: string) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

function StatPill({ value, label, color }: { value: number; label: string; color: string }) {
  return (
    <div className={`flex flex-col items-center px-3 py-2 rounded-lg ${color}`}>
      <span className="text-lg font-bold leading-none">{value}</span>
      <span className="text-xs mt-1 opacity-80">{label}</span>
    </div>
  )
}

function ProgressBar({ done, total }: { done: number; total: number }) {
  const pct = total > 0 ? Math.round((done / total) * 100) : 0
  return (
    <div className="w-full">
      <div className="flex justify-between text-xs text-muted-foreground mb-1">
        <span>Progreso</span><span>{pct}%</span>
      </div>
      <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
        <div className="h-full bg-green-500 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

export default function ReportsPage() {
  const [stats, setStats] = useState<UserStat[]>([])
  const [unassigned, setUnassigned] = useState<UnassignedTask[]>([])
  const [openBugs, setOpenBugs] = useState<OpenBug[]>([])
  const [totalTasks, setTotalTasks] = useState(0)
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
          setUnassigned(data.unassigned || [])
          setOpenBugs(data.openBugs || [])
          setTotalTasks(data.totalTasks ?? 0)
          setGlobalTotals(data.globalTotals ?? { done: 0, in_progress: 0, review: 0, pending: 0, backlog: 0, carry_over: 0 })
          setBugTotals(data.bugTotals ?? { open: 0, in_progress: 0, resolved: 0, closed: 0, total: 0 })
        }
      })
      .catch(() => setError('Error al cargar el reporte'))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="space-y-6 pt-6">
      <div className="flex items-center gap-3">
        <BarChart3 className="w-6 h-6 text-primary" />
        <div>
          <h1 className="text-2xl font-bold text-foreground">Reporte</h1>
          <p className="text-sm text-muted-foreground">Estadísticas del sistema</p>
        </div>
      </div>

      {/* Summary cards - Tasks */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
          {[1,2,3,4,5,6,7].map(i => (
            <div key={i} className="rounded-lg border border-border p-4">
              <div className="flex items-center gap-3">
                <Skeleton className="w-8 h-8 rounded-lg flex-shrink-0" />
                <div className="space-y-1.5">
                  <Skeleton className="h-7 w-10" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : !error && (
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-50 dark:bg-green-900/30">
                  <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{globalTotals.done}</p>
                  <p className="text-xs text-muted-foreground">Completadas</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-900/30">
                  <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{globalTotals.in_progress}</p>
                  <p className="text-xs text-muted-foreground">En Progreso</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-violet-50 dark:bg-violet-900/30">
                  <Eye className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{globalTotals.review}</p>
                  <p className="text-xs text-muted-foreground">En Revisión</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800">
                  <ListTodo className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{globalTotals.pending}</p>
                  <p className="text-xs text-muted-foreground">Por Hacer</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-zinc-50 dark:bg-zinc-800">
                  <Inbox className="w-4 h-4 text-zinc-600 dark:text-zinc-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{globalTotals.backlog}</p>
                  <p className="text-xs text-muted-foreground">Backlog</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-900/30">
                  <RefreshCw className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{globalTotals.carry_over}</p>
                  <p className="text-xs text-muted-foreground">Carry Over</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-rose-50 dark:bg-rose-900/30">
                  <UserX className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{unassigned.length}</p>
                  <p className="text-xs text-muted-foreground">Sin Asignar</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Bug summary cards */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[1,2,3,4].map(i => (
            <div key={i} className="rounded-lg border border-border p-4">
              <div className="flex items-center gap-3">
                <Skeleton className="w-8 h-8 rounded-lg flex-shrink-0" />
                <div className="space-y-1.5">
                  <Skeleton className="h-7 w-10" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : !error && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Card className="border-red-200 dark:border-red-800">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-red-50 dark:bg-red-900/30">
                  <Bug className="w-4 h-4 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-red-600 dark:text-red-400">{bugTotals.open}</p>
                  <p className="text-xs text-muted-foreground">Bugs Abiertos</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-900/30">
                  <Bug className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{bugTotals.in_progress}</p>
                  <p className="text-xs text-muted-foreground">En Progreso</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-50 dark:bg-green-900/30">
                  <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{bugTotals.resolved}</p>
                  <p className="text-xs text-muted-foreground">Resueltos</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800">
                  <AlertTriangle className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{bugTotals.total}</p>
                  <p className="text-xs text-muted-foreground">Total Bugs</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Per-user table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Detalle por Usuario</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="flex flex-col sm:flex-row sm:items-center gap-4 p-3 rounded-lg border border-border">
                  <div className="flex items-center gap-3 min-w-[180px]">
                    <Skeleton className="w-10 h-10 rounded-full flex-shrink-0" />
                    <div className="space-y-1.5">
                      <Skeleton className="h-4 w-28" />
                      <Skeleton className="h-5 w-16 rounded-full" />
                    </div>
                  </div>
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-2 w-full rounded-full" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {[1,2,3,4,5,6,7].map(j => <Skeleton key={j} className="h-12 w-16 rounded-lg" />)}
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <p className="text-sm text-red-500 text-center py-6">{error}</p>
          ) : stats.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">No hay datos disponibles</p>
          ) : (
            <div className="space-y-4">
              {stats.map(s => (
                <div key={s.user.id} className="flex flex-col sm:flex-row sm:items-center gap-4 p-3 rounded-lg border border-border hover:bg-muted/30 transition-colors">
                  <div className="flex items-center gap-3 min-w-[180px]">
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={s.user.avatar_url || undefined} />
                      <AvatarFallback className="bg-muted text-muted-foreground text-sm">
                        {getInitials(s.user.full_name || '?')}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-sm text-foreground leading-tight">{s.user.full_name}</p>
                      <Badge variant="secondary" className={`text-xs mt-0.5 ${roleColors[s.user.role] || ''}`}>
                        {roleLabels[s.user.role] || s.user.role}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex-1 min-w-[120px]">
                    <ProgressBar done={s.done} total={s.total} />
                    <p className="text-xs text-muted-foreground mt-1">{s.total} tareas en total</p>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    <StatPill value={s.done} label="Hechas" color="bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400" />
                    <StatPill value={s.in_progress} label="En curso" color="bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" />
                    <StatPill value={s.review} label="Revisión" color="bg-violet-50 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400" />
                    <StatPill value={s.pending} label="Por hacer" color="bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400" />
                    <StatPill value={s.backlog} label="Backlog" color="bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400" />
                    <StatPill value={s.carry_over} label="Carry Over" color="bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" />
                    {s.bugs_total > 0 && (
                      <StatPill value={s.bugs_open + s.bugs_in_progress} label="Bugs activos" color="bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Bug detail per user - right below user task detail */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Bug className="w-4 h-4 text-red-500" />
            Bugs por Usuario
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 rounded-lg border border-border">
                  <div className="flex items-center gap-3 min-w-[180px]">
                    <Skeleton className="w-8 h-8 rounded-full flex-shrink-0" />
                    <div className="space-y-1.5">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-5 w-16 rounded-full" />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {[1,2,3,4].map(j => <Skeleton key={j} className="h-12 w-16 rounded-lg" />)}
                  </div>
                </div>
              ))}
            </div>
          ) : !error && stats.some(s => s.bugs_total > 0) ? (
            <div className="space-y-3">
              {stats.filter(s => s.bugs_total > 0).map(s => (
                <div key={s.user.id} className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 rounded-lg border border-border hover:bg-muted/30 transition-colors">
                  <div className="flex items-center gap-3 min-w-[180px]">
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={s.user.avatar_url || undefined} />
                      <AvatarFallback className="bg-muted text-muted-foreground text-xs">
                        {getInitials(s.user.full_name || '?')}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-sm text-foreground leading-tight">{s.user.full_name}</p>
                      <Badge variant="secondary" className={`text-xs mt-0.5 ${roleColors[s.user.role] || ''}`}>
                        {roleLabels[s.user.role] || s.user.role}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    <StatPill value={s.bugs_open} label="Abiertos" color="bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400" />
                    <StatPill value={s.bugs_in_progress} label="En curso" color="bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" />
                    <StatPill value={s.bugs_resolved} label="Resueltos" color="bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400" />
                    <StatPill value={s.bugs_total} label="Total" color="bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400" />
                  </div>
                </div>
              ))}
            </div>
          ) : !loading && (
            <p className="text-sm text-muted-foreground text-center py-6">No hay bugs asignados a usuarios</p>
          )}
        </CardContent>
      </Card>

      {/* Unassigned tasks */}
      <UnassignedTasks />

      {/* Open bugs list */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Bug className="w-4 h-4 text-red-500" />
            Bugs Abiertos
            {!loading && openBugs.length > 0 && (
              <Badge variant="secondary" className="ml-1 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                {openBugs.length}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-lg border border-border">
                  <Skeleton className="h-3.5 w-3.5 rounded flex-shrink-0" />
                  <Skeleton className="h-4 flex-1" />
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-5 w-14 rounded-full" />
                  <Skeleton className="h-5 w-20 rounded-full" />
                  <Skeleton className="h-4 w-16" />
                </div>
              ))}
            </div>
          ) : openBugs.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">No hay bugs abiertos</p>
          ) : (
            <div className="space-y-2">
              {openBugs.map(bug => {
                const sev = severityConfig[bug.severity] ?? severityConfig.medium
                return (
                  <div key={bug.id} className="flex flex-col sm:flex-row sm:items-center gap-2 p-3 rounded-lg border border-border hover:bg-muted/30 transition-colors">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <Bug className="w-3.5 h-3.5 text-red-500 shrink-0" />
                      <span className="text-sm font-medium text-foreground truncate">{bug.title}</span>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap shrink-0">
                      {bug.project && (
                        <Link href={`/projects/${bug.project.id}?tab=bugs`} className="text-xs text-muted-foreground hover:text-foreground truncate max-w-[140px]">
                          {bug.project.name}
                        </Link>
                      )}
                      {bug.task && (
                        <span className="text-xs text-muted-foreground">
                          #{bug.task.task_number} {bug.task.title}
                        </span>
                      )}
                      <Badge variant="secondary" className={`text-xs ${sev.color}`}>{sev.label}</Badge>
                      {bug.assignee ? (
                        <div className="flex items-center gap-1">
                          <Avatar className="w-5 h-5">
                            <AvatarImage src={bug.assignee.avatar_url || undefined} />
                            <AvatarFallback className="text-[9px]">{getInitials(bug.assignee.full_name)}</AvatarFallback>
                          </Avatar>
                          <span className="text-xs text-muted-foreground">{bug.assignee.full_name}</span>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground italic">Sin asignar</span>
                      )}
                      <span className="text-xs text-muted-foreground">
                        <Calendar className="w-3 h-3 inline mr-1" />
                        {new Date(bug.created_at).toLocaleDateString('es-CL', { day: '2-digit', month: 'short' })}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
