'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import useSWR from 'swr'
import { useRouter } from 'next/navigation'
import { CreateProjectDialog } from './CreateProjectDialog'
import { DeleteProjectDialog } from './DeleteProjectDialog'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import { WorkCatalog } from '@/components/dashboard/catalog/WorkCatalog'

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

function formatDate(date: string | null) {
  if (!date) return 'Sin fecha'
  return new Date(date).toLocaleDateString('es-CL', { day: 'numeric', month: 'short', year: 'numeric' })
}

export function ProjectsTableClient() {
  const router = useRouter()
  const { data: projectsData, error: projectsError, isLoading: loading, mutate: mutateProjects } = useSWR<{ projects: Project[] }>('/api/dashboard/projects')
  const { currentUserRole } = useCurrentUser()
  const projects = projectsData?.projects ?? []
  const error = projectsError?.message ?? null

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(12)

  const handleProjectHover = useCallback((projectId: string) => {
    router.prefetch(`/projects/${projectId}`)
  }, [router])

  const filteredProjects = useMemo(() => {
    return projects.filter((project) => {
      const matchesSearch = search === '' ||
        project.name.toLowerCase().includes(search.toLowerCase()) ||
        project.company?.name.toLowerCase().includes(search.toLowerCase())
      return matchesSearch && (statusFilter === 'all' || project.status === statusFilter)
    })
  }, [projects, search, statusFilter])

  const paginatedProjects = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return filteredProjects.slice(start, start + pageSize)
  }, [filteredProjects, currentPage, pageSize])

  useEffect(() => {
    setCurrentPage(1)
  }, [search, statusFilter, pageSize])

  const counts = useMemo(() => {
    const next: Record<string, number> = {}
    for (const project of projects) next[project.status] = (next[project.status] || 0) + 1
    return next
  }, [projects])

  return (
    <WorkCatalog
      title="Proyectos"
      subtitle="El estado de cada proyecto, la empresa y quién lo lleva."
      action={['admin', 'pm'].includes(currentUserRole) ? (
        <CreateProjectDialog onProjectCreated={mutateProjects} />
      ) : undefined}
      items={paginatedProjects.map((project) => ({
        id: project.id,
        name: project.name,
        status: project.status,
        meta: [project.company?.name, project.pm?.full_name].filter(Boolean).join(' · ') || 'Sin empresa',
        dates: `${formatDate(project.start_date)} — ${formatDate(project.end_date)}`,
        actions: currentUserRole === 'admin' ? (
          <DeleteProjectDialog
            projectId={project.id}
            projectName={project.name}
            onDeleted={mutateProjects}
            triggerVariant="icon"
          />
        ) : undefined,
      }))}
      total={filteredProjects.length}
      counts={counts}
      loading={loading}
      error={error}
      search={search}
      onSearch={setSearch}
      searchPlaceholder="Buscar por nombre o empresa"
      statusFilter={statusFilter}
      onStatus={setStatusFilter}
      onClear={() => { setSearch(''); setStatusFilter('all') }}
      page={currentPage}
      pageSize={pageSize}
      onPage={setCurrentPage}
      onPageSize={setPageSize}
      emptyMessage="No hay proyectos registrados"
      filteredEmptyMessage="No se encontraron proyectos"
      onOpen={(id) => router.push(`/projects/${id}`)}
      onHover={handleProjectHover}
    />
  )
}
