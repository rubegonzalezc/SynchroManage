'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import Image from 'next/image'
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
  X,
} from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { createClient } from '@/lib/supabase/client'
import { useTheme } from '@/components/theme-provider'

interface MenuItem {
  title: string
  icon: typeof LayoutDashboard
  href: string
  roles?: string[]
}

const menuItems: MenuItem[] = [
  { title: 'Dashboard', icon: LayoutDashboard, href: '/dashboard' },
  { title: 'Mis Tareas', icon: ListTodo, href: '/my-tasks', roles: ['admin', 'pm', 'tech_lead', 'developer'] },
  { title: 'Usuarios', icon: Users, href: '/dashboard/users', roles: ['admin'] },
  { title: 'Empresas', icon: Building2, href: '/dashboard/companies', roles: ['admin'] },
  { title: 'Proyectos', icon: FolderKanban, href: '/projects', roles: ['admin', 'pm', 'tech_lead', 'developer', 'stakeholder'] },
  { title: 'Configuración', icon: Settings, href: '/dashboard/settings', roles: ['admin'] },
]

const roleLabels: Record<string, string> = {
  admin: 'Administrador',
  pm: 'Project Manager',
  tech_lead: 'Tech Lead',
  developer: 'Desarrollador',
  stakeholder: 'Stakeholder',
}

interface MobileSidebarProps {
  open: boolean
  onClose: () => void
  user: {
    email: string
    full_name: string | null
    avatar_url: string | null
    role?: string
  }
}

export function MobileSidebar({ open, onClose, user }: MobileSidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const { resolvedTheme } = useTheme()
  const userRole = user.role || 'admin'

  const filteredMenuItems = menuItems.filter(item => {
    if (!item.roles) return true
    return item.roles.includes(userRole)
  })

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const getInitials = (name: string | null, email: string) => {
    if (name) return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    return email.slice(0, 2).toUpperCase()
  }

  return (
    <>
      {/* Overlay */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        />
      )}

      {/* Drawer */}
      <aside
        className={`fixed top-0 left-0 z-50 h-full w-72 bg-sidebar border-r border-border flex flex-col transition-transform duration-300 ease-in-out ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Header del sidebar: solo logo + botón cerrar */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="relative w-9 h-9 flex-shrink-0">
              <Image
                src={resolvedTheme === 'dark' ? '/logo/isotipo-blanco.png' : '/logo/isotipo-negro.png'}
                alt="SynchroManage"
                fill
                className="object-contain"
              />
            </div>
            <div className="flex flex-col">
              <span className="font-semibold text-sm text-sidebar-foreground">SynchroManage</span>
              <span className="text-xs text-muted-foreground">Panel</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Menú principal */}
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <p className="text-xs text-muted-foreground px-2 mb-2 font-medium">Menú Principal</p>
          <ul className="space-y-1">
            {filteredMenuItems.map((item) => {
              const isActive = pathname === item.href
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={onClose}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-colors ${
                      isActive
                        ? 'bg-accent text-accent-foreground font-medium'
                        : 'text-sidebar-foreground hover:bg-accent/60 hover:text-accent-foreground'
                    }`}
                  >
                    <item.icon className="w-4 h-4 flex-shrink-0" />
                    <span>{item.title}</span>
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>

        {/* Footer: perfil con dropdown */}
        <div className="border-t border-border px-3 py-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md hover:bg-accent transition-colors text-left">
                <Avatar className="w-8 h-8 flex-shrink-0">
                  <AvatarImage src={user.avatar_url || undefined} />
                  <AvatarFallback className="bg-muted text-muted-foreground text-xs">
                    {getInitials(user.full_name, user.email)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col flex-1 min-w-0">
                  <span className="text-sm font-medium text-foreground truncate">
                    {user.full_name || user.email}
                  </span>
                  <span className="text-xs text-muted-foreground truncate">
                    {roleLabels[userRole] || userRole}
                  </span>
                </div>
                <ChevronUp className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="top" align="start" className="w-56">
              <DropdownMenuItem asChild>
                <Link href="/profile" onClick={onClose} className="flex items-center cursor-pointer">
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
        </div>
      </aside>
    </>
  )
}
