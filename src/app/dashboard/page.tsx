import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Users, FolderKanban, CheckCircle, ListTodo, Building2, AlertCircle, Activity, Code2 } from 'lucide-react'
import Link from 'next/link'
import { UpcomingMeetings } from '@/components/dashboard/UpcomingMeetings'

const roleLabels: Record<string, string> = {
  admin: 'Administradores',
  pm: 'Project Managers',
  tech_lead: 'Tech Leads',
  developer: 'Desarrolladores',
  stakeholder: 'Stakeholders',
}

const roleColors: Record<string, string> = {
  admin: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  pm: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  tech_lead: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  developer: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  stakeholder: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400',
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
      icon: FolderKanban,
      color: 'text-indigo-600 dark:text-indigo-400',
      bg: 'bg-indigo-50 dark:bg-indigo-900/30',
      href: '/projects',
    },
    {
      title: 'Progreso General',
      value: tasksTotalCount ? Math.round(((tasksCompletedCount || 0) / tasksTotalCount) * 100) : 0,
      description: '% completado',
      icon: CheckCircle,
      color: 'text-green-600 dark:text-green-400',
      bg: 'bg-green-50 dark:bg-green-900/30',
      href: '/projects',
    },
  ] : isDeveloper ? [
    {
      title: 'Mis Tareas',
      value: myTasksCount || 0,
      description: 'Pendientes',
      icon: ListTodo,
      color: 'text-blue-600 dark:text-blue-400',
      bg: 'bg-blue-50 dark:bg-blue-900/30',
      href: '/projects',
    },
    {
      title: 'Completadas',
      value: myTasksCompletedCount || 0,
      description: 'Tareas finalizadas',
      icon: CheckCircle,
      color: 'text-green-600 dark:text-green-400',
      bg: 'bg-green-50 dark:bg-green-900/30',
      href: '/projects',
    },
    {
      title: 'Mis Proyectos',
      value: projectsTotalCount || 0,
      description: `${projectsActiveCount || 0} activos`,
      icon: FolderKanban,
      color: 'text-indigo-600 dark:text-indigo-400',
      bg: 'bg-indigo-50 dark:bg-indigo-900/30',
      href: '/projects',
    },
  ] : isTechLead ? [
    {
      title: 'Mis Proyectos',
      value: projectsTotalCount || 0,
      description: `${projectsActiveCount || 0} activos`,
      icon: FolderKanban,
      color: 'text-indigo-600 dark:text-indigo-400',
      bg: 'bg-indigo-50 dark:bg-indigo-900/30',
      href: '/projects',
    },
    {
      title: 'En Revisión',
      value: tasksInReviewCount || 0,
      description: 'Tareas por revisar',
      icon: Code2,
      color: 'text-purple-600 dark:text-purple-400',
      bg: 'bg-purple-50 dark:bg-purple-900/30',
      href: '/projects',
    },
    {
      title: 'Tareas Completadas',
      value: tasksCompletedCount || 0,
      description: `de ${tasksTotalCount || 0} totales`,
      icon: CheckCircle,
      color: 'text-green-600 dark:text-green-400',
      bg: 'bg-green-50 dark:bg-green-900/30',
      href: '/projects',
    },
  ] : isPM ? [
    {
      title: 'Mis Proyectos',
      value: projectsTotalCount || 0,
      description: `${projectsActiveCount || 0} activos`,
      icon: FolderKanban,
      color: 'text-indigo-600 dark:text-indigo-400',
      bg: 'bg-indigo-50 dark:bg-indigo-900/30',
      href: '/projects',
    },
    {
      title: 'Tareas Completadas',
      value: tasksCompletedCount || 0,
      description: `de ${tasksTotalCount || 0} totales`,
      icon: CheckCircle,
      color: 'text-green-600 dark:text-green-400',
      bg: 'bg-green-50 dark:bg-green-900/30',
      href: '/projects',
    },
    {
      title: 'Tareas Pendientes',
      value: (tasksTotalCount || 0) - (tasksCompletedCount || 0),
      description: 'Por completar',
      icon: ListTodo,
      color: 'text-amber-600 dark:text-amber-400',
      bg: 'bg-amber-50 dark:bg-amber-900/30',
      href: '/projects',
    },
  ] : [
    {
      title: 'Usuarios',
      value: usersCount || 0,
      description: 'Total registrados',
      icon: Users,
      color: 'text-blue-600 dark:text-blue-400',
      bg: 'bg-blue-50 dark:bg-blue-900/30',
      href: '/dashboard/users',
    },
    {
      title: 'Proyectos Activos',
      value: projectsActiveCount || 0,
      description: `de ${projectsTotalCount || 0} totales`,
      icon: FolderKanban,
      color: 'text-indigo-600 dark:text-indigo-400',
      bg: 'bg-indigo-50 dark:bg-indigo-900/30',
      href: '/projects',
    },
    {
      title: 'Tareas Completadas',
      value: tasksCompletedCount || 0,
      description: `de ${tasksTotalCount || 0} totales`,
      icon: CheckCircle,
      color: 'text-green-600 dark:text-green-400',
      bg: 'bg-green-50 dark:bg-green-900/30',
      href: '/projects',
    },
    {
      title: 'Empresas',
      value: companiesCount || 0,
      description: 'Activas',
      icon: Building2,
      color: 'text-amber-600 dark:text-amber-400',
      bg: 'bg-amber-50 dark:bg-amber-900/30',
      href: '/dashboard/companies',
    },
  ]

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

  return (
    <div className="space-y-5 w-full overflow-x-hidden pt-2 md:pt-0">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          {isStakeholder ? 'Resumen de tus proyectos' : isDeveloper ? 'Resumen de tus tareas asignadas' : isTechLead ? 'Resumen de tus proyectos técnicos' : isPM ? 'Resumen de tus proyectos' : 'Bienvenido al panel de administración'}
        </p>
      </div>

      {/* Stats Grid */}
      <div className={`grid gap-3 grid-cols-2 ${isAdmin ? 'lg:grid-cols-4' : isStakeholder ? 'lg:grid-cols-2' : 'md:grid-cols-3'}`}>
        {stats.map((stat) => (
          <Link key={stat.title} href={stat.href}>
            <Card className="hover:border-primary/50 hover:shadow-sm transition-all cursor-pointer h-full">
              <CardHeader className="flex flex-row items-center justify-between pb-2 p-3 md:p-6 md:pb-2">
                <CardTitle className="text-xs md:text-sm font-medium text-muted-foreground leading-tight">
                  {stat.title}
                </CardTitle>
                <div className={`p-1.5 md:p-2 rounded-lg flex-shrink-0 ${stat.bg}`}>
                  <stat.icon className={`w-3.5 h-3.5 md:w-4 md:h-4 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent className="p-3 pt-0 md:p-6 md:pt-0">
                <div className="text-xl md:text-2xl font-bold text-foreground">{stat.value}</div>
                <p className="text-xs text-muted-foreground">{stat.description}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Segunda fila */}
      <div className={`grid gap-4 ${isStakeholder ? 'md:grid-cols-2' : 'md:grid-cols-3'}`}>
        {/* Actividad Reciente - No para Stakeholder */}
        {!isStakeholder && (
          <Card className="overflow-hidden">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Activity className="w-4 h-4 flex-shrink-0" /> Actividad Reciente
              </CardTitle>
              <CardDescription>Últimas acciones en el sistema</CardDescription>
            </CardHeader>
            <CardContent>
              {!recentActivity || recentActivity.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">
                  No hay actividad reciente
                </p>
              ) : (
                <div className="space-y-3">
                  {recentActivity.map((activity) => {
                    const userData = activity.user as { avatar_url: string | null; full_name: string | null } | { avatar_url: string | null; full_name: string | null }[] | null
                    const user = Array.isArray(userData) ? userData[0] : userData
                    return (
                    <div key={activity.id} className="flex items-start gap-2 min-w-0">
                      <Avatar className="w-7 h-7 flex-shrink-0 mt-0.5">
                        <AvatarImage src={user?.avatar_url || undefined} />
                        <AvatarFallback className="bg-muted text-muted-foreground text-xs">
                          {getInitials(user?.full_name || null)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-foreground leading-snug break-words">
                          <span className="font-medium">{user?.full_name || 'Usuario'}</span>
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
                        <p className="text-xs text-muted-foreground mt-0.5">{formatTimeAgo(activity.created_at)}</p>
                      </div>
                    </div>
                  )})}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Proyectos Recientes */}
        <Card className="overflow-hidden">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <FolderKanban className="w-4 h-4 flex-shrink-0" /> Proyectos Recientes
            </CardTitle>
            <CardDescription>Últimos proyectos creados</CardDescription>
          </CardHeader>
          <CardContent>
            {!recentProjects || recentProjects.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">
                No hay proyectos registrados
              </p>
            ) : (
              <div className="space-y-2">
                {recentProjects.map((project) => (
                  <Link
                    key={project.id}
                    href={`/projects/${project.id}`}
                    className="flex items-center gap-2 p-2.5 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground truncate">{project.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{(() => {
                        const companyData = project.company as { name: string } | { name: string }[] | null
                        return Array.isArray(companyData) ? companyData[0]?.name : companyData?.name || 'Sin empresa'
                      })()}</p>
                    </div>
                    <Badge variant="outline" className={`text-xs flex-shrink-0 ${statusColors[project.status]}`}>
                      {statusLabels[project.status]}
                    </Badge>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tareas Urgentes / Mis Tareas - No para Stakeholder */}
        {!isStakeholder && (
          <Card className="overflow-hidden">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                {isDeveloper ? (
                  <><ListTodo className="w-4 h-4 text-blue-500 flex-shrink-0" /> Mis Tareas</>
                ) : (
                  <><AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0" /> Tareas Prioritarias</>
                )}
              </CardTitle>
              <CardDescription>
                {isDeveloper ? 'Tareas asignadas a ti' : 'Tareas urgentes o de alta prioridad'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!urgentTasks || urgentTasks.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">
                  No hay tareas urgentes pendientes
                </p>
              ) : (
                <div className="space-y-2">
                  {urgentTasks.map((task) => {
                    const projectData = task.project as { id: string; name: string } | { id: string; name: string }[] | null
                    const project = Array.isArray(projectData) ? projectData[0] : projectData
                    return (
                    <Link
                      key={task.id}
                      href={`/projects/${project?.id}`}
                      className="block p-2.5 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                    >
                      <div className="flex items-center justify-between gap-2 min-w-0">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span className="text-xs text-muted-foreground flex-shrink-0">#{task.task_number}</span>
                            <p className="text-sm font-medium text-foreground truncate">{task.title}</p>
                          </div>
                          <p className="text-xs text-muted-foreground truncate mt-0.5">{project?.name}</p>
                        </div>
                        <div className="flex flex-col items-end gap-1 flex-shrink-0">
                          {task.due_date && (
                            <span className={`text-xs ${isOverdue(task.due_date) ? 'text-red-600 dark:text-red-400 font-medium' : 'text-muted-foreground'}`}>
                              {formatDate(task.due_date)}
                            </span>
                          )}
                          <Badge variant="outline" className={`text-xs ${task.priority === 'urgent' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'}`}>
                            {task.priority === 'urgent' ? 'Urgente' : 'Alta'}
                          </Badge>
                        </div>
                      </div>
                    </Link>
                  )})}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Tercera fila - No para Stakeholder */}
      {!isStakeholder && (
        <div className={`grid gap-4 ${isAdmin ? 'md:grid-cols-2' : 'md:grid-cols-1'}`}>
          {/* Usuarios por Rol - Solo Admin */}
          {isAdmin && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Users className="w-4 h-4 flex-shrink-0" /> Usuarios por Rol
                </CardTitle>
                <CardDescription>Distribución de roles en el sistema</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(roleCounts).map(([role, count]) => (
                    <div key={role} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full flex-shrink-0 ${roleColors[role]?.split(' ')[0] || 'bg-muted'}`} />
                        <span className="text-sm text-foreground">{roleLabels[role] || role}</span>
                      </div>
                      <span className="text-sm font-medium text-foreground">{count}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Resumen de Tareas */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <ListTodo className="w-4 h-4 flex-shrink-0" /> {isDeveloper ? 'Mi Progreso' : 'Resumen de Tareas'}
              </CardTitle>
              <CardDescription>
                {isDeveloper ? 'Estado de tus tareas asignadas' : isTechLead ? 'Estado de tareas en tus proyectos' : isPM ? 'Estado de tareas en tus proyectos' : 'Estado general de las tareas'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm text-muted-foreground flex-shrink-0">Completadas</span>
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-green-500 rounded-full"
                        style={{ width: `${isDeveloper
                          ? ((myTasksCount || 0) + (myTasksCompletedCount || 0)) > 0
                            ? ((myTasksCompletedCount || 0) / ((myTasksCount || 0) + (myTasksCompletedCount || 0))) * 100
                            : 0
                          : tasksTotalCount
                            ? ((tasksCompletedCount || 0) / tasksTotalCount) * 100
                            : 0}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium text-foreground w-10 text-right flex-shrink-0">
                      {isDeveloper
                        ? ((myTasksCount || 0) + (myTasksCompletedCount || 0)) > 0
                          ? Math.round(((myTasksCompletedCount || 0) / ((myTasksCount || 0) + (myTasksCompletedCount || 0))) * 100)
                          : 0
                        : tasksTotalCount
                          ? Math.round(((tasksCompletedCount || 0) / tasksTotalCount) * 100)
                          : 0}%
                    </span>
                  </div>
                </div>
                <div className={`grid gap-3 pt-1 ${isTechLead ? 'grid-cols-3' : 'grid-cols-2'}`}>
                  <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <p className="text-2xl font-bold text-green-700 dark:text-green-400">
                      {isDeveloper ? (myTasksCompletedCount || 0) : (tasksCompletedCount || 0)}
                    </p>
                    <p className="text-xs text-green-600 dark:text-green-500">Completadas</p>
                  </div>
                  {isTechLead && (
                    <div className="text-center p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                      <p className="text-2xl font-bold text-purple-700 dark:text-purple-400">{tasksInReviewCount || 0}</p>
                      <p className="text-xs text-purple-600 dark:text-purple-500">En Revisión</p>
                    </div>
                  )}
                  <div className="text-center p-3 bg-muted rounded-lg">
                    <p className="text-2xl font-bold text-foreground">
                      {isDeveloper ? (myTasksCount || 0) : (tasksTotalCount || 0) - (tasksCompletedCount || 0)}
                    </p>
                    <p className="text-xs text-muted-foreground">Pendientes</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Reuniones Próximas */}
      {!isStakeholder && (
        <UpcomingMeetings />
      )}
    </div>
  )
}
