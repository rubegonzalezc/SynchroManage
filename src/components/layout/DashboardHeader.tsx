'use client'

import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { NotificationsDropdown } from '@/components/dashboard/NotificationsDropdown'
import { ThemeToggle } from '@/components/theme-toggle'

export function DashboardHeader() {
  return (
    <header className="hidden md:flex items-center gap-3 mb-6 liquid-glass px-4 py-2.5 rounded-full">
      <div className="relative flex-1 max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
        <Input
          readOnly
          placeholder="Buscar proyectos, tareas, personas..."
          className="pl-9 h-9 border-0 bg-transparent shadow-none focus-visible:ring-0 rounded-full"
          aria-label="Búsqueda global"
        />
      </div>
      <div className="ml-auto flex items-center gap-1">
        <ThemeToggle />
        <NotificationsDropdown />
      </div>
    </header>
  )
}
