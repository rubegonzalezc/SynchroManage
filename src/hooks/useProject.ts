import useSWR from 'swr'
import type { Sprint } from '@/components/dashboard/projects/CreateSprintDialog'

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
  sprint_id: string | null
  is_carry_over: boolean
  complexity?: number | null
  assignees: { id: string; full_name: string; avatar_url: string | null }[]
  assignee?: { id: string; full_name: string; avatar_url: string | null } | null
}

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
  tasks: Task[]
  sprints: Sprint[]
}

interface UseProjectReturn {
  project: Project | undefined
  isLoading: boolean
  error: Error | undefined
  mutate: () => void
}

export function useProject(projectId: string): UseProjectReturn {
  const { data, error, isLoading, mutate } = useSWR<{ project: Project }>(
    projectId ? `/api/dashboard/projects/${projectId}` : null
  )

  return {
    project: data?.project,
    isLoading,
    error,
    mutate,
  }
}
