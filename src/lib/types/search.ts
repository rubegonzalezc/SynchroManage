/** Respuesta tipada de GET /api/dashboard/search (HU-02). */

export interface DashboardSearchProject {
  id: string
  name: string
  status: string
  type: string
}

export interface DashboardSearchTask {
  id: string
  task_number: number | null
  title: string
  status: string
  project_id: string
  project: { id: string; name: string } | null
}

export interface DashboardSearchBug {
  id: string
  title: string
  status: string
  severity: string
  project_id: string
  project: { id: string; name: string } | null
}

export interface DashboardSearchUser {
  id: string
  full_name: string
  email: string
  avatar_url: string | null
}

export interface DashboardSearchResponse {
  tasks: DashboardSearchTask[]
  projects: DashboardSearchProject[]
  bugs: DashboardSearchBug[]
  users: DashboardSearchUser[]
}

export const EMPTY_DASHBOARD_SEARCH_RESPONSE: DashboardSearchResponse = {
  tasks: [],
  projects: [],
  bugs: [],
  users: [],
}
