'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import Image from 'next/image'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  LayoutDashboard,
  Users,
  FolderKanban,
  Settings,
  ChevronUp,
  LogOut,
  UserCircle,
  Building2,
  ListTodo,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { NotificationsDropdown } from './NotificationsDropdown'
import { ThemeToggle } from '@/components/theme-toggle'

interface MenuItem {
  title: string
  icon: typeof LayoutDashboard
  href: string
  roles?: string[] // Si no se especifica, todos los roles pueden ver
}

const menuItems: MenuItem[] = [
  {
    title: 'Dashboard',
    icon: LayoutDashboard,
    href: '/dashboard',
  },
  {
    title: 'Mis Tareas',
    icon: ListTodo,
    href: '/my-tasks',
    roles: ['admin', 'pm', 'tech_lead', 'developer'],
  },
  {
    title: 'Usuarios',
    icon: Users,
    href: '/dashboard/users',
    roles: ['admin'],
  },
  {
    title: 'Empresas',
    icon: Building2,
    href: '/dashboard/companies',
    roles: ['admin'],
  },
  {
    title: 'Proyectos',
    icon: FolderKanban,
    href: '/projects',
    roles: ['admin', 'pm', 'tech_lead', 'developer', 'stakeholder'],
  },
  {
    title: 'Configuración',
    icon: Settings,
    href: '/dashboard/settings',
    roles: ['admin'],
  },
]

const roleLabels: Record<string, string> = {
  admin: 'Administrador',
  pm: 'Project Manager',
  tech_lead: 'Tech Lead',
  developer: 'Desarrollador',
  stakeholder: 'Stakeholder',
}

interface DashboardSidebarProps {
  user: {
    email: string
    full_name: string | null
    avatar_url: string | null
    role?: string
  }
}

export function DashboardSidebar({ user }: DashboardSidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const userRole = user.role || 'admin'

  // Filtrar items del menú según el rol del usuario
  const filteredMenuItems = menuItems.filter(item => {
    if (!item.roles) return true // Si no tiene roles definidos, todos pueden ver
    return item.roles.includes(userRole)
  })

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const getInitials = (name: string | null, email: string) => {
    if (name) {
      return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    }
    return email.slice(0, 2).toUpperCase()
  }

  return (
    <Sidebar className="border-r border-border">
      <SidebarHeader className="border-b border-border p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative w-10 h-10">
              <Image
                src="/logo/logotipo-v2.png"
                alt="SynchroManage"
                fill
                className="object-contain"
              />
            </div>
            <div className="flex flex-col">
              <span className="font-semibold text-foreground">SynchroManage</span>
              <span className="text-xs text-muted-foreground">Panel</span>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <ThemeToggle />
            <NotificationsDropdown />
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-muted-foreground">Menú Principal</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {filteredMenuItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === item.href}
                    className="data-[active=true]:bg-accent data-[active=true]:text-accent-foreground"
                  >
                    <Link href={item.href}>
                      <item.icon className="w-4 h-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton className="h-auto py-3">
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={user.avatar_url || undefined} />
                    <AvatarFallback className="bg-muted text-muted-foreground text-xs">
                      {getInitials(user.full_name, user.email)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col items-start text-left">
                    <span className="text-sm font-medium text-foreground truncate max-w-[140px]">
                      {user.full_name || user.email}
                    </span>
                    <span className="text-xs text-muted-foreground truncate max-w-[140px]">
                      {roleLabels[userRole] || userRole}
                    </span>
                  </div>
                  <ChevronUp className="ml-auto w-4 h-4 text-muted-foreground" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="top" align="start" className="w-56">
                <DropdownMenuItem asChild>
                  <Link href="/profile" className="flex items-center cursor-pointer">
                    <UserCircle className="w-4 h-4 mr-2" />
                    Mi Perfil
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-red-600 dark:text-red-400">
                  <LogOut className="w-4 h-4 mr-2" />
                  Cerrar Sesión
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
