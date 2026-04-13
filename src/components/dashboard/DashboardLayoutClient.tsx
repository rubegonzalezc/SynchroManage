'use client'

import { useState } from 'react'
import { SWRConfig } from 'swr'
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'
import { DashboardSidebar } from '@/components/dashboard/DashboardSidebar'
import { MobileNavbar } from '@/components/dashboard/MobileNavbar'
import { MobileSidebar } from '@/components/dashboard/MobileSidebar'

const fetcher = (url: string) =>
  fetch(url).then(res => {
    if (!res.ok) throw new Error('Error al cargar datos')
    return res.json()
  })

interface DashboardLayoutClientProps {
  user: {
    email: string
    full_name: string | null
    avatar_url: string | null
    role?: string
  }
  children: React.ReactNode
}

export function DashboardLayoutClient({ user, children }: DashboardLayoutClientProps) {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)

  return (
    <SWRConfig value={{
      fetcher,
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 30000,
    }}>
      <SidebarProvider defaultOpen={true}>
        {/* Mobile: navbar fija (ya tiene md:hidden y fixed internamente) */}
        <MobileNavbar onMenuClick={() => setMobileSidebarOpen(true)} />
        <MobileSidebar
          open={mobileSidebarOpen}
          onClose={() => setMobileSidebarOpen(false)}
          user={user}
        />

        {/* Desktop: sidebar (ya tiene hidden md:block internamente) */}
        <DashboardSidebar user={user} />

        {/* Contenido — renderizado una sola vez */}
        <SidebarInset>
          <main className="flex-1 bg-muted/50 pt-14 md:pt-0 p-4 md:p-6">
            {children}
          </main>
        </SidebarInset>
      </SidebarProvider>
    </SWRConfig>
  )
}
