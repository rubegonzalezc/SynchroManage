import { createClient } from '@/lib/supabase/server'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import Link from 'next/link'
import { UpcomingMeetings } from '@/components/dashboard/UpcomingMeetings'
import { TaskStatusChart } from '@/components/dashboard/TaskStatusChart'
import { ProjectStatusChart } from '@/components/dashboard/ProjectStatusChart'
import { BugStatusChart } from '@/components/dashboard/BugStatusChart'
import { UsersRoleChart } from '@/components/dashboard/UsersRoleChart'
import { UnassignedTasks } from '@/components/dashboard/UnassignedTasks'
import { OpenBugsList } from '@/components/dashboard/OpenBugsList'
import { DashboardStatTile } from '@/components/dashboard/DashboardStatTile'
import { DashboardSection } from '@/components/dashboard/DashboardSection'

const roleLabels: Record<string, string> = {
  admin: 'Administradores',
  pm: 'Project Managers',
  tech_lead: 'Tech Leads',
  developer: 'Desarrolladores',
  stakeholder: 'Stakeholders',
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

const actionLabels: Record<string, string> = {
  created: 'creó',
  updated: 'actualizó',
  deleted: 'eliminó',
  assigned: 'asignó',
  unassigned: 'desasignó',
  commented: 'comentó en',
  completed: 'completó',
  invited: 'invitó a',
  status_changed: 'cambió el estado de',
  reviewer_assigned: 'asignó revisor en',
  reviewer_removed: 'removió el revisor de',
}

const entityLabels: Record<string, string> = {
  project: 'proyecto',
  task: 'tarea',
  comment: 'comentario',
  user: 'usuario',
  company: 'empresa',
}

const actionColors: Record<string, string> = {
  created: 'text-green-600 dark:text-green-400',
  updated: 'text-blue-600 dark:text-blue-400',
  deleted: 'text-red-600 dark:text-red-400',
  assigned: 'text-purple-600 dark:text-purple-400',
  unassigned: 'text-orange-600 dark:text-orange-400',
  commented: 'text-amber-600 dark:text-amber-400',
  completed: 'text-green-600 dark:text-green-400',
  invited: 'text-indigo-600 dark:text-indigo-400',
  status_changed: 'text-amber-600 dark:text-amber-400',
  reviewer_assigned: 'text-violet-600 dark:text-violet-400',
  reviewer_removed: 'text-red-500 dark:text-red-400',
}

export default async function AdminDashboard() {
  const supabase = await createClient()
  
  // Obtener usuario actual y su rol
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase
    .from('profiles')
    .select('role:roles(name)')
    .eq('id', user?.id)
    .single()
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const roleName = (profile?.role as any)?.name
  const isPM = roleName === 'pm'
  const isTechLead = roleName === 'tech_lead'
  const isDeveloper = roleName === 'developer'
  const isStakeholder = roleName === 'stakeholder'
  const isAdmin = roleName === 'admin'
  const userId = user?.id

  // Para Tech Lead, Developer y Stakeholder, obtener IDs de proyectos donde es miembro
  let memberProjectIds: string[] = []
  if ((isTechLead || isDeveloper || isStakeholder) && userId) {
    const { data: memberProjects } = await supabase
      .from('project_members')
      .select('project_id')
      .eq('user_id', userId)
    
    memberProjectIds = memberProjects?.map(p => p.project_id) || []
    
    // Tech Lead también puede ser tech_lead de proyectos
    if (isTechLead) {
      const { data: leadProjects } = await supabase
        .from('projects')
        .select('id')
        .eq('tech_lead_id', userId)
      
      const leadIds = leadProjects?.map(p => p.id) || []
      memberProjectIds = [...new Set([...memberProjectIds, ...leadIds])]
    }
  }

  // Obtener estadísticas en paralelo (filtradas por rol)
  const [
    { count: usersCount },
    { count: projectsActiveCount },
    { count: projectsTotalCount },
    { count: tasksCompletedCount },
    { count: tasksTotalCount },
    { count: tasksInReviewCount },
    { count: myTasksCount },
    { count: myTasksCompletedCount },
    { count: companiesCount },
    { data: usersByRole },
    { data: recentProjects },
    { data: urgentTasks },
    { data: recentActivity },
    { data: allProjectsForChart },
    { data: allTasksForChart },
    { count: bugsOpenCount },
    { count: bugsInProgressCount },
    { count: bugsResolvedCount },
    { count: bugsClosedCount },
  ] = await Promise.all([
    // Total usuarios (solo admin)
    isAdmin 
      ? supabase.from('profiles').select('*', { count: 'exact', head: true })
      : { count: 0 },
    // Proyectos activos
    isPM
      ? supabase.from('projects').select('*', { count: 'exact', head: true }).eq('status', 'in_progress').eq('pm_id', userId)
      : (isTechLead || isDeveloper || isStakeholder) && memberProjectIds.length > 0
        ? supabase.from('projects').select('*', { count: 'exact', head: true }).eq('status', 'in_progress').in('id', memberProjectIds)
        : supabase.from('projects').select('*', { count: 'exact', head: true }).eq('status', 'in_progress'),
    // Total proyectos
    isPM
      ? supabase.from('projects').select('*', { count: 'exact', head: true }).eq('pm_id', userId)
      : (isTechLead || isDeveloper || isStakeholder) && memberProjectIds.length > 0
        ? supabase.from('projects').select('*', { count: 'exact', head: true }).in('id', memberProjectIds)
        : supabase.from('projects').select('*', { count: 'exact', head: true }),
    // Tareas completadas
    isPM
      ? supabase.from('tasks').select('*, project:projects!inner(pm_id)', { count: 'exact', head: true }).eq('status', 'done').eq('project.pm_id', userId)
      : (isTechLead || isDeveloper || isStakeholder) && memberProjectIds.length > 0
        ? supabase.from('tasks').select('*', { count: 'exact', head: true }).eq('status', 'done').in('project_id', memberProjectIds)
        : supabase.from('tasks').select('*', { count: 'exact', head: true }).eq('status', 'done'),
    // Total tareas
    isPM
      ? supabase.from('tasks').select('*, project:projects!inner(pm_id)', { count: 'exact', head: true }).eq('project.pm_id', userId)
      : (isTechLead || isDeveloper || isStakeholder) && memberProjectIds.length > 0
        ? supabase.from('tasks').select('*', { count: 'exact', head: true }).in('project_id', memberProjectIds)
        : supabase.from('tasks').select('*', { count: 'exact', head: true }),
    // Tareas en revisión (para Tech Lead)
    isTechLead && memberProjectIds.length > 0
      ? supabase.from('tasks').select('*', { count: 'exact', head: true }).eq('status', 'review').in('project_id', memberProjectIds)
      : { count: 0 },
    // Mis tareas asignadas (para Developer)
    isDeveloper && userId
      ? supabase.from('tasks').select('*', { count: 'exact', head: true }).eq('assignee_id', userId).neq('status', 'done')
      : { count: 0 },
    // Mis tareas completadas (para Developer)
    isDeveloper && userId
      ? supabase.from('tasks').select('*', { count: 'exact', head: true }).eq('assignee_id', userId).eq('status', 'done')
      : { count: 0 },
    // Total empresas (solo admin)
    isAdmin
      ? supabase.from('companies').select('*', { count: 'exact', head: true }).eq('is_active', true)
      : { count: 0 },
    // Usuarios por rol (solo admin)
    isAdmin
      ? supabase.from('profiles').select('role:roles(name)')
      : { data: [] },
    // Proyectos recientes
    isPM
      ? supabase.from('projects')
          .select('id, name, status, company:companies(name)')
          .eq('pm_id', userId)
          .order('created_at', { ascending: false })
          .limit(5)
      : (isTechLead || isDeveloper || isStakeholder) && memberProjectIds.length > 0
        ? supabase.from('projects')
            .select('id, name, status, company:companies(name)')
            .in('id', memberProjectIds)
            .order('created_at', { ascending: false })
            .limit(5)
        : supabase.from('projects')
            .select('id, name, status, company:companies(name)')
            .order('created_at', { ascending: false })
            .limit(5),
    // Tareas urgentes o asignadas (stakeholder no ve tareas)
    isStakeholder
      ? { data: [] }
      : isDeveloper && userId
        ? supabase.from('tasks')
            .select('id, title, task_number, priority, due_date, status, project:projects(id, name)')
            .eq('assignee_id', userId)
            .neq('status', 'done')
            .order('priority', { ascending: false })
            .order('due_date', { ascending: true })
            .limit(5)
        : isPM
          ? supabase.from('tasks')
              .select('id, title, task_number, priority, due_date, status, project:projects!inner(id, name, pm_id)')
              .or('priority.eq.urgent,priority.eq.high')
              .neq('status', 'done')
              .eq('project.pm_id', userId)
              .order('due_date', { ascending: true })
              .limit(5)
          : isTechLead && memberProjectIds.length > 0
            ? supabase.from('tasks')
                .select('id, title, task_number, priority, due_date, status, project:projects(id, name)')
                .or('priority.eq.urgent,priority.eq.high')
                .neq('status', 'done')
                .in('project_id', memberProjectIds)
                .order('due_date', { ascending: true })
                .limit(5)
            : supabase.from('tasks')
                .select('id, title, task_number, priority, due_date, status, project:projects(id, name)')
                .or('priority.eq.urgent,priority.eq.high')
                .neq('status', 'done')
                .order('due_date', { ascending: true })
              .limit(5),
    // Actividad reciente
    supabase.from('activity_log')
      .select('*, user:profiles(id, full_name, avatar_url)')
      .order('created_at', { ascending: false })
      .limit(8),
    // Proyectos por estado (para gráfica)
    supabase.from('projects')
      .select('status'),
    // Tareas por estado (para gráfica)
    supabase.from('tasks')
      .select('status'),
    // Bugs por estado (para gráfica)
    supabase.from('bugs').select('*', { count: 'exact', head: true }).eq('status', 'open'),
    supabase.from('bugs').select('*', { count: 'exact', head: true }).eq('status', 'in_progress'),
    supabase.from('bugs').select('*', { count: 'exact', head: true }).eq('status', 'resolved'),
    supabase.from('bugs').select('*', { count: 'exact', head: true }).eq('status', 'closed'),
  ])

  // Contar usuarios por rol
  const roleCounts: Record<string, number> = {}
  usersByRole?.forEach((u) => {
    // Supabase puede retornar la relación como objeto o array
    const roleData = u.role as { name: string } | { name: string }[] | null
    const roleName = Array.isArray(roleData) 
      ? roleData[0]?.name 
      : roleData?.name || 'sin_rol'
    roleCounts[roleName] = (roleCounts[roleName] || 0) + 1
  })

  const stats = isStakeholder ? [
    {
      title: 'Mis Proyectos',
      value: projectsTotalCount || 0,
      description: `${projectsActiveCount || 0} activos`,
      href: '/projects',
    },
    {
      title: 'Progreso General',
      value: tasksTotalCount ? Math.round(((tasksCompletedCount || 0) / tasksTotalCount) * 100) : 0,
      description: '% completado',
      href: '/projects',
    },
  ] : isDeveloper ? [
    {
      title: 'Mis Tareas',
      value: myTasksCount || 0,
      description: 'Pendientes',
      href: '/projects',
    },
    {
      title: 'Completadas',
      value: myTasksCompletedCount || 0,
      description: 'Tareas finalizadas',
      href: '/projects',
    },
    {
      title: 'Mis Proyectos',
      value: projectsTotalCount || 0,
      description: `${projectsActiveCount || 0} activos`,
      href: '/projects',
    },
  ] : isTechLead ? [
    {
      title: 'Mis Proyectos',
      value: projectsTotalCount || 0,
      description: `${projectsActiveCount || 0} activos`,
      href: '/projects',
    },
    {
      title: 'En Revisión',
      value: tasksInReviewCount || 0,
      description: 'Tareas por revisar',
      href: '/projects',
    },
    {
      title: 'Tareas Completadas',
      value: tasksCompletedCount || 0,
      description: `de ${tasksTotalCount || 0} totales`,
      href: '/projects',
    },
  ] : isPM ? [
    {
      title: 'Mis Proyectos',
      value: projectsTotalCount || 0,
      description: `${projectsActiveCount || 0} activos`,
      href: '/projects',
    },
    {
      title: 'Tareas Completadas',
      value: tasksCompletedCount || 0,
      description: `de ${tasksTotalCount || 0} totales`,
      href: '/projects',
    },
    {
      title: 'Tareas Pendientes',
      value: (tasksTotalCount || 0) - (tasksCompletedCount || 0),
      description: 'Por completar',
      href: '/projects',
    },
  ] : [
    {
      title: 'Usuarios',
      value: usersCount || 0,
      description: 'Total registrados',
      href: '/dashboard/users',
    },
    {
      title: 'Proyectos Activos',
      value: projectsActiveCount || 0,
      description: `de ${projectsTotalCount || 0} totales`,
      href: '/projects',
    },
    {
      title: 'Tareas Completadas',
      value: tasksCompletedCount || 0,
      description: `de ${tasksTotalCount || 0} totales`,
      href: '/projects',
    },
    {
      title: 'Empresas',
      value: companiesCount || 0,
      description: 'Activas',
      href: '/dashboard/companies',
    },
    {
      title: 'Bugs Abiertos',
      value: (bugsOpenCount ?? 0) + (bugsInProgressCount ?? 0),
      description: `de ${(bugsOpenCount ?? 0) + (bugsInProgressCount ?? 0) + (bugsResolvedCount ?? 0) + (bugsClosedCount ?? 0)} total`,
      href: '/dashboard/reports',
    },
  ]

  // Datos para gráfica de proyectos por estado
  const projectStatusData = [
    { name: 'Planif.', key: 'planning', color: '#8E8E93' },
    { name: 'Activo', key: 'in_progress', color: '#0A84FF' },
    { name: 'Pausado', key: 'paused', color: '#FF9F0A' },
    { name: 'Completado', key: 'completed', color: '#30D158' },
    { name: 'Cancelado', key: 'cancelled', color: '#FF453A' },
  ].map(s => ({
    name: s.name,
    color: s.color,
    count: (allProjectsForChart || []).filter(p => p.status === s.key).length,
  })).filter(d => d.count > 0)

  // Datos para gráfica de tareas por estado
  const tasksDone = (allTasksForChart || []).filter(t => t.status === 'done').length
  const tasksInProgressChart = (allTasksForChart || []).filter(t => t.status === 'in_progress').length
  const tasksReviewChart = (allTasksForChart || []).filter(t => t.status === 'review').length
  const tasksTodoChart = (allTasksForChart || []).filter(t => t.status === 'todo').length
  const tasksBacklogChart = (allTasksForChart || []).filter(t => t.status === 'backlog').length

  // Datos para gráfica de bugs
  const bugsOpen = bugsOpenCount ?? 0
  const bugsInProgress = bugsInProgressCount ?? 0
  const bugsResolved = bugsResolvedCount ?? 0
  const bugsClosed = bugsClosedCount ?? 0
  const bugsTotal = bugsOpen + bugsInProgress + bugsResolved + bugsClosed

  const isOverdue = (dueDate: string | null) => {
    if (!dueDate) return false
    return new Date(dueDate) < new Date()
  }

  const formatDate = (date: string | null) => {
    if (!date) return '-'
    return new Date(date).toLocaleDateString('es-CL', { day: '2-digit', month: 'short' })
  }

  const formatTimeAgo = (date: string) => {
    const now = new Date()
    const activityDate = new Date(date)
    const diffMs = now.getTime() - activityDate.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Ahora'
    if (diffMins < 60) return `hace ${diffMins}m`
    if (diffHours < 24) return `hace ${diffHours}h`
    if (diffDays < 7) return `hace ${diffDays}d`
    return formatDate(date)
  }

  const getInitials = (name: string | null) => {
    if (!name) return '??'
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  const statAccents = ['#0A84FF', '#BF5AF2', '#30D158', '#FF9F0A', '#FF453A']

  return (
    <div className="space-y-6 w-full overflow-x-hidden">
      <div>
        <h1 className="text-[28px] font-semibold tracking-tight text-foreground leading-tight">Dashboard</h1>
        <p className="text-[15px] text-muted-foreground mt-1">
          {isAdmin
            ? 'Vista general de usuarios, proyectos, tareas y bugs'
            : 'Resumen de tu operación y actividad reciente'}
        </p>
      </div>

      <div className={`grid gap-3 grid-cols-2 ${isAdmin ? 'lg:grid-cols-5' : isStakeholder ? 'lg:grid-cols-2' : 'md:grid-cols-3'}`}>
        {stats.map((stat, i) => (
          <DashboardStatTile
            key={stat.title}
            title={stat.title}
            value={stat.value}
            description={stat.description}
            href={stat.href}
            accent={statAccents[i % statAccents.length]}
          />
        ))}
      </div>

      <div className={`grid gap-3 ${isStakeholder ? 'md:grid-cols-2' : 'md:grid-cols-3'}`}>
        {!isStakeholder && (
          <DashboardSection title="Actividad" description="Últimas acciones en el sistema">
            {!recentActivity || recentActivity.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No hay actividad reciente</p>
            ) : (
              <div className="space-y-1">
                {recentActivity.map((activity) => {
                  const userData = activity.user as { avatar_url: string | null; full_name: string | null } | { avatar_url: string | null; full_name: string | null }[] | null
                  const user = Array.isArray(userData) ? userData[0] : userData
                  return (
                    <div key={activity.id} className="flex items-start gap-2.5 rounded-2xl px-2 py-2 min-w-0">
                      <Avatar className="w-7 h-7 flex-shrink-0 mt-0.5">
                        <AvatarImage src={user?.avatar_url || undefined} />
                        <AvatarFallback className="text-[10px]">
                          {getInitials(user?.full_name || null)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] text-foreground leading-snug break-words">
                          <span className="font-semibold">{user?.full_name || 'Usuario'}</span>
                          {' '}
                          <span className={actionColors[activity.action] || 'text-muted-foreground'}>
                            {actionLabels[activity.action] || activity.action}
                          </span>
                          {' '}
                          {entityLabels[activity.entity_type] || activity.entity_type}
                          {activity.entity_name && (
                            <span className="font-medium"> &quot;{activity.entity_name}&quot;</span>
                          )}
                        </p>
                        <p className="text-[11px] text-muted-foreground mt-0.5">{formatTimeAgo(activity.created_at)}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </DashboardSection>
        )}

        <DashboardSection
          title="Proyectos"
          description="Últimos proyectos creados"
          action={
            <Link href="/projects" className="text-[13px] font-semibold text-primary hover:opacity-80 transition-opacity">
              Ver todos
            </Link>
          }
        >
          {!recentProjects || recentProjects.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No hay proyectos registrados</p>
          ) : (
            <div className="space-y-1">
              {recentProjects.map((project) => (
                <Link
                  key={project.id}
                  href={`/projects/${project.id}`}
                  className="flex items-center gap-3 rounded-2xl px-2 py-2.5 hover:bg-black/[0.04] dark:hover:bg-white/[0.06] transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-[14px] font-medium text-foreground truncate">{project.name}</p>
                    <p className="text-[12px] text-muted-foreground truncate">{(() => {
                      const companyData = project.company as { name: string } | { name: string }[] | null
                      return Array.isArray(companyData) ? companyData[0]?.name : companyData?.name || 'Sin empresa'
                    })()}</p>
                  </div>
                  <span className={`text-[11px] font-semibold rounded-full px-2.5 py-0.5 flex-shrink-0 ${statusColors[project.status]}`}>
                    {statusLabels[project.status]}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </DashboardSection>

        {!isStakeholder && (
          <DashboardSection
            title={isDeveloper ? 'Mis Tareas' : 'Prioritarias'}
            description={isDeveloper ? 'Tareas asignadas a ti' : 'Urgentes o de alta prioridad'}
          >
            {!urgentTasks || urgentTasks.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No hay tareas urgentes pendientes</p>
            ) : (
              <div className="space-y-1">
                {urgentTasks.map((task) => {
                  const projectData = task.project as { id: string; name: string } | { id: string; name: string }[] | null
                  const project = Array.isArray(projectData) ? projectData[0] : projectData
                  return (
                    <Link
                      key={task.id}
                      href={`/projects/${project?.id}`}
                      className="block rounded-2xl px-2 py-2.5 hover:bg-black/[0.04] dark:hover:bg-white/[0.06] transition-colors"
                    >
                      <div className="flex items-center justify-between gap-2 min-w-0">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span className="text-[11px] text-muted-foreground flex-shrink-0">#{task.task_number}</span>
                            <p className="text-[14px] font-medium text-foreground truncate">{task.title}</p>
                          </div>
                          <p className="text-[12px] text-muted-foreground truncate mt-0.5">{project?.name}</p>
                        </div>
                        <div className="flex flex-col items-end gap-1 flex-shrink-0">
                          {task.due_date && (
                            <span className={`text-[11px] ${isOverdue(task.due_date) ? 'text-red-500 font-semibold' : 'text-muted-foreground'}`}>
                              {formatDate(task.due_date)}
                            </span>
                          )}
                          <span className={`text-[11px] font-semibold rounded-full px-2.5 py-0.5 ${task.priority === 'urgent' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'}`}>
                            {task.priority === 'urgent' ? 'Urgente' : 'Alta'}
                          </span>
                        </div>
                      </div>
                    </Link>
                  )
                })}
              </div>
            )}
          </DashboardSection>
        )}
      </div>

      {!isStakeholder && (
        <div className={`grid gap-3 ${isAdmin ? 'md:grid-cols-4' : 'md:grid-cols-3'}`}>
          <DashboardSection title={isDeveloper ? 'Mi Progreso' : 'Tareas'} description="Distribución por estado">
            <TaskStatusChart
              done={isDeveloper ? (myTasksCompletedCount || 0) : tasksDone}
              inProgress={tasksInProgressChart}
              review={tasksReviewChart}
              pending={tasksTodoChart}
              backlog={tasksBacklogChart}
            />
          </DashboardSection>

          <DashboardSection title="Proyectos" description="Por estado">
            <ProjectStatusChart data={projectStatusData} />
          </DashboardSection>

          <DashboardSection
            title="Bugs"
            description={bugsTotal > 0 ? `${bugsOpen + bugsInProgress} activos de ${bugsTotal}` : 'Sin bugs registrados'}
          >
            <BugStatusChart
              open={bugsOpen}
              inProgress={bugsInProgress}
              resolved={bugsResolved}
              closed={bugsClosed}
            />
          </DashboardSection>

          {isAdmin && (
            <DashboardSection title="Usuarios" description="Distribución de roles">
              <UsersRoleChart
                data={Object.entries(roleCounts).map(([role, count]) => ({
                  role,
                  label: roleLabels[role] || role,
                  count,
                }))}
              />
            </DashboardSection>
          )}
        </div>
      )}

      {!isStakeholder && (
        <UpcomingMeetings />
      )}

      {(isAdmin || isPM) && (
        <UnassignedTasks />
      )}

      {(isAdmin || isPM) && (
        <OpenBugsList />
      )}
    </div>
  )
}
