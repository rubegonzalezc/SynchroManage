import { revalidateTag } from 'next/cache'

/** Invalida cachés de proyecto/tareas tras mutaciones que afectan sprint_order. */
export function revalidateProjectTaskCaches(
  projectId: string,
  options?: { assigneeIds?: string[] }
) {
  revalidateTag(`project-${projectId}`, 'max')
  revalidateTag(`sprints-${projectId}`, 'max')
  revalidateTag('tasks', 'max')

  for (const userId of options?.assigneeIds ?? []) {
    if (userId) revalidateTag(`my-tasks-${userId}`, 'max')
  }
}
