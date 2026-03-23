'use client'

import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'
import { DashboardSidebar } from '@/components/dashboard/DashboardSidebar'

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
  return (
    <SidebarProvider defaultOpen={true}>
      <DashboardSidebar user={user} />
      <SidebarInset>
        <main className="flex-1 bg-muted/50 p-6">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
