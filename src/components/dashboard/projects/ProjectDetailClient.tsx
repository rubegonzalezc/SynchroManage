'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Loader2, ArrowLeft, Users, Calendar, Building2, Mail, CheckCircle2, Clock, FolderKanban, GitPullRequest, LayoutGrid, List } from 'lucide-react'
import { KanbanBoard } from './KanbanBoard'
import { TaskListView } from './TaskListView'
import { TaskFilters } from './TaskFilters'
import { CreateTaskDialog } from './CreateTaskDialog'
import { ProjectComments } from './ProjectComments'
import { ProjectActivity } from './ProjectActivity'
import { EditProjectDialog } from './EditProjectDialog'
import { DeleteProjectDialog } from './DeleteProjectDialog'
import { StakeholderComments } from './StakeholderComments'
import { StakeholderMessagesForPM } from './StakeholderMessagesForPM'
import { FileAttachments } from '@/components/ui/file-attachments'
import { CreateChangeControlDialog } from '@/components/dashboard/change-controls/CreateChangeControlDialog'
import { PendingTasksWithCCDialog, PendingTasksNoCCDialog, CreateCCPromptDialog } from './PendingTasksDialog'

interface Project {
  id: string
  name: string
  description: string | null
  status: string
  start_date: string | null
  end_date: string | null
  type?: string
  parent_project?: { id: string; name: string } | null
  company: { id: string; name: string } | null
  pm: { id: string; full_name: string; email: string; avatar_url: string | null } | null
  tech_lead: { id: string; full_name: string; email: string; avatar_url: string | null } | null
  members: Array<{
    id: string
    role: string
    user: { id: string; full_name: string; email: string; avatar_url: string | null; role: { name: string } | null }
  }>
  tasks: Task[]
}

interface Task {
  id: string
  task_number: number | null
  title: string
  description: string | null
  status: string
  priority: string
  category?: string
  position: number
  due_date: string | null
  assignees: { id: string; full_name: string; avatar_url: string | null }[]
  assignee?: { id: string; full_name: string; avatar_url: string | null } | null
}

interface User {
  id: string
  full_name: string
  avatar_url: string | null
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

export function ProjectDetailClient({ projectId, backHref = '/projects', backLabel = 'Volver a proyectos' }: { projectId: string; backHref?: string; backLabel?: string }) {
  const [project, setProject] = useState<Project | null>(null)
  const [allUsers, setAllUsers] = useState<User[]>([])
  const [currentUserId, setCurrentUserId] = useState<string>('')
  const [currentUserRole, setCurrentUserRole] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Post-completion flow state
  const [pendingTaskIds, setPendingTaskIds] = useState<string[]>([])
  const [createCCPrompt, setCreateCCPrompt] = useState(false)
  const [pendingTasksWithCC, setPendingTasksWithCC] = useState(false)
  const [pendingTasksNoCC, setPendingTasksNoCC] = useState(false)
  const [migrateTasks, setMigrateTasks] = useState(false)
  const [showCCDialog, setShowCCDialog] = useState(false)

  // View mode and filters
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban')
  const [taskSearch, setTaskSearch] = useState('')
  const [priorityFilter, setPriorityFilter] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [assigneeFilter, setAssigneeFilter] = useState('all')

  const fetchProject = async () => {
    try {
      const response = await fetch(`/api/dashboard/projects/${projectId}`)
      const data = await response.json()
      if (!response.ok) throw new Error(data.error)
      setProject(data.project)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar proyecto')
    } finally {
      setLoading(false)
    }
  }

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/dashboard/users')
      const data = await response.json()
      if (response.ok) {
        setAllUsers(data.users.map((u: { id: string; full_name: string; avatar_url: string | null }) => ({
          id: u.id,
          full_name: u.full_name,
          avatar_url: u.avatar_url
        })))
      }
    } catch (err) {
      console.error('Error fetching users:', err)
    }
  }

  const fetchCurrentUser = async () => {
    try {
      const response = await fetch('/api/dashboard/me')
      const data = await response.json()
      if (response.ok && data.user) {
        setCurrentUserId(data.user.id)
        // Obtener el rol del usuario
        const roleData = data.user.role as { name: string } | { name: string }[] | null
        const roleName = Array.isArray(roleData) ? roleData[0]?.name : roleData?.name
        setCurrentUserRole(roleName || '')
      }
    } catch (err) {
      console.error('Error fetching current user:', err)
    }
  }

  useEffect(() => { 
    fetchProject()
    fetchUsers()
    fetchCurrentUser()
  }, [projectId])

  // Filtrar tareas según los filtros activos
  const filteredTasks = useMemo(() => {
    if (!project) return []
    return project.tasks.map(t => ({
      ...t,
      assignees: t.assignees?.length ? t.assignees : t.assignee ? [t.assignee] : [],
    })).filter(task => {
      const matchesSearch = taskSearch === '' ||
        task.title.toLowerCase().includes(taskSearch.toLowerCase()) ||
        (task.description?.toLowerCase().includes(taskSearch.toLowerCase())) ||
        `#${task.task_number}`.includes(taskSearch)
      const matchesPriority = priorityFilter === 'all' || task.priority === priorityFilter
      const matchesCategory = categoryFilter === 'all' || task.category === categoryFilter
      const matchesAssignee = assigneeFilter === 'all' ||
        (assigneeFilter === 'unassigned' && task.assignees.length === 0) ||
        task.assignees.some(a => a.id === assigneeFilter)
      return matchesSearch && matchesPriority && matchesCategory && matchesAssignee
    })
  }, [project?.tasks, taskSearch, priorityFilter, categoryFilter, assigneeFilter])

  const formatDate = (date: string | null) => {
    if (!date) return '-'
    return new Date(date).toLocaleDateString('es-CL', { day: '2-digit', month: 'short', year: 'numeric' })
  }

  const getInitials = (name: string | null) => {
    if (!name) return '??'
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error || !project) {
    return (
      <div className="space-y-4">
        <Link href={backHref}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" /> Volver
          </Button>
        </Link>
        <div className="bg-red-50 border border-red-200 text-red-600 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400 px-4 py-3 rounded-lg">
          {error || 'Proyecto no encontrado'}
        </div>
      </div>
    )
  }

  // Obtener todos los miembros del proyecto para asignar tareas (sin duplicados)
  const projectMembersMap = new Map<string, { id: string; full_name: string; avatar_url: string | null; roles?: string[] }>()
  
  if (project.pm) {
    projectMembersMap.set(project.pm.id, { id: project.pm.id, full_name: project.pm.full_name, avatar_url: project.pm.avatar_url, roles: ['pm'] })
  }
  if (project.tech_lead) {
    projectMembersMap.set(project.tech_lead.id, { id: project.tech_lead.id, full_name: project.tech_lead.full_name, avatar_url: project.tech_lead.avatar_url, roles: ['tech_lead'] })
  }
  project.members.filter(m => m.role === 'developer').forEach(m => {
    projectMembersMap.set(m.user.id, { id: m.user.id, full_name: m.user.full_name, avatar_url: m.user.avatar_url, roles: ['developer'] })
  })
  
  const projectMembers = Array.from(projectMembersMap.values())

  // Calcular progreso del proyecto
  const totalTasks = project.tasks.length
  const completedTasks = project.tasks.filter(t => t.status === 'done').length
  const progressPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
  const hasNoTasks = totalTasks === 0

  // Vista simplificada para stakeholder
  if (currentUserRole === 'stakeholder') {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <Link href={backHref}>
              <Button variant="ghost" size="sm" className="mb-2">
                <ArrowLeft className="w-4 h-4 mr-2" /> {backLabel}
              </Button>
            </Link>
            <h1 className="text-2xl font-bold text-foreground">{project.name}</h1>
            {project.description && (
              <p className="text-muted-foreground">{project.description}</p>
            )}
          </div>
          <Badge variant="outline" className={statusColors[project.status]}>
            {statusLabels[project.status]}
          </Badge>
        </div>

        {/* Info Cards para Stakeholder */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {project.company && (
            <div className="bg-card rounded-lg border border-border p-4">
              <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                <Building2 className="w-4 h-4" /> Empresa
              </div>
              <p className="font-medium text-foreground">{project.company.name}</p>
            </div>
          )}

          <div className="bg-card rounded-lg border border-border p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
              <Calendar className="w-4 h-4" /> Fechas
            </div>
            <p className="font-medium text-foreground">
              {formatDate(project.start_date)} - {formatDate(project.end_date)}
            </p>
          </div>

          <div className="bg-card rounded-lg border border-border p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
              <CheckCircle2 className="w-4 h-4" /> Tareas Completadas
            </div>
            <p className="font-medium text-foreground">
              {hasNoTasks ? 'Sin tareas aún' : `${completedTasks} de ${totalTasks}`}
            </p>
          </div>

          <div className="bg-card rounded-lg border border-border p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
              <Clock className="w-4 h-4" /> Progreso
            </div>
            <p className="font-medium text-foreground">
              {hasNoTasks ? 'En planificación' : `${progressPercentage}%`}
            </p>
          </div>
        </div>

        {/* Barra de Progreso */}
        <div className="bg-card rounded-lg border border-border p-6">
          <h3 className="font-semibold text-foreground mb-4">Progreso del Proyecto</h3>
          {hasNoTasks ? (
            <div className="text-center py-4">
              <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mx-auto mb-3">
                <Clock className="w-6 h-6 text-amber-600 dark:text-amber-400" />
              </div>
              <p className="text-muted-foreground">
                El proyecto está en fase de planificación.
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Las tareas aún no han sido definidas por el equipo.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Completado</span>
                <span className="font-medium text-foreground">{progressPercentage}%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-3">
                <div
                  className="bg-green-500 dark:bg-green-600 h-3 rounded-full transition-all duration-500"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                {completedTasks} tareas completadas de {totalTasks} totales
              </p>
            </div>
          )}
        </div>

        {/* Contacto del PM */}
        {project.pm && (
          <div className="bg-card rounded-lg border border-border p-6">
            <h3 className="font-semibold text-foreground mb-4">Project Manager</h3>
            <div className="flex items-center gap-4">
              <Avatar className="w-12 h-12">
                <AvatarImage src={project.pm.avatar_url || undefined} />
                <AvatarFallback className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                  {getInitials(project.pm.full_name)}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium text-foreground">{project.pm.full_name}</p>
                <a 
                  href={`mailto:${project.pm.email}`}
                  className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1"
                >
                  <Mail className="w-3 h-3" /> {project.pm.email}
                </a>
              </div>
            </div>
          </div>
        )}

        {/* Sección de Comentarios para Stakeholder */}
        <StakeholderComments
          projectId={project.id}
          projectName={project.name}
          pmId={project.pm?.id || null}
          pmName={project.pm?.full_name || null}
          currentUserId={currentUserId}
        />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <Link href={backHref}>
            <Button variant="ghost" size="sm" className="mb-2">
              <ArrowLeft className="w-4 h-4 mr-2" /> {backLabel}
            </Button>
          </Link>
          <h1 className="text-2xl font-bold text-foreground">{project.name}</h1>
          {project.description && (
            <p className="text-muted-foreground">{project.description}</p>
          )}
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className={statusColors[project.status]}>
            {statusLabels[project.status]}
          </Badge>
          {['admin', 'pm', 'tech_lead'].includes(currentUserRole) && (
            <EditProjectDialog
              project={project}
              onProjectUpdated={fetchProject}
              onCompletedWithPending={(ids) => {
                fetchProject()
                setPendingTaskIds(ids)
                // Step 1: ask about CC first
                setCreateCCPrompt(true)
              }}
              onCompleted={() => {
                fetchProject()
                setCreateCCPrompt(true)
              }}
            />
          )}
          {['admin', 'pm'].includes(currentUserRole) && (!project.type || project.type === 'project') && (
            project.status === 'completed' ? (
              <Button
                variant="outline"
                size="sm"
                className="border-orange-300 text-orange-600 hover:bg-orange-50 dark:border-orange-700 dark:text-orange-400 dark:hover:bg-orange-900/20"
                onClick={() => {
                  // Calcular tareas pendientes en el momento de hacer clic
                  const pendingStatuses = ['backlog', 'todo', 'in_progress', 'review']
                  const ids = project.tasks
                    .filter(t => pendingStatuses.includes(t.status))
                    .map(t => t.id)
                  setPendingTaskIds(ids)
                  // Ir directo al paso de tareas si hay pendientes, sino al formulario CC
                  if (ids.length > 0) {
                    setPendingTasksWithCC(true)
                  } else {
                    setShowCCDialog(true)
                  }
                }}
              >
                <GitPullRequest className="w-4 h-4 mr-2" /> Crear CC
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                disabled
                title="Solo disponible cuando el proyecto está completado"
                className="border-orange-200 text-orange-400 opacity-50 cursor-not-allowed dark:border-orange-800 dark:text-orange-600"
              >
                <GitPullRequest className="w-4 h-4 mr-2" /> Crear CC
              </Button>
            )
          )}
          {currentUserRole === 'admin' && (
            <DeleteProjectDialog
              projectId={project.id}
              projectName={project.name}
              entityType={project.type === 'change_control' ? 'change_control' : 'project'}
            />
          )}
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {project.company && (
          <div className="bg-card rounded-lg border border-border p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
              <Building2 className="w-4 h-4" /> Empresa
            </div>
            <p className="font-medium text-foreground">{project.company.name}</p>
          </div>
        )}

        {project.parent_project && (
          <div className="bg-card rounded-lg border border-border p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
              <FolderKanban className="w-4 h-4" /> Proyecto Origen
            </div>
            <Link href={`/projects/${project.parent_project.id}`} className="font-medium text-foreground hover:underline" onClick={(e) => e.stopPropagation()}>
              {project.parent_project.name}
            </Link>
          </div>
        )}

        <div className="bg-card rounded-lg border border-border p-4">
          <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
            <Calendar className="w-4 h-4" /> Fechas
          </div>
          <p className="font-medium text-foreground">
            {formatDate(project.start_date)} - {formatDate(project.end_date)}
          </p>
        </div>

        <div className="bg-card rounded-lg border border-border p-4">
          <div className="flex items-center gap-2 text-muted-foreground text-sm mb-2">
            <Users className="w-4 h-4" /> Equipo
          </div>
          <div className="flex -space-x-2">
            {project.pm && (
              <Avatar className="w-8 h-8 border-2 border-background">
                <AvatarImage src={project.pm.avatar_url || undefined} />
                <AvatarFallback className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 text-xs">
                  {getInitials(project.pm.full_name)}
                </AvatarFallback>
              </Avatar>
            )}
            {project.tech_lead && project.tech_lead.id !== project.pm?.id && (
              <Avatar className="w-8 h-8 border-2 border-background">
                <AvatarImage src={project.tech_lead.avatar_url || undefined} />
                <AvatarFallback className="bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 text-xs">
                  {getInitials(project.tech_lead.full_name)}
                </AvatarFallback>
              </Avatar>
            )}
            {project.members
              .filter(m => m.user.id !== project.pm?.id && m.user.id !== project.tech_lead?.id)
              .slice(0, 3)
              .map((m) => (
              <Avatar key={m.id} className="w-8 h-8 border-2 border-background">
                <AvatarImage src={m.user.avatar_url || undefined} />
                <AvatarFallback className="bg-muted text-muted-foreground text-xs">
                  {getInitials(m.user.full_name)}
                </AvatarFallback>
              </Avatar>
            ))}
            {project.members.filter(m => m.user.id !== project.pm?.id && m.user.id !== project.tech_lead?.id).length > 3 && (
              <div className="w-8 h-8 rounded-full bg-muted border-2 border-background flex items-center justify-center text-xs text-muted-foreground">
                +{project.members.filter(m => m.user.id !== project.pm?.id && m.user.id !== project.tech_lead?.id).length - 3}
              </div>
            )}
          </div>
        </div>

        {['admin', 'pm', 'tech_lead'].includes(currentUserRole) && (
          <div className="bg-card rounded-lg border border-border p-4">
            <CreateTaskDialog
              projectId={project.id}
              projectName={project.name}
              members={projectMembers}
              onTaskCreated={fetchProject}
            />
          </div>
        )}
      </div>

      {/* View Toggle + Filters + Board/List */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          {/* View toggle */}
          <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
            <Button
              variant={viewMode === 'kanban' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('kanban')}
              className="gap-1.5"
            >
              <LayoutGrid className="w-4 h-4" /> Kanban
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
              className="gap-1.5"
            >
              <List className="w-4 h-4" /> Lista
            </Button>
          </div>

          {/* Filters */}
          <div className="flex-1">
            <TaskFilters
              search={taskSearch}
              onSearchChange={setTaskSearch}
              priorityFilter={priorityFilter}
              onPriorityFilterChange={setPriorityFilter}
              categoryFilter={categoryFilter}
              onCategoryFilterChange={setCategoryFilter}
              assigneeFilter={assigneeFilter}
              onAssigneeFilterChange={setAssigneeFilter}
              members={projectMembers}
              hasActiveFilters={taskSearch !== '' || priorityFilter !== 'all' || categoryFilter !== 'all' || assigneeFilter !== 'all'}
              onClearFilters={() => {
                setTaskSearch('')
                setPriorityFilter('all')
                setCategoryFilter('all')
                setAssigneeFilter('all')
              }}
            />
          </div>
        </div>

        {viewMode === 'kanban' ? (
          <KanbanBoard
            tasks={filteredTasks}
            projectId={project.id}
            projectName={project.name}
            members={projectMembers}
            allUsers={allUsers}
            currentUserId={currentUserId}
            onTasksChange={fetchProject}
          />
        ) : (
          <TaskListView
            tasks={filteredTasks}
            projectId={project.id}
            projectName={project.name}
            members={projectMembers}
            allUsers={allUsers}
            currentUserId={currentUserId}
            onTasksChange={fetchProject}
          />
        )}
      </div>

      {/* Project Attachments */}
      <div className="bg-card rounded-lg border border-border p-6">
        <FileAttachments
          projectId={project.id}
          currentUserId={currentUserId}
        />
      </div>

      {/* Comments Section */}
      <ProjectComments 
        projectId={project.id} 
        projectName={project.name}
        users={allUsers} 
        currentUserId={currentUserId}
      />

      {/* Stakeholder Messages - Solo visible para PM y Admin */}
      {['admin', 'pm'].includes(currentUserRole) && (
        <StakeholderMessagesForPM
          projectId={project.id}
          projectName={project.name}
          currentUserId={currentUserId}
          stakeholderIds={project.members
            .filter(m => m.user.role?.name === 'stakeholder')
            .map(m => m.user.id)}
        />
      )}

      {/* Activity History */}
      <ProjectActivity projectId={project.id} />

      {/* Post-completion flow dialogs */}
      {/* Step 1: ¿Crear CC? */}
      <CreateCCPromptDialog
        open={createCCPrompt}
        projectName={project.name}
        onCreateCC={() => {
          setCreateCCPrompt(false)
          if (pendingTaskIds.length > 0) {
            // Step 2a: hay tareas pendientes y quiere CC
            setPendingTasksWithCC(true)
          } else {
            // No hay tareas pendientes, ir directo al formulario CC
            setShowCCDialog(true)
          }
        }}
        onSkip={() => {
          setCreateCCPrompt(false)
          if (pendingTaskIds.length > 0) {
            // Step 2b: hay tareas pendientes pero no quiere CC
            setPendingTasksNoCC(true)
          }
          // Si no hay tareas pendientes, no hay nada más que hacer
        }}
      />

      {/* Step 2a: tareas pendientes con opción de mudar al CC */}
      <PendingTasksWithCCDialog
        open={pendingTasksWithCC}
        pendingCount={pendingTaskIds.length}
        onMigrate={() => {
          setPendingTasksWithCC(false)
          setMigrateTasks(true)
          setShowCCDialog(true)
        }}
        onKeep={() => {
          setPendingTasksWithCC(false)
          setShowCCDialog(true)
        }}
        onDelete={async () => {
          setPendingTasksWithCC(false)
          await Promise.all(pendingTaskIds.map(id => fetch(`/api/dashboard/tasks/${id}`, { method: 'DELETE' })))
          setPendingTaskIds([])
          fetchProject()
          setShowCCDialog(true)
        }}
      />

      {/* Step 2b: tareas pendientes sin opción de mudar (no quiere CC) */}
      <PendingTasksNoCCDialog
        open={pendingTasksNoCC}
        pendingCount={pendingTaskIds.length}
        onKeep={() => {
          setPendingTasksNoCC(false)
          setPendingTaskIds([])
        }}
        onDelete={async () => {
          setPendingTasksNoCC(false)
          await Promise.all(pendingTaskIds.map(id => fetch(`/api/dashboard/tasks/${id}`, { method: 'DELETE' })))
          setPendingTaskIds([])
          fetchProject()
        }}
      />

      {showCCDialog && (
        <CreateChangeControlDialog
          preselectedProject={{
            ...project,
            description: `Control de cambios del proyecto "${project.name}"`,
          }}
          pendingTaskIds={migrateTasks ? pendingTaskIds : []}
          forceOpen={showCCDialog}
          onCreated={() => {
            setShowCCDialog(false)
            setMigrateTasks(false)
            setPendingTaskIds([])
            fetchProject()
          }}
          onCancelled={() => {
            setShowCCDialog(false)
            setMigrateTasks(false)
            setPendingTaskIds([])
          }}
        />
      )}
    </div>
  )
}
