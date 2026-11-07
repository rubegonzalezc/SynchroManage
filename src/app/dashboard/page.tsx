import { getServerSession } from '@/lib/auth/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { resolveVisibleProjectScope } from '@/lib/utils/project-visibility'
import { redirect } from 'next/navigation'
import { UpcomingMeetings } from '@/components/dashboard/UpcomingMeetings'
import { DashboardCharts } from '@/components/dashboard/DashboardCharts'
import { DashboardHome } from '@/components/dashboard/DashboardHome'
import { UnassignedTasks } from '@/components/dashboard/UnassignedTasks'
import { OpenBugsList } from '@/components/dashboard/OpenBugsList'

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
  const session = await getServerSession()
  if (!session?.user) redirect('/login')

  const supabase = createAdminClient()
  const userId = session.user.id

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, role:roles(name)')
    .eq('id', userId)
    .single()
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const roleName = (profile?.role as any)?.name
  const isPM = roleName === 'pm'
  const isTechLead = roleName === 'tech_lead'
  const isDeveloper = roleName === 'developer'
  const isStakeholder = roleName === 'stakeholder'
  const isAdmin = roleName === 'admin'
  const isScopedMember = isTechLead || isDeveloper || isStakeholder
  const usesProjectScope = isPM || isScopedMember
  const isScopedDashboard = isPM || isDeveloper

  const projectScope = await resolveVisibleProjectScope(supabase, userId, roleName)
  const memberProjectIds =
    projectScope.mode === 'ids' ? projectScope.projectIds : []
  const hasMemberProjects = memberProjectIds.length > 0

  let developerTaskIds: string[] = []
  if (isDeveloper && userId) {
    const { data: assigneeRows } = await supabase
      .from('task_assignees')
      .select('task_id')
      .eq('user_id', userId)
    developerTaskIds = assigneeRows?.map((row) => row.task_id) || []
  }

  const fetchScopedActivity = () => {
    const parts = [`user_id.eq.${userId}`]
    if (hasMemberProjects) {
      parts.push(`details->>project_id.in.(${memberProjectIds.join(',')})`)
      parts.push(`and(entity_type.eq.project,entity_id.in.(${memberProjectIds.join(',')}))`)
    }
    if (isDeveloper && developerTaskIds.length > 0) {
      parts.push(`and(entity_type.eq.task,entity_id.in.(${developerTaskIds.join(',')}))`)
    }
    return supabase
      .from('activity_log')
      .select('*, user:profiles(id, full_name, avatar_url)')
      .or(parts.join(','))
      .order('created_at', { ascending: false })
      .limit(8)
  }

  const emptyCount = { count: 0 }
  const emptyData = { data: [] as never[] }

  // Obtener estadísticas en paralelo (filtradas por rol)
  // Las queries de bugs se consolidan en una sola para reducir round-trips
  // Las meetings, unassigned tasks y open bugs se obtienen aquí para evitar fetches client-side
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
    { data: bugsForChart },
    meetingsResult,
    reportsResult,
  ] = await Promise.all([
    // Total usuarios (solo admin)
    isAdmin 
      ? supabase.from('profiles').select('*', { count: 'exact', head: true })
      : { count: 0 },
    // Proyectos activos
    usesProjectScope
      ? hasMemberProjects
        ? supabase.from('projects').select('*', { count: 'exact', head: true }).eq('status', 'in_progress').in('id', memberProjectIds)
        : emptyCount
      : supabase.from('projects').select('*', { count: 'exact', head: true }).eq('status', 'in_progress'),
    // Total proyectos
    usesProjectScope
      ? hasMemberProjects
        ? supabase.from('projects').select('*', { count: 'exact', head: true }).in('id', memberProjectIds)
        : emptyCount
      : supabase.from('projects').select('*', { count: 'exact', head: true }),
    // Tareas completadas (developer: contadores personales; resto por proyectos visibles)
    isDeveloper
      ? emptyCount
      : usesProjectScope && hasMemberProjects
        ? supabase.from('tasks').select('*', { count: 'exact', head: true }).eq('status', 'done').in('project_id', memberProjectIds)
        : usesProjectScope
          ? emptyCount
          : supabase.from('tasks').select('*', { count: 'exact', head: true }).eq('status', 'done'),
    // Total tareas
    isDeveloper
      ? emptyCount
      : usesProjectScope && hasMemberProjects
        ? supabase.from('tasks').select('*', { count: 'exact', head: true }).in('project_id', memberProjectIds)
        : usesProjectScope
          ? emptyCount
          : supabase.from('tasks').select('*', { count: 'exact', head: true }),
    // Tareas en revisión (para Tech Lead)
    isTechLead && memberProjectIds.length > 0
      ? supabase.from('tasks').select('*', { count: 'exact', head: true }).eq('status', 'review').in('project_id', memberProjectIds)
      : { count: 0 },
    // Mis tareas asignadas (para Developer — vía task_assignees)
    isDeveloper && developerTaskIds.length > 0
      ? supabase.from('tasks').select('*', { count: 'exact', head: true }).in('id', developerTaskIds).neq('status', 'done')
      : emptyCount,
    // Mis tareas completadas (para Developer)
    isDeveloper && developerTaskIds.length > 0
      ? supabase.from('tasks').select('*', { count: 'exact', head: true }).in('id', developerTaskIds).eq('status', 'done')
      : emptyCount,
    // Total empresas (solo admin)
    isAdmin
      ? supabase.from('companies').select('*', { count: 'exact', head: true }).eq('is_active', true)
      : { count: 0 },
    // Usuarios por rol (solo admin)
    isAdmin
      ? supabase.from('profiles').select('role:roles(name)')
      : { data: [] },
    // Proyectos recientes
    usesProjectScope
      ? hasMemberProjects
        ? supabase.from('projects')
            .select('id, name, status, company:companies(name)')
            .in('id', memberProjectIds)
            .order('created_at', { ascending: false })
            .limit(5)
        : emptyData
      : supabase.from('projects')
          .select('id, name, status, company:companies(name)')
          .order('created_at', { ascending: false })
          .limit(5),
    // Tareas urgentes o asignadas (stakeholder no ve tareas)
    isStakeholder
      ? { data: [] }
      : isDeveloper && developerTaskIds.length > 0
        ? supabase.from('tasks')
            .select('id, title, task_number, priority, due_date, status, project:projects(id, name)')
            .in('id', developerTaskIds)
            .neq('status', 'done')
            .order('priority', { ascending: false })
            .order('due_date', { ascending: true })
            .limit(5)
      : isDeveloper
        ? emptyData
        : isPM && hasMemberProjects
          ? supabase.from('tasks')
              .select('id, title, task_number, priority, due_date, status, project:projects(id, name)')
              .or('priority.eq.urgent,priority.eq.high')
              .neq('status', 'done')
              .in('project_id', memberProjectIds)
              .order('due_date', { ascending: true })
              .limit(5)
          : isPM
            ? emptyData
          : isTechLead && hasMemberProjects
            ? supabase.from('tasks')
                .select('id, title, task_number, priority, due_date, status, project:projects(id, name)')
                .or('priority.eq.urgent,priority.eq.high')
                .neq('status', 'done')
                .in('project_id', memberProjectIds)
                .order('due_date', { ascending: true })
                .limit(5)
            : isTechLead || isStakeholder
              ? emptyData
              : supabase.from('tasks')
                  .select('id, title, task_number, priority, due_date, status, project:projects(id, name)')
                  .or('priority.eq.urgent,priority.eq.high')
                  .neq('status', 'done')
                  .order('due_date', { ascending: true })
                  .limit(5),
    // Actividad reciente
    isScopedDashboard
      ? fetchScopedActivity()
      : supabase.from('activity_log')
          .select('*, user:profiles(id, full_name, avatar_url)')
          .order('created_at', { ascending: false })
          .limit(8),
    // Proyectos por estado (para gráfica) — solo status
    usesProjectScope
      ? hasMemberProjects
        ? supabase.from('projects').select('status').in('id', memberProjectIds)
        : emptyData
      : supabase.from('projects').select('status'),
    // Tareas por estado (para gráfica) — solo status
    isDeveloper
      ? developerTaskIds.length > 0
        ? supabase.from('tasks').select('status').in('id', developerTaskIds)
        : emptyData
      : usesProjectScope && hasMemberProjects
        ? supabase.from('tasks').select('status').in('project_id', memberProjectIds)
        : usesProjectScope
          ? emptyData
          : supabase.from('tasks').select('status'),
    // Bugs por estado — solo proyectos del PM; oculto para developer
    isDeveloper
      ? emptyData
      : isPM && hasMemberProjects
        ? supabase.from('bugs').select('status').in('project_id', memberProjectIds)
        : isPM
          ? emptyData
          : supabase.from('bugs').select('status'),
    // Reuniones próximas (para UpcomingMeetings — evita fetch client-side)
    !isStakeholder
      ? (async () => {
          const { data: attendeeRecords } = await supabase
            .from('meeting_attendees')
            .select('meeting_id')
            .eq('user_id', userId!)
          const attendeeMeetingIds = attendeeRecords?.map(r => r.meeting_id) || []
          let q = supabase
            .from('meetings')
            .select(`id, title, start_time, end_time, meeting_link,
              project:projects(id, name),
              organizer:profiles!meetings_organizer_id_fkey(id, full_name, avatar_url),
              attendees:meeting_attendees(id, response, user:profiles(id, full_name, avatar_url))`)
            .gte('end_time', new Date().toISOString())
            .order('start_time', { ascending: true })
            .limit(3)
          if (attendeeMeetingIds.length > 0) {
            q = q.or(`organizer_id.eq.${userId},id.in.(${attendeeMeetingIds.join(',')})`)
          } else {
            q = q.eq('organizer_id', userId!)
          }
          return q
        })()
      : Promise.resolve({ data: [] }),
    // Reports (unassigned tasks + open bugs) — admin global; PM solo sus proyectos
    (isAdmin || isPM)
      ? (async () => {
          if (isPM && !hasMemberProjects) {
            return { unassigned: [], openBugs: [] }
          }

          let unassignedQuery = supabase
            .from('tasks')
            .select('id, task_number, title, status, priority, category, due_date, project:projects(id, name, type)')
            .is('assignee_id', null)

          let openBugsQuery = supabase
            .from('bugs')
            .select('id, title, severity, status, created_at, project:projects(id, name), task:tasks(id, task_number, title), assignee:profiles!bugs_assignee_id_fkey(id, full_name, avatar_url)')
            .in('status', ['open', 'in_progress'])
            .order('created_at', { ascending: false })

          if (isPM) {
            unassignedQuery = unassignedQuery.in('project_id', memberProjectIds)
            openBugsQuery = openBugsQuery.in('project_id', memberProjectIds)
          }

          const [unassignedResult, openBugsResult, taskAssigneeIdsResult] = await Promise.all([
            unassignedQuery,
            openBugsQuery,
            supabase.from('task_assignees').select('task_id'),
          ])
          const taskIdsWithAssignees = new Set((taskAssigneeIdsResult.data || []).map((t: { task_id: string }) => t.task_id))
          const trulyUnassigned = (unassignedResult.data || []).filter((t: { id: string }) => !taskIdsWithAssignees.has(t.id))
          return { unassigned: trulyUnassigned, openBugs: openBugsResult.data || [] }
        })()
      : Promise.resolve({ unassigned: [], openBugs: [] }),
  ])

  // Consolidar conteos de bugs desde la query única
  const bugsOpenCount = (bugsForChart || []).filter((b: { status: string }) => b.status === 'open').length
  const bugsInProgressCount = (bugsForChart || []).filter((b: { status: string }) => b.status === 'in_progress').length
  const bugsResolvedCount = (bugsForChart || []).filter((b: { status: string }) => b.status === 'resolved').length
  const bugsClosedCount = (bugsForChart || []).filter((b: { status: string }) => b.status === 'closed').length

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
      href: '/my-tasks',
    },
    {
      title: 'Completadas',
      value: myTasksCompletedCount || 0,
      description: 'Tareas finalizadas',
      href: '/my-tasks',
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
  const chartTasks = allTasksForChart || []
  const tasksDone = chartTasks.filter((t) => t.status === 'done').length
  const tasksInProgressChart = chartTasks.filter((t) => t.status === 'in_progress').length
  const tasksReviewChart = chartTasks.filter((t) => t.status === 'review').length
  const tasksTodoChart = chartTasks.filter((t) => t.status === 'todo').length
  const tasksBacklogChart = chartTasks.filter((t) => t.status === 'backlog').length

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

  const fullName = (profile as { full_name?: string | null } | null)?.full_name || session.user.name || ''
  const firstName = fullName.trim().split(' ')[0]
  const hour = Number(new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    hourCycle: 'h23',
    timeZone: 'America/Santiago',
  }).format(new Date()))
  const greeting = `${hour < 12 ? 'Buenos días' : hour < 19 ? 'Buenas tardes' : 'Buenas noches'}${firstName ? `, ${firstName}` : ''}`
  const dateLabelRaw = new Intl.DateTimeFormat('es-CL', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    timeZone: 'America/Santiago',
  }).format(new Date())
  const dateLabel = dateLabelRaw.charAt(0).toUpperCase() + dateLabelRaw.slice(1)

  const progressDone = isDeveloper ? (myTasksCompletedCount || 0) : (tasksCompletedCount || 0)
  const progressTotal = isDeveloper
    ? (myTasksCount || 0) + (myTasksCompletedCount || 0)
    : (tasksTotalCount || 0)

  const taskItems = isStakeholder ? null : (urgentTasks || []).map((task) => {
    const projectData = task.project as { id: string; name: string } | { id: string; name: string }[] | null
    const project = Array.isArray(projectData) ? projectData[0] : projectData
    return {
      id: task.id,
      number: task.task_number,
      title: task.title,
      projectName: project?.name || 'Sin proyecto',
      href: project?.id ? `/projects/${project.id}` : '/projects',
      dueLabel: task.due_date ? formatDate(task.due_date) : null,
      overdue: isOverdue(task.due_date),
      priority: task.priority,
    }
  })

  const projectItems = (recentProjects || []).map((project) => {
    const companyData = project.company as { name: string } | { name: string }[] | null
    const company = Array.isArray(companyData) ? companyData[0]?.name : companyData?.name
    return {
      id: project.id,
      name: project.name,
      company: company || 'Sin empresa',
      statusLabel: statusLabels[project.status] || project.status,
      statusClass: statusColors[project.status] || statusColors.planning,
      href: `/projects/${project.id}`,
    }
  })

  const activityItems = isStakeholder ? null : (recentActivity || []).map((activity) => {
    const userData = activity.user as { avatar_url: string | null; full_name: string | null } | { avatar_url: string | null; full_name: string | null }[] | null
    const user = Array.isArray(userData) ? userData[0] : userData
    return {
      id: activity.id,
      name: user?.full_name || 'Usuario',
      avatarUrl: user?.avatar_url || null,
      initials: getInitials(user?.full_name || null),
      action: actionLabels[activity.action] || activity.action,
      actionClass: actionColors[activity.action] || 'text-muted-foreground',
      entity: entityLabels[activity.entity_type] || activity.entity_type,
      entityName: activity.entity_name,
      when: formatTimeAgo(activity.created_at),
    }
  })

  return (
    <DashboardHome
      greeting={greeting}
      dateLabel={dateLabel}
      subtitle={
        isAdmin
          ? 'Usuarios, proyectos, tareas y bugs en un solo vistazo.'
          : isScopedDashboard
            ? isPM
              ? 'Tus proyectos, el equipo y lo que hay que mover hoy.'
              : 'Tus tareas, tus proyectos y lo que pasó recién.'
            : 'El estado de la operación y la actividad reciente.'
      }
      primaryHref={isStakeholder ? '/projects' : '/my-tasks'}
      primaryLabel={isStakeholder ? 'Ver proyectos' : 'Ir a mis tareas'}
      progress={{ done: progressDone, total: progressTotal }}
      stats={stats}
      tasksTitle={isDeveloper ? 'Mis tareas' : 'Prioritarias'}
      tasksDescription={
        isDeveloper
          ? 'Asignadas a ti y todavía abiertas'
          : isPM
            ? 'Urgentes en tus proyectos'
            : 'Urgentes o de alta prioridad'
      }
      tasksHref={isDeveloper ? '/my-tasks' : '/projects'}
      tasks={taskItems}
      projectsDescription={usesProjectScope ? 'Los que tienes asignados' : 'Los últimos creados'}
      projects={projectItems}
      activityDescription={
        isScopedDashboard
          ? isPM
            ? 'Acciones en tus proyectos'
            : 'Acciones en tus proyectos y tareas'
          : 'Últimas acciones en el sistema'
      }
      activity={activityItems}
      meetings={!isStakeholder ? (
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        <UpcomingMeetings initialMeetings={((meetingsResult as any).data ?? []) as any} />
      ) : null}
      aside={(isAdmin || isPM) ? (
        <>
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          <UnassignedTasks tasks={((reportsResult as any).unassigned ?? []) as any} />
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          <OpenBugsList bugs={((reportsResult as any).openBugs ?? []) as any} />
        </>
      ) : null}
      shortcuts={isAdmin ? [
        { href: '/dashboard/users', title: 'Usuarios', description: 'Roles, accesos e invitaciones', tint: 'border-sky-200 bg-sky-50 dark:border-sky-800 dark:bg-sky-950/40' },
        { href: '/dashboard/companies', title: 'Empresas', description: 'Clientes que agrupan proyectos', tint: 'border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/40' },
        { href: '/dashboard/reports', title: 'Reporte', description: 'Carga del equipo y bugs', tint: 'border-violet-200 bg-violet-50 dark:border-violet-800 dark:bg-violet-950/40' },
        { href: '/dashboard/settings', title: 'Configuración', description: 'Organización y valores base', tint: 'border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/40' },
      ] : undefined}
      charts={!isStakeholder ? (
        <DashboardCharts
          variant={isAdmin ? 'admin' : isDeveloper ? 'developer' : isPM ? 'pm' : 'other'}
          tasksDone={tasksDone}
          tasksInProgress={tasksInProgressChart}
          tasksReview={tasksReviewChart}
          tasksTodo={tasksTodoChart}
          tasksBacklog={tasksBacklogChart}
          projectStatusData={projectStatusData}
          bugsOpen={bugsOpen}
          bugsInProgress={bugsInProgress}
          bugsResolved={bugsResolved}
          bugsClosed={bugsClosed}
          bugsTotal={bugsTotal}
          roleCounts={Object.entries(roleCounts).map(([role, count]) => ({
            role,
            label: roleLabels[role] || role,
            count,
          }))}
        />
      ) : null}
    />
  )
}
