'use client'

import { useState } from 'react'
import { SWRConfig } from 'swr'
import { Box } from '@mui/material'
import { AppSidebar } from '@/components/layout/Sidebar'
import { AppHeader, SIDEBAR_WIDTH } from '@/components/layout/Header'
import { PageTransition } from '@/components/layout/PageTransition'
import { SearchCommandProvider } from '@/components/dashboard/SearchCommandProvider'

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
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <SWRConfig value={{
      fetcher,
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 30000,
    }}>
      <SearchCommandProvider>
        <Box sx={{ display: 'flex', minHeight: '100svh' }}>
          <AppSidebar
            user={user}
            mobileOpen={mobileOpen}
            onMobileClose={() => setMobileOpen(false)}
          />

          <Box
            component="main"
            sx={{
              flexGrow: 1,
              width: { md: `calc(100% - ${SIDEBAR_WIDTH}px)` },
              minWidth: 0,
              px: { xs: 2, md: 4 },
              py: { xs: 1, md: 3 },
              pb: 4,
            }}
          >
            <AppHeader onMenuClick={() => setMobileOpen(true)} />
            <PageTransition>{children}</PageTransition>
          </Box>
        </Box>
      </SearchCommandProvider>
    </SWRConfig>
  )
}
