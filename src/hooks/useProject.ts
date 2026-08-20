import useSWR from 'swr'
import type { Sprint } from '@/components/dashboard/projects/CreateSprintDialog'
import type { ProjectTask } from '@/lib/types/task'

export type { ProjectTask }

export interface Project {
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

interface UseProjectReturn {
  project: Project | undefined
  isLoading: boolean
  error: Error | undefined
  mutate: () => void
  optimisticMoveTask: (taskId: string, newStatus: string, newPosition: number) => void
  applyTaskPatch: (task: Partial<ProjectTask> & { id: string }) => void
}

const projectFetcher = (url: string) =>
  fetch(url, { cache: 'no-store' }).then((res) => {
    if (!res.ok) throw new Error('Error al cargar el proyecto')
    return res.json()
  })

export function useProject(projectId: string): UseProjectReturn {
  const { data, error, isLoading, mutate } = useSWR<{ project: Project }>(
    projectId ? `/api/dashboard/projects/${projectId}` : null,
    projectFetcher
  )

  // Optimistic update para mover tareas en el Kanban sin esperar al servidor
  const optimisticMoveTask = (taskId: string, newStatus: string, newPosition: number) => {
    if (!data) return
    mutate(
      {
        project: {
          ...data.project,
          tasks: data.project.tasks.map(t =>
            t.id === taskId ? { ...t, status: newStatus, position: newPosition } : t
          ),
        },
      },
      { revalidate: false }
    )
  }

  const applyTaskPatch = (task: Partial<ProjectTask> & { id: string }) => {
    if (!data) return
    mutate(
      {
        project: {
          ...data.project,
          tasks: data.project.tasks.map((t) =>
            t.id === task.id ? { ...t, ...task } : t
          ),
        },
      },
      { revalidate: false }
    )
  }

  return {
    project: data?.project,
    isLoading,
    error,
    mutate,
    optimisticMoveTask,
    applyTaskPatch,
  }
}
