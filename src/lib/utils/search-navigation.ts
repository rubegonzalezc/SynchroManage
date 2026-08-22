import type {
  DashboardSearchBug,
  DashboardSearchProject,
  DashboardSearchTask,
  DashboardSearchUser,
} from '@/lib/types/search'

export function getTaskSearchHref(task: Pick<DashboardSearchTask, 'id' | 'project_id'>): string {
  return `/projects/${task.project_id}?task=${task.id}`
}

export function getProjectSearchHref(project: Pick<DashboardSearchProject, 'id' | 'type'>): string {
  return project.type === 'change_control'
    ? `/change-controls/${project.id}`
    : `/projects/${project.id}`
}

export function getBugSearchHref(bug: Pick<DashboardSearchBug, 'id' | 'project_id'>): string {
  if (bug.project_id) {
    return `/projects/${bug.project_id}?tab=bugs&bug=${bug.id}`
  }
  return `/dashboard/bugs?bug=${bug.id}`
}

export function getUserSearchHref(
  user: Pick<DashboardSearchUser, 'id'>,
  currentUserId?: string | null
): string {
  if (currentUserId && user.id === currentUserId) return '/profile'
  return `/dashboard/users?user=${user.id}`
}
