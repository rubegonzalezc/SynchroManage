import useSWR from 'swr'
import type { Sprint } from '@/components/dashboard/projects/CreateSprintDialog'

interface UseSprintsReturn {
  sprints: Sprint[]
  isLoading: boolean
  error: Error | undefined
  mutate: () => void
}

export function useSprints(projectId: string): UseSprintsReturn {
  const { data, error, isLoading, mutate } = useSWR<{ sprints: Sprint[] }>(
    projectId ? `/api/dashboard/projects/${projectId}/sprints` : null
  )

  return {
    sprints: data?.sprints ?? [],
    isLoading,
    error,
    mutate,
  }
}
