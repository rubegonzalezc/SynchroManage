'use client'

import { useEffect, useState } from 'react'
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend, ReferenceLine,
} from 'recharts'
import { Skeleton } from '@/components/ui/skeleton'
import {
  TrendingDown, Zap, CheckCircle2, Clock, Eye,
  ListTodo, Inbox, RefreshCw, AlertCircle, CalendarDays,
} from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

interface BurndownPoint {
  date: string
  remaining: number
  ideal: number
}

interface VelocityPoint {
  sprintId: string
  name: string
  completed: number
  total: number
  carryOver: number
}

interface Summary {
  totalTasks: number
  doneTasks: number
  inProgress: number
  review: number
  todo: number
  backlog: number
  carryOver: number
  totalDays: number
  elapsedDays: number
  remainingDays: number
  completionRate: number
}

interface AnalyticsData {
  sprint: { id: string; name: string; goal: string | null; start_date: string; end_date: string; status: string }
  summary: Summary
  burndown: BurndownPoint[]
  velocity: VelocityPoint[]
}

interface SprintAnalyticsProps {
  sprintId: string
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function shortDate(iso: string) {
  const [, m, d] = iso.split('-')
  return `${d}/${m}`
}

function shortSprintName(name: string) {
  // Truncate long sprint names for the bar chart axis
  return name.length > 12 ? name.slice(0, 11) + '…' : name
}

// ─── Custom Tooltip ───────────────────────────────────────────────────────────

function BurndownTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number; name: string; color: string }[]; label?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-popover border border-border rounded-lg shadow-lg px-3 py-2 text-xs space-y-1">
      <p className="font-medium text-foreground">{label}</p>
      {payload.map(p => (
        <p key={p.name} style={{ color: p.color }}>
          {p.name === 'remaining' ? 'Restantes' : 'Ideal'}: <span className="font-semibold">{p.value}</span>
        </p>
      ))}
    </div>
  )
}

function VelocityTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number; name: string; color: string }[]; label?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-popover border border-border rounded-lg shadow-lg px-3 py-2 text-xs space-y-1">
      <p className="font-medium text-foreground">{label}</p>
      {payload.map(p => (
        <p key={p.name} style={{ color: p.color }}>
          {p.name === 'completed' ? 'Completadas' : p.name === 'total' ? 'Total' : 'Carry Over'}: <span className="font-semibold">{p.value}</span>
        </p>
      ))}
    </div>
  )
}

// ─── Stat Pill ────────────────────────────────────────────────────────────────

function StatPill({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: number; color: string }) {
  return (
    <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${color}`}>
      <span className="shrink-0">{icon}</span>
      <div>
        <p className="text-lg font-bold leading-none">{value}</p>
        <p className="text-xs opacity-75 mt-0.5">{label}</p>
      </div>
    </div>
  )
}

// ─── Loading skeleton ─────────────────────────────────────────────────────────

function AnalyticsSkeleton() {
  return (
    <div className="space-y-4 pt-2">
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
        {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-14 rounded-lg" />)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Skeleton className="h-52 rounded-lg" />
        <Skeleton className="h-52 rounded-lg" />
      </div>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function SprintAnalytics({ sprintId }: SprintAnalyticsProps) {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    setError(null)
    fetch(`/api/dashboard/sprints/${sprintId}/analytics`)
      .then(r => r.json())
      .then(d => {
        if (d.error) setError(d.error)
        else setData(d)
      })
      .catch(() => setError('Error al cargar analíticas'))
      .finally(() => setLoading(false))
  }, [sprintId])

  if (loading) return <AnalyticsSkeleton />

  if (error) {
    return (
      <div className="flex items-center gap-2 text-sm text-red-500 py-3">
        <AlertCircle className="w-4 h-4 shrink-0" /> {error}
      </div>
    )
  }

  if (!data) return null

  const { summary, burndown, velocity } = data

  // Format burndown dates for display
  const burndownChart = burndown.map(p => ({ ...p, label: shortDate(p.date) }))

  // Velocity chart — show all sprints including current
  const velocityChart = velocity.map(v => ({ ...v, label: shortSprintName(v.name) }))

  // Avg velocity from completed sprints (excluding current if active)
  const completedVelocity = velocity.filter(v => v.sprintId !== sprintId)
  const avgVelocity = completedVelocity.length > 0
    ? Math.round(completedVelocity.reduce((s, v) => s + v.completed, 0) / completedVelocity.length)
    : null

  // Is the sprint on track? remaining tasks vs ideal
  const lastBurndown = burndown[burndown.length - 1]
  const onTrack = lastBurndown ? lastBurndown.remaining <= lastBurndown.ideal : true

  return (
    <div className="space-y-4 pt-1">
      {/* Summary pills */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
        <StatPill
          icon={<CheckCircle2 className="w-4 h-4" />}
          label="Hechas"
          value={summary.doneTasks}
          color="bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400"
        />
        <StatPill
          icon={<Clock className="w-4 h-4" />}
          label="En Progreso"
          value={summary.inProgress}
          color="bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400"
        />
        <StatPill
          icon={<Eye className="w-4 h-4" />}
          label="Revisión"
          value={summary.review}
          color="bg-violet-50 text-violet-700 dark:bg-violet-900/20 dark:text-violet-400"
        />
        <StatPill
          icon={<ListTodo className="w-4 h-4" />}
          label="Por Hacer"
          value={summary.todo}
          color="bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
        />
        <StatPill
          icon={<Inbox className="w-4 h-4" />}
          label="Backlog"
          value={summary.backlog}
          color="bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
        />
        <StatPill
          icon={<RefreshCw className="w-4 h-4" />}
          label="Carry Over"
          value={summary.carryOver}
          color="bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400"
        />
      </div>

      {/* Days info + on-track badge */}
      <div className="flex items-center gap-3 flex-wrap text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <CalendarDays className="w-3.5 h-3.5" />
          {summary.elapsedDays} de {summary.totalDays} días transcurridos
          {summary.remainingDays > 0 && ` · ${summary.remainingDays} restantes`}
        </span>
        {data.sprint.status === 'active' && (
          <span className={`px-2 py-0.5 rounded-full font-medium ${
            onTrack
              ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
              : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
          }`}>
            {onTrack ? '✓ En ritmo' : '⚠ Por detrás del ideal'}
          </span>
        )}
        {avgVelocity !== null && (
          <span className="flex items-center gap-1">
            <Zap className="w-3.5 h-3.5 text-amber-500" />
            Velocidad promedio: <strong className="text-foreground ml-0.5">{avgVelocity} tareas/sprint</strong>
          </span>
        )}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Burndown */}
        <div className="bg-muted/30 rounded-lg border border-border p-4">
          <div className="flex items-center gap-2 mb-3">
            <TrendingDown className="w-4 h-4 text-blue-500" />
            <span className="text-sm font-medium text-foreground">Burndown Chart</span>
          </div>
          {burndownChart.length < 2 ? (
            <p className="text-xs text-muted-foreground text-center py-8">
              No hay suficientes datos para mostrar el burndown.
            </p>
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={burndownChart} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="burnGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }}
                  tickLine={false}
                  interval="preserveStartEnd"
                />
                <YAxis
                  tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }}
                  tickLine={false}
                  axisLine={false}
                  allowDecimals={false}
                />
                <Tooltip content={<BurndownTooltip />} />
                <Legend
                  formatter={(v) => v === 'remaining' ? 'Restantes' : 'Ideal'}
                  wrapperStyle={{ fontSize: 11 }}
                />
                {/* Ideal line */}
                <Area
                  type="linear"
                  dataKey="ideal"
                  stroke="#94a3b8"
                  strokeDasharray="4 3"
                  strokeWidth={1.5}
                  fill="none"
                  dot={false}
                />
                {/* Actual burndown */}
                <Area
                  type="monotone"
                  dataKey="remaining"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  fill="url(#burnGrad)"
                  dot={{ r: 2, fill: '#3b82f6' }}
                  activeDot={{ r: 4 }}
                />
                {/* Today marker for active sprints */}
                {data.sprint.status === 'active' && burndownChart.length > 0 && (
                  <ReferenceLine
                    x={burndownChart[burndownChart.length - 1].label}
                    stroke="#f59e0b"
                    strokeDasharray="3 3"
                    label={{ value: 'Hoy', position: 'top', fontSize: 9, fill: '#f59e0b' }}
                  />
                )}
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Velocity */}
        <div className="bg-muted/30 rounded-lg border border-border p-4">
          <div className="flex items-center gap-2 mb-3">
            <Zap className="w-4 h-4 text-amber-500" />
            <span className="text-sm font-medium text-foreground">Velocidad por Sprint</span>
          </div>
          {velocityChart.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-8">
              No hay sprints completados para comparar.
            </p>
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={velocityChart} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" vertical={false} />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }}
                  tickLine={false}
                  axisLine={false}
                  allowDecimals={false}
                />
                <Tooltip content={<VelocityTooltip />} />
                <Legend
                  formatter={(v) => v === 'completed' ? 'Completadas' : v === 'total' ? 'Total' : 'Carry Over'}
                  wrapperStyle={{ fontSize: 11 }}
                />
                <Bar dataKey="total" fill="#e2e8f0" radius={[3, 3, 0, 0]} name="total" />
                <Bar dataKey="completed" fill="#22c55e" radius={[3, 3, 0, 0]} name="completed" />
                <Bar dataKey="carryOver" fill="#f59e0b" radius={[3, 3, 0, 0]} name="carryOver" />
                {/* Avg velocity reference line */}
                {avgVelocity !== null && (
                  <ReferenceLine
                    y={avgVelocity}
                    stroke="#6366f1"
                    strokeDasharray="4 3"
                    label={{ value: `Prom. ${avgVelocity}`, position: 'right', fontSize: 9, fill: '#6366f1' }}
                  />
                )}
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  )
}
