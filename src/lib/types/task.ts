/** Tipos compartidos de tarea con campos de sprint (HU-06). */
export interface ProjectTask {
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
  sprint_order: number | null
  is_carry_over: boolean
  carry_over_sprint_order?: number | null
  complexity?: number | null
  depends_on_task_id?: string | null
  depends_on_task_ids?: string[]
  depends_on?: {
    id: string
    task_number: number | null
    title: string
    status: string
    sprint_id?: string | null
    sprint_order?: number | null
  } | null
  dependencies?: {
    id: string
    task_number: number | null
    title: string
    status: string
    sprint_id?: string | null
    sprint_order?: number | null
  }[]
  assignees: { id: string; full_name: string; avatar_url: string | null }[]
  assignee?: { id: string; full_name: string; avatar_url: string | null } | null
}

export interface ProjectTaskInput {
  sprint_id?: string | null
  sprint_order?: number | null
}
