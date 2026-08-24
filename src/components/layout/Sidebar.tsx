'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import {
  Avatar,
  Box,
  Drawer,
  ListItemButton,
  Menu,
  MenuItem,
  Typography,
} from '@mui/material'
import LogoutRounded from '@mui/icons-material/LogoutRounded'
import PersonOutlineRounded from '@mui/icons-material/PersonOutlineRounded'
import KeyboardArrowUpRounded from '@mui/icons-material/KeyboardArrowUpRounded'
import { createClient } from '@/lib/supabase/client'
import { tokens } from '@/theme/designTokens'
import { filterNavItems, isNavActive, navGroups, roleLabels, type NavItem } from './nav-items'

export const DRAWER_WIDTH = tokens.sidebarWidth

interface AppSidebarProps {
  user: {
    email: string
    full_name: string | null
    avatar_url: string | null
    role?: string
  }
  mobileOpen: boolean
  onMobileClose: () => void
}

function getInitials(name: string | null, email: string) {
  if (name) return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  return email.slice(0, 2).toUpperCase()
}

function hexAlpha(hex: string, alpha: number) {
  const h = hex.replace('#', '')
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h
  const n = parseInt(full, 16)
  const r = (n >> 16) & 255
  const g = (n >> 8) & 255
  const b = n & 255
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

const paperReset = {
  width: DRAWER_WIDTH,
  boxSizing: 'border-box' as const,
  height: '100%',
  background: 'none',
  backgroundImage: 'none',
  bgcolor: 'transparent',
  border: 0,
  boxShadow: 'none',
  backdropFilter: 'none',
  WebkitBackdropFilter: 'none',
  borderRadius: 0,
  overflow: 'visible',
}

function NavLink({
  item,
  active,
  onNavigate,
}: {
  item: NavItem
  active: boolean
  onNavigate: () => void
}) {
  const Icon = item.icon
  const accent = item.accent

  return (
    <ListItemButton
      component={Link}
      href={item.href}
      onClick={onNavigate}
      selected={active}
      disableRipple
      sx={{
        position: 'relative',
        minHeight: 44,
        py: 0.7,
        pl: 1.15,
        pr: 1.25,
        mb: 0.45,
        borderRadius: '16px',
        color: active ? '#FFFFFF' : 'rgba(248,250,252,0.82)',
        bgcolor: active ? hexAlpha(accent, 0.2) : 'transparent',
        border: active
          ? `1px solid ${hexAlpha(accent, 0.38)}`
          : '1px solid transparent',
        boxShadow: active
          ? `0 8px 22px ${hexAlpha(accent, 0.22)}, inset 0 1px 0 rgba(255,255,255,0.14)`
          : 'none',
        transition: `background-color 280ms ${tokens.ease}, color 280ms ${tokens.ease}, box-shadow 280ms ${tokens.ease}, border-color 280ms ${tokens.ease}`,
        '&.Mui-selected': {
          bgcolor: hexAlpha(accent, 0.2),
          '&:hover': { bgcolor: hexAlpha(accent, 0.28) },
        },
        '&:hover': {
          bgcolor: active ? hexAlpha(accent, 0.28) : 'rgba(255,255,255,0.06)',
          color: '#FFFFFF',
        },
      }}
    >
      <Box
        sx={{
          position: 'absolute',
          left: 0,
          top: 10,
          bottom: 10,
          width: 3,
          borderRadius: '99px',
          bgcolor: accent,
          opacity: active ? 1 : 0,
          boxShadow: active ? `0 0 10px ${accent}` : 'none',
        }}
      />
      <Box
        sx={{
          width: 32,
          height: 32,
          mr: 1.2,
          borderRadius: '11px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          bgcolor: hexAlpha(accent, active ? 0.28 : 0.14),
          color: active ? accent : hexAlpha(accent, 0.92),
        }}
      >
        <Icon sx={{ fontSize: 18 }} />
      </Box>
      <Typography
        sx={{
          flex: 1,
          fontSize: 13.5,
          fontWeight: active ? 700 : 500,
          letterSpacing: '-0.02em',
        }}
      >
        {item.title}
      </Typography>
    </ListItemButton>
  )
}

function SidebarPanel({
  user,
  onNavigate,
}: {
  user: AppSidebarProps['user']
  onNavigate: () => void
}) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const userRole = user.role || 'admin'
  const items = filterNavItems(userRole)
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)

  const handleLogout = async () => {
    setAnchorEl(null)
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <Box
      sx={{
        position: 'absolute',
        inset: { xs: 0, md: 12 },
        display: 'flex',
        flexDirection: 'column',
        minHeight: 0,
        overflow: 'hidden',
        borderRadius: { xs: 0, md: '28px' },
        bgcolor: 'var(--sidebar-surface)',
        backgroundImage: `
          radial-gradient(ellipse 100% 50% at 0% 0%, var(--sidebar-glow-primary), transparent 55%),
          radial-gradient(ellipse 80% 40% at 100% 0%, var(--sidebar-glow-accent), transparent 50%),
          linear-gradient(180deg, var(--sidebar-sheen) 0%, transparent 22%)
        `,
        border: { xs: 'none', md: '1px solid var(--sidebar-surface-border)' },
        boxShadow: { xs: 'none', md: 'var(--sidebar-shadow)' },
        transition: `background-color 400ms ${tokens.ease}, box-shadow 400ms ${tokens.ease}`,
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1.4,
          px: 1.75,
          pt: 2.1,
          pb: 1.6,
          flexShrink: 0,
        }}
      >
        <Box
          sx={{
            position: 'relative',
            width: 42,
            height: 42,
            flexShrink: 0,
            borderRadius: '14px',
            background: 'linear-gradient(145deg, #3B82F6 0%, #2563EB 42%, #7C3AED 100%)',
            boxShadow: '0 10px 24px rgba(37, 99, 235, 0.4), inset 0 1px 0 rgba(255,255,255,0.35)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Box sx={{ position: 'relative', width: 24, height: 24 }}>
            <Image src="/logo/isotipo-blanco.png" alt="SynchroManage" fill className="object-contain" />
          </Box>
        </Box>
        <Box sx={{ minWidth: 0 }}>
          <Typography
            noWrap
            sx={{
              fontWeight: 700,
              fontSize: 16,
              letterSpacing: '-0.03em',
              color: '#F8FAFC',
              lineHeight: 1.15,
            }}
          >
            SynchroManage
          </Typography>
          <Box
            sx={{
              mt: 0.45,
              display: 'inline-flex',
              px: 0.9,
              py: 0.15,
              borderRadius: '99px',
              bgcolor: 'rgba(96, 165, 250, 0.18)',
              border: '1px solid rgba(147, 197, 253, 0.28)',
            }}
          >
            <Typography
              noWrap
              sx={{ fontSize: 10.5, color: '#93C5FD', fontWeight: 700, letterSpacing: '0.02em' }}
            >
              {roleLabels[userRole] || userRole}
            </Typography>
          </Box>
        </Box>
      </Box>

      <Box
        sx={{
          mx: 1.75,
          height: '1px',
          flexShrink: 0,
          background: 'linear-gradient(90deg, transparent, rgba(147,197,253,0.35), rgba(167,139,250,0.28), transparent)',
          mb: 1.1,
        }}
      />

      <Box
        sx={{
          flex: 1,
          minHeight: 0,
          overflowY: 'auto',
          overflowX: 'hidden',
          px: 1.15,
          pb: 1,
          '&::-webkit-scrollbar': { width: 0 },
        }}
      >
        {navGroups.map((group) => {
          const groupItems = items.filter(item => item.group === group.id)
          if (groupItems.length === 0) return null
          return (
            <Box key={group.id} sx={{ mb: 1.85 }}>
              <Typography
                sx={{
                  px: 1.35,
                  mb: 0.7,
                  fontSize: 10.5,
                  fontWeight: 700,
                  color: 'rgba(186, 210, 255, 0.55)',
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                }}
              >
                {group.label}
              </Typography>
              {groupItems.map((item) => (
                <NavLink
                  key={item.href}
                  item={item}
                  active={isNavActive(pathname, item)}
                  onNavigate={onNavigate}
                />
              ))}
            </Box>
          )
        })}
      </Box>

      <Box sx={{ p: 1.15, pt: 0.25, flexShrink: 0 }}>
        <ListItemButton
          onClick={(e) => setAnchorEl(e.currentTarget)}
          disableRipple
          sx={{
            py: 1.05,
            px: 1.15,
            borderRadius: '18px',
            color: '#F8FAFC',
            bgcolor: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(147, 197, 253, 0.16)',
            backgroundImage: 'linear-gradient(135deg, rgba(37,99,235,0.16) 0%, rgba(124,58,237,0.1) 100%)',
            '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' },
          }}
        >
          <Box
            sx={{
              p: '2px',
              mr: 1.15,
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #60A5FA, #A78BFA)',
              flexShrink: 0,
            }}
          >
            <Avatar
              src={user.avatar_url || undefined}
              sx={{
                width: 32,
                height: 32,
                bgcolor: tokens.primary,
                fontSize: 12,
                fontWeight: 700,
              }}
            >
              {getInitials(user.full_name, user.email)}
            </Avatar>
          </Box>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography noWrap sx={{ fontSize: 13, fontWeight: 700, letterSpacing: '-0.02em' }}>
              {user.full_name || user.email}
            </Typography>
            <Typography noWrap sx={{ fontSize: 11, color: 'rgba(186, 210, 255, 0.62)' }}>
              {user.email}
            </Typography>
          </Box>
          <KeyboardArrowUpRounded sx={{ color: 'rgba(186, 210, 255, 0.55)', fontSize: 20 }} />
        </ListItemButton>
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={() => setAnchorEl(null)}
          anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
          transformOrigin={{ vertical: 'bottom', horizontal: 'center' }}
          slotProps={{ paper: { sx: { width: 220, borderRadius: '16px', mt: -1 } } }}
        >
          <MenuItem
            component={Link}
            href="/profile"
            onClick={() => { setAnchorEl(null); onNavigate() }}
            sx={{ borderRadius: '12px', mx: 0.5, my: 0.25 }}
          >
            <PersonOutlineRounded sx={{ mr: 1.5, fontSize: 20 }} />
            Mi Perfil
          </MenuItem>
          <MenuItem
            onClick={handleLogout}
            sx={{ color: 'error.main', borderRadius: '12px', mx: 0.5, my: 0.25 }}
          >
            <LogoutRounded sx={{ mr: 1.5, fontSize: 20 }} />
            Cerrar Sesión
          </MenuItem>
        </Menu>
      </Box>
    </Box>
  )
}

export function AppSidebar({ user, mobileOpen, onMobileClose }: AppSidebarProps) {
  return (
    <>
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={onMobileClose}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': {
            ...paperReset,
            bgcolor: 'var(--sidebar-surface)',
            overflow: 'hidden',
          },
        }}
      >
        <SidebarPanel user={user} onNavigate={onMobileClose} />
      </Drawer>

      <Drawer
        variant="permanent"
        sx={{
          display: { xs: 'none', md: 'block' },
          width: DRAWER_WIDTH,
          flexShrink: 0,
          '& .MuiDrawer-paper': paperReset,
        }}
        open
      >
        <SidebarPanel user={user} onNavigate={onMobileClose} />
      </Drawer>
    </>
  )
}
