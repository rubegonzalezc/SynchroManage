'use client'

import { AppBar, Box, IconButton, InputBase, Stack, Toolbar } from '@mui/material'
import MenuRounded from '@mui/icons-material/MenuRounded'
import SearchRounded from '@mui/icons-material/SearchRounded'
import { NotificationsDropdown } from '@/components/dashboard/NotificationsDropdown'
import { ThemeToggle } from '@/components/theme-toggle'
import { useTheme } from '@/components/theme-provider'
import { tokens } from '@/theme/designTokens'

interface AppHeaderProps {
  onMenuClick: () => void
}

export function AppHeader({ onMenuClick }: AppHeaderProps) {
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme === 'dark'

  const glass = {
    bgcolor: isDark ? 'rgba(44, 44, 46, 0.62)' : 'rgba(255, 255, 255, 0.72)',
    backdropFilter: 'blur(28px) saturate(180%)',
    WebkitBackdropFilter: 'blur(28px) saturate(180%)',
    border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(255,255,255,0.7)',
    boxShadow: '0 8px 28px rgba(15, 23, 42, 0.06)',
  }

  return (
    <AppBar
      position="sticky"
      elevation={0}
      sx={{ top: 0, bgcolor: 'transparent', color: 'text.primary' }}
    >
      <Toolbar sx={{ minHeight: { xs: 52, md: 60 }, px: 0, gap: 1.25 }} className="animate-fade-in">
        <IconButton
          onClick={onMenuClick}
          sx={{
            display: { md: 'none' },
            color: 'text.primary',
            width: 40,
            height: 40,
            borderRadius: '12px',
            ...glass,
          }}
          aria-label="Abrir menú"
        >
          <MenuRounded />
        </IconButton>

        <Box
          sx={{
            display: { xs: 'none', md: 'flex' },
            flex: 1,
            alignItems: 'center',
            maxWidth: 420,
            height: 40,
            px: 1.75,
            borderRadius: 999,
            ...glass,
          }}
        >
          <SearchRounded sx={{ fontSize: 18, color: 'text.secondary', mr: 1 }} />
          <InputBase
            readOnly
            placeholder="Buscar"
            sx={{ flex: 1, fontSize: 15, letterSpacing: '-0.01em' }}
            inputProps={{ 'aria-label': 'Búsqueda global' }}
          />
        </Box>

        <Stack
          direction="row"
          spacing={0.25}
          sx={{
            ml: 'auto',
            alignItems: 'center',
            height: 40,
            px: 0.4,
            borderRadius: 999,
            ...glass,
          }}
        >
          <ThemeToggle />
          <NotificationsDropdown />
        </Stack>
      </Toolbar>
    </AppBar>
  )
}

export const SIDEBAR_WIDTH = tokens.sidebarWidth
