'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { CreateChangeControlDialog } from './CreateChangeControlDialog'
import { DeleteProjectDialog } from '@/components/dashboard/projects/DeleteProjectDialog'
import { WorkCatalog } from '@/components/dashboard/catalog/WorkCatalog'

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

function formatDate(date: string | null) {
  if (!date) return 'Sin fecha'
  return new Date(date).toLocaleDateString('es-CL', { day: 'numeric', month: 'short', year: 'numeric' })
}

export function ChangeControlsTableClient() {
  const router = useRouter()
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentUserRole, setCurrentUserRole] = useState('')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(12)

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

  useEffect(() => {
    fetchProjects()
    fetch('/api/dashboard/me')
      .then((response) => response.json())
      .then((data) => {
        const roleData = data.user?.role as { name: string } | { name: string }[] | null
        const roleName = Array.isArray(roleData) ? roleData[0]?.name : roleData?.name
        setCurrentUserRole(roleName || '')
      })
      .catch((err) => console.error('Error fetching current user:', err))
  }, [])

  const filteredProjects = useMemo(() => {
    return projects.filter((project) => {
      const matchesSearch = search === '' ||
        project.name.toLowerCase().includes(search.toLowerCase()) ||
        project.company?.name.toLowerCase().includes(search.toLowerCase()) ||
        project.parent_project?.name.toLowerCase().includes(search.toLowerCase())
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
      title="Control de cambios"
      subtitle="Cambios sobre proyectos que ya terminaron."
      action={['admin', 'pm'].includes(currentUserRole) ? (
        <CreateChangeControlDialog onCreated={fetchProjects} />
      ) : undefined}
      items={paginatedProjects.map((project) => ({
        id: project.id,
        name: project.name,
        status: project.status,
        meta: [project.parent_project?.name, project.company?.name, project.pm?.full_name].filter(Boolean).join(' · ') || 'Sin proyecto origen',
        dates: `${formatDate(project.start_date)} — ${formatDate(project.end_date)}`,
        actions: currentUserRole === 'admin' ? (
          <DeleteProjectDialog
            projectId={project.id}
            projectName={project.name}
            onDeleted={fetchProjects}
            triggerVariant="icon"
            entityType="change_control"
          />
        ) : undefined,
      }))}
      total={filteredProjects.length}
      counts={counts}
      loading={loading}
      error={error}
      search={search}
      onSearch={setSearch}
      searchPlaceholder="Buscar por nombre, empresa o proyecto origen"
      statusFilter={statusFilter}
      onStatus={setStatusFilter}
      onClear={() => { setSearch(''); setStatusFilter('all') }}
      page={currentPage}
      pageSize={pageSize}
      onPage={setCurrentPage}
      onPageSize={setPageSize}
      emptyMessage="No hay controles de cambios registrados"
      filteredEmptyMessage="No se encontraron controles de cambios"
      onOpen={(id) => router.push(`/change-controls/${id}`)}
    />
  )
}
