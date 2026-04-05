'use client'

import { useState, useEffect, useMemo } from 'react'
import useSWR from 'swr'
import Link from 'next/link'
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
import { Search, FolderKanban, ChevronLeft, ChevronRight, X } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { CreateProjectDialog } from './CreateProjectDialog'
import { DeleteProjectDialog } from './DeleteProjectDialog'
import { useCurrentUser } from '@/hooks/useCurrentUser'

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
  planning: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
  in_progress: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800',
  paused: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800',
  completed: 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800',
  cancelled: 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800',
}

export function ProjectsTableClient() {
  const router = useRouter()
  const { data: projectsData, error: projectsError, isLoading: loading, mutate: mutateProjects } = useSWR<{ projects: Project[] }>('/api/dashboard/projects')
  const { currentUserRole } = useCurrentUser()

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

  const formatDate = (date: string | null) => {
    if (!date) return '-'
    return new Date(date).toLocaleDateString('es-CL', { day: '2-digit', month: 'short', year: 'numeric' })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Proyectos</h1>
          <p className="text-muted-foreground">Gestiona los proyectos del sistema</p>
        </div>
        {['admin', 'pm'].includes(currentUserRole) && (
          <CreateProjectDialog onProjectCreated={mutateProjects} />
        )}
      </div>

      <div className="space-y-4">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre o empresa..."
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
                  <TableHead><Skeleton className="h-4 w-24" /></TableHead>
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
                          <Skeleton className="h-4 w-32" />
                          <Skeleton className="h-3 w-48" />
                        </div>
                      </div>
                    </TableCell>
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
                    <TableHead>Proyecto</TableHead>
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
                      <TableCell colSpan={currentUserRole === 'admin' ? 6 : 5} className="text-center py-8 text-muted-foreground">
                        {hasActiveFilters ? 'No se encontraron proyectos' : 'No hay proyectos registrados'}
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedProjects.map((project) => (
                      <TableRow 
                        key={project.id} 
                        className="hover:bg-muted/50 cursor-pointer"
                        onClick={() => router.push(`/projects/${project.id}`)}
                      >
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                              <FolderKanban className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div>
                              <p className="font-medium text-foreground">{project.name}</p>
                              {project.description && (
                                <p className="text-sm text-muted-foreground truncate max-w-[200px]">{project.description}</p>
                              )}
                            </div>
                          </div>
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
                            <div 
                              className="flex items-center justify-end gap-1"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <DeleteProjectDialog
                                projectId={project.id}
                                projectName={project.name}
                                onDeleted={mutateProjects}
                                triggerVariant="icon"
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
                  <SelectTrigger className="w-[70px] h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5</SelectItem>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="20">20</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                  </SelectContent>
                </Select>
                <span>de {filteredProjects.length} proyectos</span>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="text-sm text-muted-foreground min-w-[100px] text-center">
                  Página {currentPage} de {totalPages || 1}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage >= totalPages}
                >
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
