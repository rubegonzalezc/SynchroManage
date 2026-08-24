'use client'

import { useState, useEffect } from 'react'
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
  GitPullRequest,
  X,
  Bug,
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

interface MenuItem {
  title: string
  icon: typeof LayoutDashboard
  href: string
  roles?: string[]
  exact?: boolean
}

const menuItems: MenuItem[] = [
  { title: 'Dashboard', icon: LayoutDashboard, href: '/dashboard', exact: true },
  { title: 'Mis Tareas', icon: ListTodo, href: '/my-tasks', roles: ['admin', 'pm', 'tech_lead', 'developer'] },
  { title: 'Usuarios', icon: Users, href: '/dashboard/users', roles: ['admin'] },
  { title: 'Empresas', icon: Building2, href: '/dashboard/companies', roles: ['admin'] },
  { title: 'Proyectos', icon: FolderKanban, href: '/projects', roles: ['admin', 'pm', 'tech_lead', 'developer', 'stakeholder'] },
  { title: 'Control de Cambios', icon: GitPullRequest, href: '/change-controls', roles: ['admin', 'pm', 'tech_lead', 'developer', 'stakeholder'] },
  { title: 'Bugs', icon: Bug, href: '/dashboard/bugs', roles: ['admin', 'pm', 'tech_lead'] },
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
  const userRole = user.role || 'admin'
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

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
        className={`fixed top-0 left-0 z-50 h-full w-72 bg-[#0F172A] dark:bg-[#111C31] border-r border-white/10 dark:border-white/[0.16] flex flex-col transition-transform duration-300 [transition-timing-function:cubic-bezier(0.22,1,0.36,1)] ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Header del sidebar: solo logo + botón cerrar */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="relative w-9 h-9 flex-shrink-0">
              <Image
                src="/logo/isotipo-blanco.png"
                alt="SynchroManage"
                fill
                className="object-contain"
              />
            </div>
            <div className="flex flex-col">
              <span className="font-semibold text-sm text-white">SynchroManage</span>
              <span className="text-xs text-white/50">Panel</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-white/60 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Menú principal */}
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <p className="text-[11px] uppercase tracking-wider text-white/40 px-2 mb-2 font-medium">Menú</p>
          <ul className="space-y-1">
            {filteredMenuItems.map((item) => {
              const isActive = item.exact 
                ? pathname === item.href 
                : (pathname === item.href || pathname.startsWith(item.href + '/'))
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={onClose}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-full text-sm transition-all duration-300 ${
                      isActive
                        ? 'bg-primary text-white font-medium'
                        : 'text-white/80 hover:bg-white/10 hover:text-white'
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
        <div className="border-t border-white/10 px-3 py-3">
          {mounted ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl hover:bg-white/10 transition-colors text-left">
                <Avatar className="w-8 h-8 flex-shrink-0">
                  <AvatarImage src={user.avatar_url || undefined} />
                  <AvatarFallback className="bg-white/10 text-white text-xs">
                    {getInitials(user.full_name, user.email)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col flex-1 min-w-0">
                  <span className="text-sm font-medium text-white truncate">
                    {user.full_name || user.email}
                  </span>
                  <span className="text-xs text-white/50 truncate">
                    {roleLabels[userRole] || userRole}
                  </span>
                </div>
                <ChevronUp className="w-4 h-4 text-white/40 flex-shrink-0" />
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
          ) : (
            <div className="flex items-center gap-3 px-3 py-2.5">
              <Avatar className="w-8 h-8 flex-shrink-0">
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
            </div>
          )}
        </div>
      </aside>
    </>
  )
}
