'use client'

import { AppBar, Box, IconButton, InputBase, Stack, Toolbar, Typography } from '@mui/material'
import MenuRounded from '@mui/icons-material/MenuRounded'
import SearchRounded from '@mui/icons-material/SearchRounded'
import { NotificationsDropdown } from '@/components/dashboard/NotificationsDropdown'
import { ThemeToggle } from '@/components/theme-toggle'
import { tokens } from '@/theme/designTokens'
import { useSearchCommand } from '@/components/dashboard/SearchCommandProvider'

interface AppHeaderProps {
  onMenuClick: () => void
}

export function AppHeader({ onMenuClick }: AppHeaderProps) {
  const { openPalette } = useSearchCommand()

  // Variables CSS en lugar de `resolvedTheme`: el cristal queda correcto en el
  // primer pintado, sin esperar a que React hidrate.
  const glass = {
    bgcolor: 'var(--glass-bg)',
    backdropFilter: 'blur(28px) saturate(180%)',
    WebkitBackdropFilter: 'blur(28px) saturate(180%)',
    border: '1px solid var(--glass-border)',
    boxShadow: 'var(--shadow-glass)',
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
          component="button"
          type="button"
          onClick={openPalette}
          sx={{
            display: 'flex',
            flex: { xs: 1, md: 'unset' },
            alignItems: 'center',
            maxWidth: { xs: '100%', md: 420 },
            width: { md: 420 },
            height: 40,
            px: 1.75,
            borderRadius: 999,
            cursor: 'pointer',
            textAlign: 'left',
            ...glass,
          }}
          aria-label="Abrir búsqueda rápida"
        >
          <SearchRounded sx={{ fontSize: 18, color: 'text.secondary', mr: 1 }} />
          <InputBase
            readOnly
            placeholder="Buscar"
            sx={{ flex: 1, fontSize: 15, letterSpacing: '-0.01em', pointerEvents: 'none' }}
            inputProps={{ 'aria-hidden': true, tabIndex: -1 }}
          />
          <Typography
            component="span"
            sx={{
              display: { xs: 'none', sm: 'inline' },
              fontSize: 11,
              color: 'text.secondary',
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 1,
              px: 0.75,
              py: 0.25,
              ml: 1,
              whiteSpace: 'nowrap',
            }}
          >
            ⌘K
          </Typography>
        </Box>

        <Stack
          direction="row"
          spacing={0.25}
          sx={{
            ml: { xs: 0, md: 'auto' },
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
