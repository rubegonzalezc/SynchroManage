'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { CheckCircle2, Clock, RefreshCw, ListTodo, BarChart3, Eye, Inbox, UserX, Calendar } from 'lucide-react'
import { categoryIcons, categoryLabels, categoryColors } from '@/lib/constants/categories'
import Link from 'next/link'
import { UnassignedTasks } from '@/components/dashboard/UnassignedTasks'

interface UserStat {
  user: { id: string; full_name: string; avatar_url: string | null; role: string }
  done: number; pending: number; in_progress: number
  review: number; backlog: number; carry_over: number; total: number
}

interface GlobalTotals {
  done: number; in_progress: number; review: number
  pending: number; backlog: number; carry_over: number
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
const priorityColors: Record<string, string> = {
  low: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
  medium: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
  high: 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400',
  urgent: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
}
const priorityLabels: Record<string, string> = {
  low: 'Baja', medium: 'Media', high: 'Alta', urgent: 'Urgente',
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
  const [totalTasks, setTotalTasks] = useState(0)
  const [globalTotals, setGlobalTotals] = useState<GlobalTotals>({ done: 0, in_progress: 0, review: 0, pending: 0, backlog: 0, carry_over: 0 })
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
          setTotalTasks(data.totalTasks ?? 0)
          setGlobalTotals(data.globalTotals ?? { done: 0, in_progress: 0, review: 0, pending: 0, backlog: 0, carry_over: 0 })
        }
      })
      .catch(() => setError('Error al cargar el reporte'))
      .finally(() => setLoading(false))
  }, [])

  // totals viene directo de la DB via globalTotals (tareas únicas, sin duplicados por multi-asignación)

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <BarChart3 className="w-6 h-6 text-primary" />
        <div>
          <h1 className="text-2xl font-bold text-foreground">Reporte de Tareas</h1>
          <p className="text-sm text-muted-foreground">Estadísticas por desarrollador · {!loading && `${totalTasks} tareas en total`}</p>
        </div>
      </div>

      {/* Summary cards */}
      {!loading && !error && (
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

      {/* Per-user table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Detalle por Usuario</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="w-10 h-10 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-2 w-full" />
                  </div>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5, 6].map(j => <Skeleton key={j} className="h-12 w-16 rounded-lg" />)}
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
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Unassigned tasks */}
      <UnassignedTasks />
    </div>
  )
}
