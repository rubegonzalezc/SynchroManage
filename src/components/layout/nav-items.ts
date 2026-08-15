import type { SvgIconComponent } from '@mui/icons-material'
import DashboardRounded from '@mui/icons-material/DashboardRounded'
import AssignmentRounded from '@mui/icons-material/AssignmentRounded'
import PeopleRounded from '@mui/icons-material/PeopleRounded'
import BusinessRounded from '@mui/icons-material/BusinessRounded'
import FolderRounded from '@mui/icons-material/FolderRounded'
import AccountTreeRounded from '@mui/icons-material/AccountTreeRounded'
import BarChartRounded from '@mui/icons-material/BarChartRounded'
import SettingsRounded from '@mui/icons-material/SettingsRounded'

export interface NavItem {
  title: string
  href: string
  icon: SvgIconComponent
  group: 'principal' | 'trabajo' | 'admin'
  accent: string
  roles?: string[]
  exact?: boolean
}

export const navGroups: { id: NavItem['group']; label: string }[] = [
  { id: 'principal', label: 'Principal' },
  { id: 'trabajo', label: 'Trabajo' },
  { id: 'admin', label: 'Admin' },
]

export const navItems: NavItem[] = [
  { title: 'Dashboard', href: '/dashboard', icon: DashboardRounded, group: 'principal', accent: '#5B9DFF', exact: true },
  { title: 'Mis Tareas', href: '/my-tasks', icon: AssignmentRounded, group: 'principal', accent: '#34D399', roles: ['admin', 'pm', 'tech_lead', 'developer'] },
  { title: 'Proyectos', href: '/projects', icon: FolderRounded, group: 'trabajo', accent: '#A78BFA', roles: ['admin', 'pm', 'tech_lead', 'developer', 'stakeholder'] },
  { title: 'Control de Cambios', href: '/change-controls', icon: AccountTreeRounded, group: 'trabajo', accent: '#FBBF24', roles: ['admin', 'pm', 'tech_lead', 'developer', 'stakeholder'] },
  { title: 'Usuarios', href: '/dashboard/users', icon: PeopleRounded, group: 'admin', accent: '#38BDF8', roles: ['admin'] },
  { title: 'Empresas', href: '/dashboard/companies', icon: BusinessRounded, group: 'admin', accent: '#FB923C', roles: ['admin'] },
  { title: 'Reporte', href: '/dashboard/reports', icon: BarChartRounded, group: 'admin', accent: '#F472B6', roles: ['admin', 'pm'] },
  { title: 'Configuración', href: '/dashboard/settings', icon: SettingsRounded, group: 'admin', accent: '#94A3B8', roles: ['admin'] },
]

export const roleLabels: Record<string, string> = {
  admin: 'Administrador',
  pm: 'Project Manager',
  tech_lead: 'Tech Lead',
  developer: 'Desarrollador',
  stakeholder: 'Stakeholder',
}

export function filterNavItems(role: string) {
  return navItems.filter(item => !item.roles || item.roles.includes(role))
}

export function isNavActive(pathname: string, item: NavItem) {
  return item.exact
    ? pathname === item.href
    : pathname === item.href || pathname.startsWith(item.href + '/')
}
