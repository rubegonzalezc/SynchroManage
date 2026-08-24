'use client'

import Image from 'next/image'
import { Menu } from 'lucide-react'
import { NotificationsDropdown } from './NotificationsDropdown'
import { ThemeToggle } from '@/components/theme-toggle'

interface MobileNavbarProps {
  onMenuClick: () => void
  orgName?: string
}

export function MobileNavbar({ onMenuClick, orgName = 'SynchroManage' }: MobileNavbarProps) {
  return (
    <header className="md:hidden fixed top-0 left-0 right-0 z-30 h-14 bg-[#0F172A]/95 dark:bg-[#111C31]/95 backdrop-blur-xl border-b border-white/10 dark:border-white/[0.16] flex items-center px-3 gap-3">
      <button
        onClick={onMenuClick}
        className="p-2 rounded-full text-white/70 hover:text-white hover:bg-white/10 transition-all duration-300 flex-shrink-0"
        aria-label="Abrir menú"
      >
        <Menu className="w-5 h-5" />
      </button>

      <div className="flex items-center gap-2 flex-1 min-w-0">
        <div className="relative w-8 h-8 flex-shrink-0">
          <Image
            src="/logo/isotipo-blanco.png"
            alt={orgName}
            fill
            className="object-contain"
          />
        </div>
        <div className="flex flex-col min-w-0">
          <span className="text-sm font-semibold text-white leading-tight truncate">
            {orgName}
          </span>
          <span className="text-[10px] text-white/50 leading-tight">Panel</span>
        </div>
      </div>

      <div className="flex items-center gap-1 flex-shrink-0 text-white">
        <ThemeToggle />
        <NotificationsDropdown />
      </div>
    </header>
  )
}
