'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { GlassPanel } from '@/components/ui/glass-panel'
import { BugDetailDialog } from '@/components/dashboard/projects/BugDetailDialog'
import { useUsers } from '@/hooks/useUsers'
import {
  Bug, ExternalLink, Loader2, RefreshCw, Search, X,
} from 'lucide-react'

interface GlobalBug {
  id: string
  project_id: string
  title: string
  severity: string
  status: string
  created_at: string
  project: { id: string; name: string } | null
  task: { id: string; task_number: number | null; title: string } | null
  assignee: { id: string; full_name: string; avatar_url: string | null } | null
}

interface Member {
  id: string
  full_name: string
  avatar_url: string | null
  roles?: string[]
}

interface BugsTableClientProps {
  currentUserId: string
}

const severityConfig: Record<string, { label: string; color: string }> = {
  low: { label: 'Baja', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
  medium: { label: 'Media', color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' },
  high: { label: 'Alta', color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' },
  critical: { label: 'Crítica', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
}

const statusConfig: Record<string, { label: string; color: string }> = {
  open: { label: 'Abierto', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
  in_progress: { label: 'En Progreso', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  resolved: { label: 'Resuelto', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
  closed: { label: 'Cerrado', color: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400' },
}

function getInitials(name: string | null) {
  if (!name) return '??'
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

function buildProjectMembers(project: {
  pm?: { id: string; full_name: string; avatar_url: string | null } | null
  tech_lead?: { id: string; full_name: string; avatar_url: string | null } | null
  members?: Array<{ user: { id: string; full_name: string; avatar_url: string | null } }>
}): Member[] {
  const map = new Map<string, Member>()

  if (project.pm) {
    map.set(project.pm.id, { ...project.pm, roles: ['pm'] })
  }
  if (project.tech_lead) {
    map.set(project.tech_lead.id, { ...project.tech_lead, roles: ['tech_lead'] })
  }
  project.members?.forEach((member) => {
    map.set(member.user.id, {
      id: member.user.id,
      full_name: member.user.full_name,
      avatar_url: member.user.avatar_url,
      roles: ['developer'],
    })
  })

  return Array.from(map.values())
}

export function BugsTableClient({ currentUserId }: BugsTableClientProps) {
  const { users } = useUsers()
  const allUsers: Member[] = users.map(u => ({
    id: u.id,
    full_name: u.full_name,
    avatar_url: u.avatar_url ?? null,
  }))

  const [bugs, setBugs] = useState<GlobalBug[]>([])
  const [projectOptions, setProjectOptions] = useState<Array<{ id: string; name: string }>>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)

  const [search, setSearch] = useState('')
  const [severityFilter, setSeverityFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [projectFilter, setProjectFilter] = useState('all')
  const [assigneeFilter, setAssigneeFilter] = useState('all')

  const [detailOpen, setDetailOpen] = useState(false)
  const [loadingContext, setLoadingContext] = useState(false)
  const [selectedBug, setSelectedBug] = useState<GlobalBug | null>(null)
  const [dialogMembers, setDialogMembers] = useState<Member[]>([])
  const [dialogSprints, setDialogSprints] = useState<Array<{ id: string; name: string; status: string }>>([])
  const [dialogTasks, setDialogTasks] = useState<Array<{ id: string; task_number: number | null; title: string }>>([])
  const [dialogProjectName, setDialogProjectName] = useState('')

  const fetchBugs = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const params = new URLSearchParams()
      if (severityFilter !== 'all') params.set('severity', severityFilter)
      if (statusFilter !== 'all') params.set('status', statusFilter)
      if (projectFilter !== 'all') params.set('project_id_filter', projectFilter)
      if (assigneeFilter !== 'all') params.set('assignee_id', assigneeFilter)

      const query = params.toString()
      const res = await fetch(`/api/dashboard/bugs${query ? `?${query}` : ''}`)
      const data = await res.json()

      if (!res.ok) throw new Error(data.error || 'Error al cargar bugs')
      setBugs(data.bugs || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar bugs')
    } finally {
      setLoading(false)
    }
  }, [severityFilter, statusFilter, projectFilter, assigneeFilter])

  useEffect(() => {
    fetchBugs()
  }, [fetchBugs, refreshKey])

  useEffect(() => {
    fetch('/api/dashboard/projects')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!data?.projects) return
        setProjectOptions(
          data.projects
            .map((p: { id: string; name: string }) => ({ id: p.id, name: p.name }))
            .sort((a: { name: string }, b: { name: string }) => a.name.localeCompare(b.name))
        )
      })
      .catch(() => setProjectOptions([]))
  }, [])

  const assigneeOptions = useMemo(
    () => allUsers
      .filter((user) => user.full_name)
      .sort((a, b) => a.full_name.localeCompare(b.full_name)),
    [allUsers]
  )

  const filteredBugs = useMemo(() => {
    if (!search.trim()) return bugs
    const term = search.trim().toLowerCase()
    return bugs.filter((bug) =>
      bug.title.toLowerCase().includes(term) ||
      bug.project?.name.toLowerCase().includes(term) ||
      bug.task?.title.toLowerCase().includes(term) ||
      (bug.task?.task_number != null && `#${bug.task.task_number}`.includes(term)) ||
      bug.assignee?.full_name.toLowerCase().includes(term)
    )
  }, [bugs, search])

  const openCount = bugs.filter(b => b.status === 'open').length
  const inProgressCount = bugs.filter(b => b.status === 'in_progress').length
  const criticalCount = bugs.filter(b => b.severity === 'critical' && b.status !== 'closed').length

  const clearFilters = () => {
    setSearch('')
    setSeverityFilter('all')
    setStatusFilter('all')
    setProjectFilter('all')
    setAssigneeFilter('all')
  }

  const hasActiveFilters =
    search !== '' ||
    severityFilter !== 'all' ||
    statusFilter !== 'all' ||
    projectFilter !== 'all' ||
    assigneeFilter !== 'all'

  const pillClass = (selected: boolean) =>
    `px-3.5 py-1.5 rounded-full text-[13px] font-medium whitespace-nowrap transition-colors ${
      selected
        ? 'bg-primary text-primary-foreground shadow-[0_6px_16px_rgba(37,99,235,0.28)]'
        : 'text-muted-foreground hover:bg-black/5 dark:hover:bg-white/8 hover:text-foreground'
    }`

  const openBugDetail = async (bug: GlobalBug) => {
    setSelectedBug(bug)
    setLoadingContext(true)
    setDetailOpen(true)

    try {
      const res = await fetch(`/api/dashboard/projects/${bug.project_id}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error al cargar proyecto')

      const project = data.project
      setDialogProjectName(project.name)
      setDialogMembers(buildProjectMembers(project))
      setDialogSprints(
        (project.sprints || []).map((s: { id: string; name: string; status: string }) => ({
          id: s.id,
          name: s.name,
          status: s.status,
        }))
      )
      setDialogTasks(
        (project.tasks || []).map((t: { id: string; task_number: number | null; title: string }) => ({
          id: t.id,
          task_number: t.task_number,
          title: t.title,
        }))
      )
    } catch (err) {
      console.error('Error loading project context:', err)
      setDialogProjectName(bug.project?.name || '')
      setDialogMembers([])
      setDialogSprints([])
      setDialogTasks([])
    } finally {
      setLoadingContext(false)
    }
  }

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString('es-CL', { day: '2-digit', month: 'short', year: 'numeric' })

  if (error && bugs.length === 0 && !loading) {
    return (
      <div className="space-y-5">
        <h1 className="text-[28px] font-semibold tracking-tight text-foreground leading-tight">Triage de bugs</h1>
        <GlassPanel>
          <p className="text-[14px] text-red-600 dark:text-red-400">{error}</p>
        </GlassPanel>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-[28px] font-semibold tracking-tight text-foreground leading-tight">Triage de bugs</h1>
          <p className="text-[15px] text-muted-foreground mt-1">
            Prioriza incidencias cross-proyecto sin entrar proyecto por proyecto
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => setRefreshKey(k => k + 1)} disabled={loading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Actualizar
        </Button>
      </div>

      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        <GlassPanel padding={2.25}>
          <p className="text-[12px] font-medium text-muted-foreground tracking-tight">Total</p>
          {loading ? <Skeleton className="h-7 w-10 mt-2" /> : (
            <p className="text-[28px] font-semibold tracking-tight leading-none mt-2" style={{ color: '#0A84FF' }}>{bugs.length}</p>
          )}
        </GlassPanel>
        <GlassPanel padding={2.25}>
          <p className="text-[12px] font-medium text-muted-foreground tracking-tight">Abiertos</p>
          {loading ? <Skeleton className="h-7 w-10 mt-2" /> : (
            <p className="text-[28px] font-semibold tracking-tight leading-none mt-2" style={{ color: '#FF453A' }}>{openCount}</p>
          )}
        </GlassPanel>
        <GlassPanel padding={2.25}>
          <p className="text-[12px] font-medium text-muted-foreground tracking-tight">En progreso</p>
          {loading ? <Skeleton className="h-7 w-10 mt-2" /> : (
            <p className="text-[28px] font-semibold tracking-tight leading-none mt-2" style={{ color: '#FF9F0A' }}>{inProgressCount}</p>
          )}
        </GlassPanel>
        <GlassPanel padding={2.25}>
          <p className="text-[12px] font-medium text-muted-foreground tracking-tight">Críticos activos</p>
          {loading ? <Skeleton className="h-7 w-10 mt-2" /> : (
            <p className="text-[28px] font-semibold tracking-tight leading-none mt-2" style={{ color: '#BF5AF2' }}>{criticalCount}</p>
          )}
        </GlassPanel>
      </div>

      <GlassPanel padding={2.5} className="space-y-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por título, proyecto, tarea o asignado…"
              className="pl-9"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <Select value={projectFilter} onValueChange={setProjectFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Proyecto" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los proyectos</SelectItem>
                {projectOptions.map((project) => (
                  <SelectItem key={project.id} value={project.id}>{project.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={assigneeFilter} onValueChange={setAssigneeFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Asignado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los asignados</SelectItem>
                <SelectItem value="unassigned">Sin asignar</SelectItem>
                {assigneeOptions.map((assignee) => (
                  <SelectItem key={assignee.id} value={assignee.id}>{assignee.full_name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                <X className="w-4 h-4 mr-1" />
                Limpiar
              </Button>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <button type="button" className={pillClass(severityFilter === 'all')} onClick={() => setSeverityFilter('all')}>
            Todas las severidades
          </button>
          {Object.entries(severityConfig).map(([value, cfg]) => (
            <button
              key={value}
              type="button"
              className={pillClass(severityFilter === value)}
              onClick={() => setSeverityFilter(value)}
            >
              {cfg.label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-2">
          <button type="button" className={pillClass(statusFilter === 'all')} onClick={() => setStatusFilter('all')}>
            Todos los estados
          </button>
          {Object.entries(statusConfig).map(([value, cfg]) => (
            <button
              key={value}
              type="button"
              className={pillClass(statusFilter === value)}
              onClick={() => setStatusFilter(value)}
            >
              {cfg.label}
            </button>
          ))}
        </div>
      </GlassPanel>

      <GlassPanel padding={0} className="overflow-hidden">
        {loading ? (
          <div className="divide-y divide-border">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center gap-4 p-4">
                <Skeleton className="h-5 w-16 rounded-full" />
                <Skeleton className="h-5 w-20 rounded-full" />
                <Skeleton className="h-4 flex-1" />
                <Skeleton className="h-4 w-24" />
              </div>
            ))}
          </div>
        ) : filteredBugs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-3">
              <Bug className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <p className="text-muted-foreground">No hay bugs que coincidan con los filtros</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30 text-left text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  <th className="px-4 py-3">Severidad</th>
                  <th className="px-4 py-3">Estado</th>
                  <th className="px-4 py-3">Título</th>
                  <th className="px-4 py-3 hidden md:table-cell">Proyecto</th>
                  <th className="px-4 py-3 hidden lg:table-cell">Tarea</th>
                  <th className="px-4 py-3 hidden sm:table-cell">Asignado</th>
                  <th className="px-4 py-3 hidden lg:table-cell">Fecha</th>
                  <th className="px-4 py-3 w-10" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredBugs.map((bug) => {
                  const sev = severityConfig[bug.severity] ?? severityConfig.medium
                  const sta = statusConfig[bug.status] ?? statusConfig.open

                  return (
                    <tr
                      key={bug.id}
                      className="hover:bg-muted/30 transition-colors cursor-pointer"
                      onClick={() => openBugDetail(bug)}
                    >
                      <td className="px-4 py-3">
                        <span className={`text-[11px] font-semibold rounded-full px-2.5 py-0.5 ${sev.color}`}>
                          {sev.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-[11px] font-semibold rounded-full px-2.5 py-0.5 ${sta.color}`}>
                          {sta.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-medium text-foreground max-w-[280px]">
                        <span className="line-clamp-2">{bug.title}</span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">
                        {bug.project?.name || '—'}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground hidden lg:table-cell">
                        {bug.task
                          ? `${bug.task.task_number != null ? `#${bug.task.task_number} ` : ''}${bug.task.title}`
                          : '—'}
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell">
                        {bug.assignee ? (
                          <div className="flex items-center gap-2">
                            <Avatar className="w-6 h-6">
                              <AvatarImage src={bug.assignee.avatar_url || undefined} />
                              <AvatarFallback className="text-[10px] bg-muted">
                                {getInitials(bug.assignee.full_name)}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-muted-foreground truncate max-w-[120px]">
                              {bug.assignee.full_name}
                            </span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground italic">Sin asignar</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground hidden lg:table-cell whitespace-nowrap">
                        {formatDate(bug.created_at)}
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          href={`/projects/${bug.project_id}?tab=bugs&bug=${bug.id}`}
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
                          title="Ir al proyecto"
                          aria-label="Ir al proyecto"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </GlassPanel>

      {selectedBug && (
        <>
          {loadingContext && detailOpen && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center pointer-events-none">
              <div className="flex items-center gap-2 rounded-xl bg-background/90 border border-border px-4 py-2 shadow-lg">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm text-muted-foreground">Cargando contexto del proyecto…</span>
              </div>
            </div>
          )}
          <BugDetailDialog
            bugId={selectedBug.id}
            projectId={selectedBug.project_id}
            projectName={dialogProjectName || selectedBug.project?.name || ''}
            open={detailOpen}
            onOpenChange={(open) => {
              setDetailOpen(open)
              if (!open) setSelectedBug(null)
            }}
            members={dialogMembers}
            allUsers={allUsers}
            currentUserId={currentUserId}
            sprints={dialogSprints}
            tasks={dialogTasks}
            onUpdate={() => setRefreshKey(k => k + 1)}
          />
        </>
      )}
    </div>
  )
}
