import { useProject } from '@/hooks/useProject'
import type { ProjectTask } from '@/lib/types/task'

export type { ProjectTask }

/** Hook tipado con campos sprint_id / sprint_order expuestos por la API (HU-06). */
export function useProjectTasks(projectId: string) {
  const { project, isLoading, error, mutate, optimisticMoveTask, applyTaskPatch } =
    useProject(projectId)

  return {
    project,
    tasks: (project?.tasks ?? []) as ProjectTask[],
    isLoading,
    error,
    mutate,
    optimisticMoveTask,
    applyTaskPatch,
  }
}
