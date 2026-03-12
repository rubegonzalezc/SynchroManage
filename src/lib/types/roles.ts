export type RoleName = 'admin' | 'pm' | 'tech_lead' | 'developer' | 'stakeholder'

export interface Role {
  id: number
  name: RoleName
  description: string
  created_at: string
}

export interface Profile {
  id: string
  email: string | null
  full_name: string | null
  avatar_url: string | null
  role_id: number
  created_at: string | null
  updated_at: string | null
  role?: Role
}

// Permisos por rol
export const PERMISSIONS = {
  // Gestión de usuarios
  MANAGE_USERS: ['admin'],
  
  // Proyectos
  CREATE_PROJECT: ['admin', 'pm'],
  EDIT_PROJECT: ['admin', 'pm'],
  DELETE_PROJECT: ['admin'],
  VIEW_ALL_PROJECTS: ['admin', 'pm', 'tech_lead'],
  VIEW_ASSIGNED_PROJECTS: ['admin', 'pm', 'tech_lead', 'developer', 'stakeholder'],
  
  // Tareas
  ASSIGN_TASKS: ['admin', 'pm', 'tech_lead'],
  CREATE_TASKS: ['admin', 'pm', 'tech_lead', 'developer'],
  EDIT_OWN_TASKS: ['admin', 'pm', 'tech_lead', 'developer'],
  DELETE_TASKS: ['admin', 'pm'],
  
  // Reportes
  VIEW_REPORTS: ['admin', 'pm', 'tech_lead', 'stakeholder'],
  EXPORT_REPORTS: ['admin', 'pm'],
} as const

export type Permission = keyof typeof PERMISSIONS

// --- Multi-Rol y Multi-Desarrollador ---

export interface UserRole {
  user_id: string
  role_id: number
  role?: Role
}

export interface ProfileWithRoles extends Profile {
  roles: RoleName[]
  user_roles?: UserRole[]
}

export interface TaskAssignee {
  id: string
  full_name: string
  avatar_url: string | null
}

export const ROLE_HIERARCHY: RoleName[] = ['admin', 'pm', 'tech_lead', 'developer', 'stakeholder']

export function getPrimaryRole(roles: RoleName[]): RoleName {
  for (const role of ROLE_HIERARCHY) {
    if (roles.includes(role)) return role
  }
  return 'stakeholder'
}

export function hasRole(userRoles: RoleName[], targetRole: RoleName): boolean {
  return userRoles.includes(targetRole)
}
