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
import { signOut } from '@/lib/auth/client'
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

  return (
    <ListItemButton
      component={Link}
      href={item.href}
      onClick={onNavigate}
      selected={active}
      disableRipple
      sx={{
        position: 'relative',
        minHeight: 40,
        py: 0.6,
        px: 1.1,
        mb: 0.25,
        borderRadius: '10px',
        color: active ? 'var(--sidebar-active-fg)' : 'var(--sidebar-fg)',
        bgcolor: active ? 'var(--sidebar-active)' : 'transparent',
        '&:hover': {
          bgcolor: active ? 'var(--sidebar-active)' : 'var(--sidebar-hover)',
        },
        '&.Mui-selected': {
          bgcolor: 'var(--sidebar-active)',
          '&:hover': { bgcolor: 'var(--sidebar-active)' },
        },
      }}
    >
      <Icon sx={{ fontSize: 18, mr: 1.25, color: 'inherit', opacity: active ? 1 : 0.8 }} />
      <Typography
        sx={{
          flex: 1,
          fontSize: 13.5,
          fontWeight: active ? 600 : 500,
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
  const userRole = user.role || 'admin'
  const items = filterNavItems(userRole)
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)

  const handleLogout = async () => {
    setAnchorEl(null)
    await signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <Box
      sx={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        minHeight: 0,
        overflow: 'hidden',
        bgcolor: 'var(--sidebar-surface)',
        color: 'var(--sidebar-fg)',
        borderRight: '1px solid var(--sidebar-border)',
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
            width: 36,
            height: 36,
            flexShrink: 0,
            borderRadius: '10px',
            bgcolor: '#2563eb',
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
              color: 'var(--sidebar-fg)',
              lineHeight: 1.15,
            }}
          >
            SynchroManage
          </Typography>
          <Box
            sx={{
              mt: 0.35,
              display: 'inline-flex',
            }}
          >
            <Typography noWrap sx={{ fontSize: 12, color: 'var(--sidebar-muted)', fontWeight: 500 }}>
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
          background: 'var(--sidebar-border)',
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
                  color: 'var(--sidebar-muted)',
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
            borderRadius: '12px',
            color: 'var(--sidebar-fg)',
            border: '1px solid var(--sidebar-border)',
            '&:hover': { bgcolor: 'var(--sidebar-hover)' },
          }}
        >
          <Box
            sx={{
              mr: 1.15,
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
            <Typography noWrap sx={{ fontSize: 12, color: 'var(--sidebar-muted)' }}>
              {user.email}
            </Typography>
          </Box>
          <KeyboardArrowUpRounded sx={{ color: 'var(--sidebar-muted)', fontSize: 20 }} />
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
