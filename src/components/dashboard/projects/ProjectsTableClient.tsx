'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import useSWR from 'swr'
import { useRouter } from 'next/navigation'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Search, ChevronLeft, ChevronRight, X } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { CreateProjectDialog } from './CreateProjectDialog'
import { DeleteProjectDialog } from './DeleteProjectDialog'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import { GlassPanel } from '@/components/ui/glass-panel'

interface Project {
  id: string
  name: string
  description: string | null
  status: string
  start_date: string | null
  end_date: string | null
  created_at: string
  company: { id: string; name: string } | null
  pm: { id: string; full_name: string; email: string } | null
  tech_lead: { id: string; full_name: string; email: string } | null
  members: Array<{ id: string; role: string; user: { id: string; full_name: string } }>
}

const statusLabels: Record<string, string> = {
  planning: 'Planificación',
  in_progress: 'En Progreso',
  paused: 'Pausado',
  completed: 'Completado',
  cancelled: 'Cancelado',
}

const statusColors: Record<string, string> = {
  planning: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  in_progress: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  paused: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  completed: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  cancelled: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
}

const statusFilters = [
  { value: 'all', label: 'Todos' },
  { value: 'planning', label: 'Planificación' },
  { value: 'in_progress', label: 'En Progreso' },
  { value: 'paused', label: 'Pausado' },
  { value: 'completed', label: 'Completado' },
  { value: 'cancelled', label: 'Cancelado' },
]

export function ProjectsTableClient() {
  const router = useRouter()
  const { data: projectsData, error: projectsError, isLoading: loading, mutate: mutateProjects } = useSWR<{ projects: Project[] }>('/api/dashboard/projects')
  const { currentUserRole } = useCurrentUser()

  // Prefetch del detalle de proyecto al hacer hover
  const handleProjectHover = useCallback((projectId: string) => {
    router.prefetch(`/projects/${projectId}`)
  }, [router])

  const projects = projectsData?.projects ?? []
  const error = projectsError?.message ?? null

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const filteredProjects = useMemo(() => {
    return projects.filter(p => {
      const matchesSearch = search === '' ||
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.company?.name.toLowerCase().includes(search.toLowerCase())

      const matchesStatus = statusFilter === 'all' || p.status === statusFilter

      return matchesSearch && matchesStatus
    })
  }, [projects, search, statusFilter])

  const totalPages = Math.ceil(filteredProjects.length / pageSize)
  const paginatedProjects = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return filteredProjects.slice(start, start + pageSize)
  }, [filteredProjects, currentPage, pageSize])

  useEffect(() => {
    setCurrentPage(1)
  }, [search, statusFilter, pageSize])

  const clearFilters = () => {
    setSearch('')
    setStatusFilter('all')
  }

  const hasActiveFilters = search !== '' || statusFilter !== 'all'

  const stats = useMemo(() => {
    const count = (status: string) => projects.filter(p => p.status === status).length
    return [
      { title: 'En progreso', value: count('in_progress'), accent: '#0A84FF' },
      { title: 'Planificación', value: count('planning'), accent: '#8E8E93' },
      { title: 'Pausados', value: count('paused'), accent: '#FF9F0A' },
      { title: 'Completados', value: count('completed'), accent: '#30D158' },
    ]
  }, [projects])

  const formatDate = (date: string | null) => {
    if (!date) return '-'
    return new Date(date).toLocaleDateString('es-CL', { day: '2-digit', month: 'short', year: 'numeric' })
  }

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-[28px] font-semibold tracking-tight text-foreground leading-tight">Proyectos</h1>
          <p className="text-[15px] text-muted-foreground mt-1">Gestiona los proyectos y su estado</p>
        </div>
        {['admin', 'pm'].includes(currentUserRole) && (
          <CreateProjectDialog onProjectCreated={mutateProjects} />
        )}
      </div>

      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <GlassPanel key={stat.title} padding={2.25}>
            <p className="text-[12px] font-medium text-muted-foreground tracking-tight">{stat.title}</p>
            {loading ? (
              <Skeleton className="h-7 w-10 mt-2" />
            ) : (
              <p
                className="text-[28px] font-semibold tracking-tight leading-none mt-2"
                style={{ color: stat.accent }}
              >
                {stat.value}
              </p>
            )}
          </GlassPanel>
        ))}
      </div>

      <GlassPanel padding={1} sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground z-10" />
          <Input
            placeholder="Buscar por nombre o empresa..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="flex items-center gap-1 flex-wrap">
          {statusFilters.map((filter) => {
            const selected = statusFilter === filter.value
            return (
              <button
                type="button"
                key={filter.value}
                onClick={() => setStatusFilter(filter.value)}
                className={`px-3.5 py-1.5 rounded-full text-[13px] font-medium whitespace-nowrap transition-colors ${
                  selected
                    ? 'bg-primary text-primary-foreground shadow-[0_6px_16px_rgba(37,99,235,0.28)]'
                    : 'text-muted-foreground hover:bg-black/5 dark:hover:bg-white/8 hover:text-foreground'
                }`}
              >
                {filter.label}
              </button>
            )
          })}
        </div>

        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters} className="text-muted-foreground rounded-full ml-auto">
            <X className="w-4 h-4" /> Limpiar
          </Button>
        )}
      </GlassPanel>

      {error ? (
        <GlassPanel>
          <p className="text-[14px] text-red-600 dark:text-red-400">{error}</p>
        </GlassPanel>
      ) : (
        <GlassPanel padding={2.25}>
          {loading ? (
            <div className="space-y-1">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center gap-3 rounded-2xl px-3 py-3">
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-3 w-56" />
                  </div>
                  <Skeleton className="h-5 w-20 rounded-full" />
                  <Skeleton className="h-3 w-32 hidden sm:block" />
                </div>
              ))}
            </div>
          ) : paginatedProjects.length === 0 ? (
            <p className="text-[14px] text-muted-foreground text-center py-12">
              {hasActiveFilters ? 'No se encontraron proyectos' : 'No hay proyectos registrados'}
            </p>
          ) : (
            <div className="space-y-0.5">
              {paginatedProjects.map((project) => (
                <div
                  key={project.id}
                  onClick={() => router.push(`/projects/${project.id}`)}
                  className="flex items-center gap-3 rounded-2xl px-3 py-3 hover:bg-black/[0.04] dark:hover:bg-white/[0.06] cursor-pointer transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-[14px] font-medium text-foreground truncate">{project.name}</p>
                    <p className="text-[12px] text-muted-foreground truncate mt-0.5">
                      {[project.company?.name, project.pm?.full_name].filter(Boolean).join(' · ') || 'Sin empresa'}
                    </p>
                  </div>
                  <span className={`text-[11px] font-semibold rounded-full px-2.5 py-0.5 flex-shrink-0 ${statusColors[project.status]}`}>
                    {statusLabels[project.status]}
                  </span>
                  <span className="hidden md:block text-[12px] text-muted-foreground flex-shrink-0 w-[180px] text-right">
                    {formatDate(project.start_date)} — {formatDate(project.end_date)}
                  </span>
                  {currentUserRole === 'admin' && (
                    <div
                      className="flex-shrink-0"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <DeleteProjectDialog
                        projectId={project.id}
                        projectName={project.name}
                        onDeleted={mutateProjects}
                        triggerVariant="icon"
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {!loading && filteredProjects.length > 0 && (
            <div className="flex items-center justify-between gap-3 pt-4 mt-2">
              <div className="flex items-center gap-2 text-[13px] text-muted-foreground">
                <span>Mostrar</span>
                <Select value={pageSize.toString()} onValueChange={(v) => setPageSize(Number(v))}>
                  <SelectTrigger className="w-[72px] h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5</SelectItem>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="20">20</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                  </SelectContent>
                </Select>
                <span>de {filteredProjects.length}</span>
              </div>

              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-full"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="text-[13px] text-muted-foreground min-w-[88px] text-center">
                  {currentPage} / {totalPages || 1}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-full"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage >= totalPages}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </GlassPanel>
      )}
    </div>
  )
}
