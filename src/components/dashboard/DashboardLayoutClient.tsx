'use client'

import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar'
import { DashboardSidebar } from '@/components/dashboard/DashboardSidebar'
import { Separator } from '@/components/ui/separator'

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
    <SidebarProvider>
      <DashboardSidebar user={user} />
      <SidebarInset>
        <header className="flex h-14 items-center gap-4 border-b border-border bg-background px-6">
          <SidebarTrigger className="-ml-2 text-muted-foreground" />
          <Separator orientation="vertical" className="h-6" />
          <div className="flex-1" />
        </header>
        <main className="flex-1 bg-muted/50 p-6">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
