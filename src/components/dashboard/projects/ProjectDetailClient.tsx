'use client'

import { useState, useMemo, useEffect, useCallback, useRef, lazy, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ArrowLeft, Mail, Clock, GitPullRequest, LayoutGrid, List } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { TaskFilters } from './TaskFilters'
import { CreateTaskDialog } from './CreateTaskDialog'
import { ProjectComments } from './ProjectComments'
import { ProjectActivity } from './ProjectActivity'
import { EditProjectDialog } from './EditProjectDialog'
import { DeleteProjectDialog } from './DeleteProjectDialog'
import { StakeholderComments } from './StakeholderComments'
import { StakeholderView } from './StakeholderView'
import { StakeholderMessagesForPM } from './StakeholderMessagesForPM'
import { FileAttachments } from '@/components/ui/file-attachments'
import { CreateChangeControlDialog } from '@/components/dashboard/change-controls/CreateChangeControlDialog'
import { PendingTasksWithCCDialog, PendingTasksNoCCDialog, CreateCCPromptDialog } from './PendingTasksDialog'
import { SprintSelector } from './SprintSelector'
import { SprintHeader } from './SprintHeader'
import { CreateSprintDialog } from './CreateSprintDialog'
import { ImportSprintPlanDialog } from './ImportSprintPlanDialog'
import type { Sprint } from './CreateSprintDialog'
import type { ProjectTask } from '@/lib/types/task'
import { groupBlockingBugsByTaskId, type BlockingBugRef } from '@/lib/utils/task-open-bugs'
import { BugSection } from './BugSection'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import { useUsers } from '@/hooks/useUsers'
import { useProject } from '@/hooks/useProject'
import { FormattedText } from '@/components/ui/formatted-text'
import { useLayoutMode } from '@/hooks/use-layout-mode'
import { MobileTaskStack } from './MobileTaskStack'

// Lazy load de componentes pesados — solo se cargan cuando se necesitan
const KanbanBoard = lazy(() => import('./KanbanBoard').then(m => ({ default: m.KanbanBoard })))
const TaskListView = lazy(() => import('./TaskListView').then(m => ({ default: m.TaskListView })))

function InfoTile({ tint, label, children }: { tint: string; label: string; children: React.ReactNode }) {
  return (
    <div className={`min-w-0 rounded-2xl border px-4 py-4 ${tint}`}>
      <p className="text-[12px] font-medium text-muted-foreground">{label}</p>
      <div className="mt-2 break-words text-[15px] font-semibold tracking-tight">{children}</div>
    </div>
  )
}

function KanbanSkeleton() {
  return (
    <div className="flex w-full min-w-0 max-w-full gap-3 overflow-x-auto overscroll-x-contain pb-4">
      {[1, 2, 3, 4, 5].map(col => (
        <div key={col} className="w-72 flex-shrink-0 space-y-3">
          <div className="flex items-center justify-between px-1">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-5 w-6 rounded-full" />
          </div>
          {[1, 2, 3].map(card => (
            <div key={card} className="bg-card border border-border rounded-lg p-3 space-y-2.5">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-3.5 w-4/5" />
              <div className="flex items-center justify-between pt-1">
                <Skeleton className="h-5 w-16 rounded-full" />
                <Skeleton className="w-6 h-6 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}

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
  tasks: ProjectTask[]
  sprints: Sprint[]
}

type Task = ProjectTask

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
  const { project, isLoading: loading, error: projectError, mutate: mutateProject, optimisticMoveTask, applyTaskPatch, applySprintOrderUpdates } = useProject(projectId)
  const { users } = useUsers()
  const { currentUserId, currentUserRole } = useCurrentUser()
  const searchParams = useSearchParams()
  const highlightId = searchParams.get('highlight') ?? searchParams.get('task')
  const initialBugId = searchParams.get('bug')
  const shouldFocusBugs = searchParams.get('tab') === 'bugs'
  const bugSectionRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!shouldFocusBugs || !bugSectionRef.current) return
    bugSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [shouldFocusBugs, project?.id])

  // Si hay un highlight, asegurarse de que el sprint correcto esté seleccionado
  useEffect(() => {
    if (!highlightId || !project) return
    const task = project.tasks.find(t => t.id === highlightId)
    if (task) {
      setSelectedSprintId(task.sprint_id ?? null)
    }
  }, [highlightId, project?.tasks])

  const allUsers: User[] = users.map(u => ({ id: u.id, full_name: u.full_name, avatar_url: u.avatar_url ?? null }))
  const error = projectError?.message ?? null

  // Post-completion flow state
  const [pendingTaskIds, setPendingTaskIds] = useState<string[]>([])
  const [createCCPrompt, setCreateCCPrompt] = useState(false)
  const [pendingTasksWithCC, setPendingTasksWithCC] = useState(false)
  const [pendingTasksNoCC, setPendingTasksNoCC] = useState(false)
  const [migrateTasks, setMigrateTasks] = useState(false)
  const [showCCDialog, setShowCCDialog] = useState(false)

  // Sprint state
  const [selectedSprintId, setSelectedSprintId] = useState<string | null | 'auto'>('auto')
  const [createSprintOpen, setCreateSprintOpen] = useState(false)
  const [importPlanOpen, setImportPlanOpen] = useState(false)

  // View mode and filters
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban')
  const layoutMode = useLayoutMode()
  const [taskSearch, setTaskSearch] = useState('')
  const [priorityFilter, setPriorityFilter] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [assigneeFilter, setAssigneeFilter] = useState('all')

  // Bugs por tarea (conteo y bloqueo al completar)
  const [bugsByTask, setBugsByTask] = useState<Record<string, number>>({})
  const [blockingBugsByTask, setBlockingBugsByTask] = useState<Record<string, BlockingBugRef[]>>({})
  useEffect(() => {
    if (!project?.id) return
    fetch(`/api/dashboard/bugs?project_id=${project.id}`)
      .then(r => r.json())
      .then(data => {
        const counts: Record<string, number> = {}
        const grouped = groupBlockingBugsByTaskId(
          (data.bugs || []).map((bug: {
            id: string
            title: string
            status: string
            task_id?: string | null
            project_id?: string
          }) => ({
            ...bug,
            project_id: bug.project_id ?? project.id,
          }))
        )
        for (const [taskId, bugs] of Object.entries(grouped)) {
          counts[taskId] = bugs.length
        }
        setBugsByTask(counts)
        setBlockingBugsByTask(grouped)
      })
      .catch(() => {})
  }, [project?.id])

  // Auto-seleccionar sprint activo al cargar el proyecto
  const resolvedSprintId: string | null = useMemo(() => {
    if (!project || selectedSprintId !== 'auto') return selectedSprintId as string | null
    const activeSprint = project.sprints?.find(s => s.status === 'active')
    return activeSprint?.id ?? null
  }, [project, selectedSprintId])

  // Filtrar tareas según sprint seleccionado (Kanban) o todas (lista) + filtros activos
  const tasksWithMeta = useMemo(() => {
    if (!project) return []
    return project.tasks.map(t => ({
      ...t,
      is_carry_over: t.is_carry_over ?? false,
      sprint_order: t.sprint_order ?? null,
      assignees: t.assignees?.length ? t.assignees : t.assignee ? [t.assignee] : [],
      openBugsCount: bugsByTask[t.id] ?? 0,
      blockingBugs: blockingBugsByTask[t.id] ?? [],
    }))
  }, [project?.tasks, bugsByTask, blockingBugsByTask])

  const filterTask = useCallback((task: typeof tasksWithMeta[number], applySprintFilter: boolean) => {
    const matchesSprint = !applySprintFilter || (
      resolvedSprintId === null
        ? task.sprint_id === null
        : task.sprint_id === resolvedSprintId
    )

    const matchesSearch = taskSearch === '' ||
      task.title.toLowerCase().includes(taskSearch.toLowerCase()) ||
      (task.description?.toLowerCase().includes(taskSearch.toLowerCase())) ||
      `#${task.task_number}`.includes(taskSearch)
    const matchesPriority = priorityFilter === 'all' || task.priority === priorityFilter
    const matchesCategory = categoryFilter === 'all' || task.category === categoryFilter
    const matchesAssignee = assigneeFilter === 'all' ||
      (assigneeFilter === 'unassigned' && task.assignees.length === 0) ||
      task.assignees.some(a => a.id === assigneeFilter)

    return matchesSprint && matchesSearch && matchesPriority && matchesCategory && matchesAssignee
  }, [resolvedSprintId, taskSearch, priorityFilter, categoryFilter, assigneeFilter])

  const filteredTasks = useMemo(() => {
    return tasksWithMeta.filter(task => filterTask(task, true))
  }, [tasksWithMeta, filterTask])

  const listFilteredTasks = useMemo(() => {
    return tasksWithMeta.filter(task => filterTask(task, false))
  }, [tasksWithMeta, filterTask])

  const hasListFilters =
    taskSearch !== '' ||
    priorityFilter !== 'all' ||
    categoryFilter !== 'all' ||
    assigneeFilter !== 'all'

  const canReorderSprintTasks =
    ['admin', 'pm', 'tech_lead'].includes(currentUserRole) && !hasListFilters

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
      <div className="space-y-6 pt-8">
        <div className="flex items-start justify-between">
          <div className="space-y-3">
            <Skeleton className="h-8 w-24 mb-2" />
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-96" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-6 w-24 rounded-full" />
            <Skeleton className="h-8 w-20 rounded-md" />
            <Skeleton className="h-8 w-20 rounded-md" />
          </div>
        </div>

        {/* Info Cards skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-card rounded-lg border border-border p-4 space-y-2">
              <Skeleton className="h-3.5 w-24" />
              <Skeleton className="h-5 w-32" />
            </div>
          ))}
        </div>

        {/* View toggle + filters skeleton */}
        <div className="flex items-center gap-3">
          <Skeleton className="h-9 w-36 rounded-lg" />
          <Skeleton className="h-9 flex-1" />
          <Skeleton className="h-9 w-28" />
        </div>

        {/* Kanban Board skeleton */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((col) => (
            <div key={col} className="space-y-3">
              <div className="flex items-center justify-between">
                <Skeleton className="h-5 w-24" />
                <Skeleton className="h-5 w-6 rounded-full" />
              </div>
              {[1, 2, 3].map((card) => (
                <div key={card} className="bg-card border border-border rounded-lg p-3 space-y-2.5">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-3.5 w-4/5" />
                  <div className="flex items-center justify-between pt-1">
                    <Skeleton className="h-5 w-16 rounded-full" />
                    <Skeleton className="w-6 h-6 rounded-full" />
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (error || !project) {
    return (
      <div className="space-y-4 pt-8">
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

  if (currentUserRole === 'stakeholder') {
    return (
      <div className="min-w-0 max-w-full space-y-6 overflow-x-clip">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <Link href={backHref} className="inline-flex items-center gap-1 text-[15px] font-medium text-primary mb-2">
              <ArrowLeft className="w-4 h-4" /> {backLabel}
            </Link>
            <h1 className="text-[28px] font-semibold tracking-tight text-foreground sm:text-[32px]">{project.name}</h1>
            {project.description && (
              <p className="text-[15px] text-muted-foreground mt-1.5 max-w-2xl">
                <FormattedText>{project.description}</FormattedText>
              </p>
            )}
          </div>
          <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold mt-7 ${statusColors[project.status]}`}>
            {statusLabels[project.status]}
          </span>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {project.company && (
            <InfoTile tint="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/35" label="Empresa">
              {project.company.name}
            </InfoTile>
          )}
          <InfoTile tint="border-sky-200 bg-sky-50 dark:border-sky-800 dark:bg-sky-950/35" label="Fechas">
            {formatDate(project.start_date)} – {formatDate(project.end_date)}
          </InfoTile>
          <InfoTile tint="border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/35" label="Tareas completadas">
            {hasNoTasks ? 'Sin tareas aún' : `${completedTasks} de ${totalTasks}`}
          </InfoTile>
          <InfoTile tint="border-violet-200 bg-violet-50 dark:border-violet-800 dark:bg-violet-950/35" label="Progreso">
            {hasNoTasks ? 'En planificación' : `${progressPercentage}%`}
          </InfoTile>
        </div>

        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-800 dark:bg-emerald-950/25">
          <h3 className="font-semibold text-foreground mb-4 tracking-tight">Progreso del Proyecto</h3>
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

        {project.pm && (
          <div className="rounded-2xl border border-sky-200 bg-sky-50 p-4 dark:border-sky-800 dark:bg-sky-950/30">
            <h3 className="font-semibold text-foreground mb-4 tracking-tight">Project Manager</h3>
            <div className="flex items-center gap-4">
              <Avatar className="w-12 h-12">
                <AvatarImage src={project.pm.avatar_url || undefined} />
                <AvatarFallback className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 text-sm">
                  {getInitials(project.pm.full_name)}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium text-foreground text-sm">{project.pm.full_name}</p>
                <a href={`mailto:${project.pm.email}`} className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
                  <Mail className="w-3 h-3" /> {project.pm.email}
                </a>
              </div>
            </div>
          </div>
        )}

        {/* Improved stakeholder view: timeline + tasks per sprint + documents */}
        <StakeholderView
          projectId={project.id}
          sprints={project.sprints || []}
          tasks={project.tasks.map(t => ({
            ...t,
            is_carry_over: t.is_carry_over ?? false,
            sprint_order: t.sprint_order ?? null,
            assignees: t.assignees?.length ? t.assignees : t.assignee ? [t.assignee] : [],
          }))}
          progressPercentage={progressPercentage}
          totalTasks={totalTasks}
          completedTasks={completedTasks}
        />

        {/* Stakeholder comments */}
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
    <div className="min-w-0 max-w-full space-y-5 overflow-x-clip">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <Link href={backHref} className="inline-flex items-center gap-1 text-[15px] font-medium text-primary mb-2">
            <ArrowLeft className="w-4 h-4" /> {backLabel}
          </Link>
          <h1 className="text-[28px] font-semibold tracking-tight text-foreground sm:text-[32px]">{project.name}</h1>
          {project.description && (
            <p className="text-[15px] text-muted-foreground mt-1.5 max-w-2xl">
              <FormattedText>{project.description}</FormattedText>
            </p>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2 lg:pt-7">
          <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${statusColors[project.status]}`}>
            {statusLabels[project.status]}
          </span>
          {['admin', 'pm', 'tech_lead'].includes(currentUserRole) && (
            <EditProjectDialog
              project={project}
              onProjectUpdated={mutateProject}
              onCompletedWithPending={(ids) => {
                mutateProject()
                setPendingTaskIds(ids)
                setCreateCCPrompt(true)
              }}
              onCompleted={() => {
                mutateProject()
                setCreateCCPrompt(true)
              }}
            />
          )}
          {['admin', 'pm'].includes(currentUserRole) && (!project.type || project.type === 'project') && (
            project.status === 'completed' ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const pendingStatuses = ['backlog', 'todo', 'in_progress', 'review']
                  const ids = project.tasks
                    .filter(t => pendingStatuses.includes(t.status))
                    .map(t => t.id)
                  setPendingTaskIds(ids)
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

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {project.company && (
          <InfoTile tint="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/35" label="Empresa">
            {project.company.name}
          </InfoTile>
        )}

        {project.parent_project && (
          <InfoTile tint="border-violet-200 bg-violet-50 dark:border-violet-800 dark:bg-violet-950/35" label="Proyecto origen">
            <Link href={`/projects/${project.parent_project.id}`} className="hover:underline">
              {project.parent_project.name}
            </Link>
          </InfoTile>
        )}

        <InfoTile tint="border-sky-200 bg-sky-50 dark:border-sky-800 dark:bg-sky-950/35" label="Fechas">
          {formatDate(project.start_date)} – {formatDate(project.end_date)}
        </InfoTile>

        <InfoTile tint="border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/35" label="Avance">
          {totalTasks === 0 ? 'Sin tareas' : `${progressPercentage}% · ${completedTasks} de ${totalTasks}`}
        </InfoTile>

        <div className="min-w-0 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 dark:border-slate-700 dark:bg-slate-900/40">
          <p className="mb-2 text-[12px] font-medium text-muted-foreground">Equipo</p>
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
          <div className="flex min-w-0 items-center rounded-2xl border border-sky-200 bg-sky-50 px-4 py-4 dark:border-sky-800 dark:bg-sky-950/35">
            <CreateTaskDialog
              projectId={project.id}
              projectName={project.name}
              members={projectMembers}
              tasks={project.tasks.map(t => ({
                id: t.id,
                task_number: t.task_number,
                title: t.title,
                status: t.status,
                sprint_id: t.sprint_id,
                sprint_order: t.sprint_order ?? null,
              }))}
              sprints={project.sprints || []}
              initialSprintId={resolvedSprintId}
              currentSprintId={resolvedSprintId}
              onTaskCreated={mutateProject}
            />
          </div>
        )}
      </div>

      {/* Sprint Selector + Header */}
      {(project.sprints?.length > 0 || ['admin', 'pm'].includes(currentUserRole)) && (
        <div className="space-y-3">
          <SprintSelector
            sprints={project.sprints || []}
            selectedSprintId={resolvedSprintId}
            onSelect={(id) => setSelectedSprintId(id)}
            canManage={['admin', 'pm'].includes(currentUserRole)}
            onNewSprint={() => setCreateSprintOpen(true)}
            onImportPlan={() => setImportPlanOpen(true)}
          />

          {resolvedSprintId !== null && (() => {
            const currentSprint = project.sprints?.find(s => s.id === resolvedSprintId)
            if (!currentSprint) return null
            const nextSprint = project.sprints
              ?.filter(s => s.status === 'planning' && s.order_index > currentSprint.order_index)
              ?.sort((a, b) => a.order_index - b.order_index)[0] ?? null
            return (
              <SprintHeader
                sprint={{ ...currentSprint, tasks: project.tasks.filter(t => t.sprint_id === currentSprint.id) }}
                projectId={project.id}
                nextSprint={nextSprint ?? null}
                canManage={['admin', 'pm'].includes(currentUserRole)}
                onSprintStarted={() => mutateProject()}
                onSprintCompleted={() => mutateProject()}
              />
            )
          })()}
        </div>
      )}

      {/* View Toggle + Filters + Board/List */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="hidden items-center gap-1 rounded-full border border-border bg-card p-1 md:flex">
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

        {layoutMode === 'unknown' ? (
          <KanbanSkeleton />
        ) : layoutMode === 'phone' ? (
          <MobileTaskStack
            tasks={filteredTasks}
            projectId={project.id}
            projectName={project.name}
            members={projectMembers}
            allUsers={allUsers}
            currentUserId={currentUserId}
            onTasksChange={mutateProject}
            highlightId={highlightId}
          />
        ) : viewMode === 'kanban' ? (
          <Suspense fallback={<KanbanSkeleton />}>
            <KanbanBoard
              tasks={filteredTasks}
              projectId={project.id}
              projectName={project.name}
              members={projectMembers}
              allUsers={allUsers}
              currentUserId={currentUserId}
              onTasksChange={mutateProject}
              onOptimisticMove={optimisticMoveTask}
              onTaskPatched={applyTaskPatch}
              highlightId={highlightId}
              sprints={project.sprints || []}
            />
          </Suspense>
        ) : (
          <Suspense fallback={<KanbanSkeleton />}>
            <div className="min-w-0 max-w-full overflow-x-auto overscroll-x-contain">
            <TaskListView
              tasks={listFilteredTasks}
              projectId={project.id}
              projectName={project.name}
              members={projectMembers}
              allUsers={allUsers}
              currentUserId={currentUserId}
              onTasksChange={mutateProject}
              sprints={project.sprints || []}
              selectedSprintId={resolvedSprintId}
              canReorder={canReorderSprintTasks}
              showReorderHint={['admin', 'pm', 'tech_lead'].includes(currentUserRole) && hasListFilters}
              onSprintOrderUpdates={applySprintOrderUpdates}
              highlightId={highlightId}
            />
            </div>
          </Suspense>
        )}
      </div>

      <div ref={bugSectionRef} className="min-w-0 rounded-2xl border border-rose-200 bg-rose-50 p-4 dark:border-rose-800 dark:bg-rose-950/25 sm:p-5">
          <BugSection
            projectId={project.id}
            members={projectMembers}
            allUsers={allUsers}
            currentUserId={currentUserId}
            currentUserRole={currentUserRole}
            sprints={project.sprints || []}
            tasks={project.tasks.map(t => ({ id: t.id, task_number: t.task_number, title: t.title, sprint_id: t.sprint_id }))}
            initialBugId={initialBugId}
          />
      </div>

      <div className="min-w-0 rounded-2xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950/25 sm:p-5">
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
          mutateProject()
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
          mutateProject()
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
            mutateProject()
          }}
          onCancelled={() => {
            setShowCCDialog(false)
            setMigrateTasks(false)
            setPendingTaskIds([])
          }}
        />
      )}

      {/* Create Sprint Dialog */}
      <CreateSprintDialog
        open={createSprintOpen}
        onOpenChange={setCreateSprintOpen}
        projectId={project.id}
        onCreated={(sprint) => {
          mutateProject()
          setSelectedSprintId(sprint.id)
        }}
      />

      <ImportSprintPlanDialog
        open={importPlanOpen}
        onOpenChange={setImportPlanOpen}
        projectId={project.id}
        onImported={(sprintId) => {
          mutateProject()
          setSelectedSprintId(sprintId)
        }}
      />
    </div>
  )
}
