'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Bug, FolderKanban, Home, ListTodo, MoreHorizontal } from 'lucide-react'
import { filterNavItems, isNavActive } from './nav-items'

interface MobileBottomNavProps {
  role?: string
  onMore: () => void
}

const shortTitle: Record<string, string> = {
  '/dashboard': 'Inicio',
  '/my-tasks': 'Tareas',
  '/projects': 'Proyectos',
  '/dashboard/bugs': 'Bugs',
  '/change-controls': 'Cambios',
}

const icons = {
  '/dashboard': Home,
  '/my-tasks': ListTodo,
  '/projects': FolderKanban,
  '/dashboard/bugs': Bug,
  '/change-controls': FolderKanban,
} as const

export function MobileBottomNav({ role, onMore }: MobileBottomNavProps) {
  const pathname = usePathname()
  const items = filterNavItems(role || 'admin')
  const home = items.find((item) => item.href === '/dashboard')
  const tasks = items.find((item) => item.href === '/my-tasks')
  const projects = items.find((item) => item.href === '/projects')
  const bugs = items.find((item) => item.href === '/dashboard/bugs')
  const changes = items.find((item) => item.href === '/change-controls')
  const tabs = [home, tasks, projects, bugs ?? changes].filter((item): item is NonNullable<typeof item> => !!item)

  return (
    <nav
      className="md:hidden fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      aria-label="Navegación principal"
    >
      <div className="grid h-16" style={{ gridTemplateColumns: `repeat(${tabs.length + 1}, minmax(0, 1fr))` }}>
        {tabs.map((item) => {
          const Icon = icons[item.href as keyof typeof icons] ?? Home
          const active = isNavActive(pathname, item)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center gap-0.5 text-[11px] font-medium ${
                active ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              <Icon className="w-5 h-5" strokeWidth={active ? 2.4 : 1.8} />
              <span>{shortTitle[item.href] ?? item.title}</span>
            </Link>
          )
        })}
        <button
          type="button"
          onClick={onMore}
          className="flex flex-col items-center justify-center gap-0.5 text-[11px] font-medium text-muted-foreground"
        >
          <MoreHorizontal className="w-5 h-5" />
          <span>Más</span>
        </button>
      </div>
    </nav>
  )
}
