'use client'

import Image from 'next/image'
import { Menu } from 'lucide-react'
import { NotificationsDropdown } from './NotificationsDropdown'
import { ThemeToggle } from '@/components/theme-toggle'
import { useTheme } from '@/components/theme-provider'

interface MobileNavbarProps {
  onMenuClick: () => void
  orgName?: string
}

export function MobileNavbar({ onMenuClick, orgName = 'SynchroManage' }: MobileNavbarProps) {
  const { resolvedTheme } = useTheme()

  return (
    <header className="md:hidden fixed top-0 left-0 right-0 z-30 h-14 bg-sidebar border-b border-border flex items-center px-3 gap-3">
      {/* Botón hamburguesa */}
      <button
        onClick={onMenuClick}
        className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors flex-shrink-0"
        aria-label="Abrir menú"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Logo + nombre + "Panel" */}
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <div className="relative w-8 h-8 flex-shrink-0">
          <Image
            src={resolvedTheme === 'dark' ? '/logo/isotipo-blanco.png' : '/logo/isotipo-negro.png'}
            alt={orgName}
            fill
            className="object-contain"
          />
        </div>
        <div className="flex flex-col min-w-0">
          <span className="text-sm font-semibold text-sidebar-foreground leading-tight truncate">
            {orgName}
          </span>
          <span className="text-xs text-muted-foreground leading-tight">Panel</span>
        </div>
      </div>

      {/* Controles: tema + notificaciones */}
      <div className="flex items-center gap-1 flex-shrink-0">
        <ThemeToggle />
        <NotificationsDropdown />
      </div>
    </header>
  )
}
