'use client'

import { useState } from 'react'
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'
import { DashboardSidebar } from '@/components/dashboard/DashboardSidebar'
import { MobileNavbar } from '@/components/dashboard/MobileNavbar'
import { MobileSidebar } from '@/components/dashboard/MobileSidebar'

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
    <>
      {/* Mobile layout — oculto en md+ via CSS, nunca desmontado */}
      <div className="md:hidden">
        <MobileNavbar onMenuClick={() => setMobileSidebarOpen(true)} />
        <MobileSidebar
          open={mobileSidebarOpen}
          onClose={() => setMobileSidebarOpen(false)}
          user={user}
        />
        <div className="pt-14 min-h-screen bg-muted/50">
          <main className="p-4 w-full overflow-x-hidden">
            {children}
          </main>
        </div>
      </div>

      {/* Desktop layout — oculto en mobile via CSS, nunca desmontado */}
      <div className="hidden md:flex w-full min-h-screen">
        <SidebarProvider defaultOpen={true}>
          <DashboardSidebar user={user} />
          <SidebarInset>
            <main className="flex-1 bg-muted/50 p-6">
              {children}
            </main>
          </SidebarInset>
        </SidebarProvider>
      </div>
    </>
  )
}
