'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Search, GitPullRequest, ChevronLeft, ChevronRight, X, GitMerge } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { CreateChangeControlDialog } from './CreateChangeControlDialog'
import { DeleteProjectDialog } from '@/components/dashboard/projects/DeleteProjectDialog'

interface Project {
  id: string
  name: string
  description: string | null
  status: string
  start_date: string | null
  end_date: string | null
  created_at: string
  type: string
  parent_project: { id: string; name: string } | null
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
  planning: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
  in_progress: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800',
  paused: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800',
  completed: 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800',
  cancelled: 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800',
}

export function ChangeControlsTableClient() {
  const router = useRouter()
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentUserRole, setCurrentUserRole] = useState<string>('')

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const fetchProjects = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/dashboard/projects?type=change_control')
      if (!response.ok) {
        const text = await response.text()
        throw new Error(text.startsWith('<') ? `Error ${response.status}` : text)
      }
      const data = await response.json()
      setProjects(data.projects)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar controles de cambios')
    } finally {
      setLoading(false)
    }
  }

  const fetchCurrentUser = async () => {
    try {
      const response = await fetch('/api/dashboard/me')
      const data = await response.json()
      if (response.ok && data.user) {
        const roleData = data.user.role as { name: string } | { name: string }[] | null
        const roleName = Array.isArray(roleData) ? roleData[0]?.name : roleData?.name
        setCurrentUserRole(roleName || '')
      }
    } catch (err) {
      console.error('Error fetching current user:', err)
    }
  }

  useEffect(() => {
    fetchProjects()
    fetchCurrentUser()
  }, [])

  const filteredProjects = useMemo(() => {
    return projects.filter(p => {
      const matchesSearch = search === '' ||
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.company?.name.toLowerCase().includes(search.toLowerCase()) ||
        p.parent_project?.name.toLowerCase().includes(search.toLowerCase())
      const matchesStatus = statusFilter === 'all' || p.status === statusFilter
      return matchesSearch && matchesStatus
    })
  }, [projects, search, statusFilter])

  const totalPages = Math.ceil(filteredProjects.length / pageSize)
  const paginatedProjects = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return filteredProjects.slice(start, start + pageSize)
  }, [filteredProjects, currentPage, pageSize])

  useEffect(() => { setCurrentPage(1) }, [search, statusFilter, pageSize])

  const clearFilters = () => { setSearch(''); setStatusFilter('all') }
  const hasActiveFilters = search !== '' || statusFilter !== 'all'

  const formatDate = (date: string | null) => {
    if (!date) return '-'
    return new Date(date).toLocaleDateString('es-CL', { day: '2-digit', month: 'short', year: 'numeric' })
  }

  return (
    <div className="space-y-6 pt-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <GitMerge className="w-6 h-6 text-primary flex-shrink-0" />
          <div>
            <h1 className="text-2xl font-bold text-foreground">Control de Cambios</h1>
            <p className="text-sm text-muted-foreground">Gestiona cambios para proyectos finalizados</p>
          </div>
        </div>
        {['admin', 'pm'].includes(currentUserRole) && (
          <CreateChangeControlDialog onCreated={fetchProjects} />
        )}
      </div>

      <div className="space-y-4">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre, empresa o proyecto origen..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Filtrar por estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los estados</SelectItem>
              <SelectItem value="planning">Planificación</SelectItem>
              <SelectItem value="in_progress">En Progreso</SelectItem>
              <SelectItem value="paused">Pausado</SelectItem>
              <SelectItem value="completed">Completado</SelectItem>
              <SelectItem value="cancelled">Cancelado</SelectItem>
            </SelectContent>
          </Select>

          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters} className="text-muted-foreground">
              <X className="w-4 h-4 mr-1" /> Limpiar
            </Button>
          )}
        </div>

        {loading ? (
          <div className="rounded-lg border bg-card">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead><Skeleton className="h-4 w-36" /></TableHead>
                  <TableHead><Skeleton className="h-4 w-28" /></TableHead>
                  <TableHead><Skeleton className="h-4 w-20" /></TableHead>
                  <TableHead><Skeleton className="h-4 w-16" /></TableHead>
                  <TableHead><Skeleton className="h-4 w-16" /></TableHead>
                  <TableHead><Skeleton className="h-4 w-24" /></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[1, 2, 3, 4, 5].map((i) => (
                  <TableRow key={i}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Skeleton className="w-9 h-9 rounded-lg flex-shrink-0" />
                        <div className="space-y-1.5">
                          <Skeleton className="h-4 w-40" />
                          <Skeleton className="h-3 w-56" />
                        </div>
                      </div>
                    </TableCell>
                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-20 rounded-full" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : error ? (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-lg">{error}</div>
        ) : (
          <>
            <div className="rounded-lg border bg-card">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>Control de Cambio</TableHead>
                    <TableHead>Proyecto Origen</TableHead>
                    <TableHead>Empresa</TableHead>
                    <TableHead>PM</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Fechas</TableHead>
                    {currentUserRole === 'admin' && (
                      <TableHead className="text-right">Acciones</TableHead>
                    )}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedProjects.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={currentUserRole === 'admin' ? 7 : 6} className="text-center py-8 text-muted-foreground">
                        {hasActiveFilters ? 'No se encontraron controles de cambios' : 'No hay controles de cambios registrados'}
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedProjects.map((project) => (
                      <TableRow
                        key={project.id}
                        className="hover:bg-muted/50 cursor-pointer"
                        onClick={() => router.push(`/change-controls/${project.id}`)}
                      >
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                              <GitPullRequest className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                            </div>
                            <div>
                              <p className="font-medium text-foreground">{project.name}</p>
                              {project.description && (
                                <p className="text-sm text-muted-foreground truncate max-w-[200px]">{project.description}</p>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {project.parent_project ? (
                            <span className="text-sm text-muted-foreground">{project.parent_project.name}</span>
                          ) : (
                            <span className="text-sm text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-muted-foreground">{project.company?.name || '-'}</TableCell>
                        <TableCell className="text-muted-foreground">{project.pm?.full_name || '-'}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={statusColors[project.status]}>
                            {statusLabels[project.status]}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatDate(project.start_date)} - {formatDate(project.end_date)}
                        </TableCell>
                        {currentUserRole === 'admin' && (
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                              <DeleteProjectDialog
                                projectId={project.id}
                                projectName={project.name}
                                onDeleted={fetchProjects}
                                triggerVariant="icon"
                                entityType="change_control"
                              />
                            </div>
                          </TableCell>
                        )}
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>Mostrar</span>
                <Select value={pageSize.toString()} onValueChange={(v) => setPageSize(Number(v))}>
                  <SelectTrigger className="w-[70px] h-8"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5</SelectItem>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="20">20</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                  </SelectContent>
                </Select>
                <span>de {filteredProjects.length} controles de cambios</span>
              </div>

              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="text-sm text-muted-foreground min-w-[100px] text-center">
                  Página {currentPage} de {totalPages || 1}
                </span>
                <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage >= totalPages}>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
