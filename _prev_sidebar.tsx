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
import MoreHorizRounded from '@mui/icons-material/MoreHorizRounded'
import { createClient } from '@/lib/supabase/client'
import { tokens } from '@/theme/designTokens'
import { filterNavItems, isNavActive, navGroups, roleLabels } from './nav-items'

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

export function AppSidebar({ user, mobileOpen, onMobileClose }: AppSidebarProps) {
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

  const drawerContent = (
    <Box
      sx={{
        m: { xs: 0, md: 1.5 },
        height: { xs: '100%', md: 'calc(100% - 24px)' },
        display: 'flex',
        flexDirection: 'column',
        borderRadius: { xs: 0, md: '28px' },
        overflow: 'hidden',
        position: 'relative',
        bgcolor: 'rgba(15, 23, 42, 0.72)',
        backdropFilter: 'blur(36px) saturate(180%)',
        WebkitBackdropFilter: 'blur(36px) saturate(180%)',
        border: { xs: 'none', md: '1px solid rgba(255,255,255,0.16)' },
        boxShadow: {
          xs: 'none',
          md: '0 24px 64px rgba(15, 23, 42, 0.22), inset 0 1px 0 rgba(255,255,255,0.18)',
        },
        backgroundImage: `
          radial-gradient(ellipse 120% 50% at 0% -10%, rgba(37, 99, 235, 0.28), transparent 55%),
          linear-gradient(180deg, rgba(255,255,255,0.12) 0%, transparent 28%)
        `,
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          px: 2.25,
          pt: 2.5,
          pb: 2,
        }}
      >
        <Box sx={{ position: 'relative', width: 34, height: 34, flexShrink: 0 }}>
          <Image src="/logo/isotipo-blanco.png" alt="SynchroManage" fill className="object-contain" />
        </Box>
        <Box sx={{ minWidth: 0 }}>
          <Typography
            noWrap
            sx={{
              fontWeight: 650,
              fontSize: 16,
              letterSpacing: '-0.03em',
              color: '#F8FAFC',
              lineHeight: 1.2,
            }}
          >
            SynchroManage
          </Typography>
          <Typography
            noWrap
            sx={{ fontSize: 11, color: 'rgba(248,250,252,0.48)', fontWeight: 500, mt: 0.15 }}
          >
            {roleLabels[userRole] || userRole}
          </Typography>
        </Box>
      </Box>

      <Box
        sx={{
          flex: 1,
          overflowY: 'auto',
          px: 1.25,
          pb: 1,
          '&::-webkit-scrollbar': { width: 0 },
        }}
      >
        {navGroups.map((group) => {
          const groupItems = items.filter(item => item.group === group.id)
          if (groupItems.length === 0) return null
          return (
            <Box key={group.id} sx={{ mb: 1.75 }}>
              <Typography
                sx={{
                  px: 1.5,
                  mb: 0.6,
                  fontSize: 10.5,
                  fontWeight: 600,
                  color: 'rgba(248,250,252,0.38)',
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                }}
              >
                {group.label}
              </Typography>
              {groupItems.map((item) => {
                const active = isNavActive(pathname, item)
                const Icon = item.icon
                return (
                  <ListItemButton
                    key={item.href}
                    component={Link}
                    href={item.href}
                    onClick={onMobileClose}
                    selected={active}
                    disableRipple
                    sx={{
                      minHeight: 42,
                      py: 0.75,
                      px: 1.4,
                      mb: 0.4,
                      mx: 0,
                      borderRadius: 999,
                      color: active ? '#FFFFFF' : 'rgba(248,250,252,0.72)',
                      bgcolor: active ? 'rgba(37, 99, 235, 0.38)' : 'transparent',
                      boxShadow: active
                        ? '0 8px 24px rgba(37, 99, 235, 0.28), inset 0 1px 0 rgba(255,255,255,0.22)'
                        : 'none',
                      border: active
                        ? '1px solid rgba(147, 197, 253, 0.28)'
                        : '1px solid transparent',
                      transition: `all 280ms ${tokens.ease}`,
                      '&.Mui-selected': {
                        bgcolor: 'rgba(37, 99, 235, 0.38)',
                        '&:hover': { bgcolor: 'rgba(37, 99, 235, 0.48)' },
                      },
                      '&:hover': {
                        bgcolor: active ? 'rgba(37, 99, 235, 0.48)' : 'rgba(255,255,255,0.07)',
                        color: '#FFFFFF',
                      },
                    }}
                  >
                    <Icon
                      sx={{
                        fontSize: 20,
                        mr: 1.35,
                        color: active ? '#93C5FD' : 'rgba(248,250,252,0.55)',
                      }}
                    />
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
              })}
            </Box>
          )
        })}
      </Box>

      <Box sx={{ p: 1.25, pt: 0.5 }}>
        <ListItemButton
          onClick={(e) => setAnchorEl(e.currentTarget)}
          disableRipple
          sx={{
            py: 1,
            px: 1.15,
            mx: 0,
            borderRadius: '18px',
            color: '#F8FAFC',
            bgcolor: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.1)',
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.12)',
            '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' },
          }}
        >
          <Avatar
            src={user.avatar_url || undefined}
            sx={{
              width: 32,
              height: 32,
              mr: 1.15,
              bgcolor: tokens.primary,
              fontSize: 12,
              fontWeight: 650,
              boxShadow: '0 0 0 2px rgba(255,255,255,0.12)',
            }}
          >
            {getInitials(user.full_name, user.email)}
          </Avatar>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography noWrap sx={{ fontSize: 13, fontWeight: 600, letterSpacing: '-0.02em' }}>
              {user.full_name || user.email}
            </Typography>
            <Typography noWrap sx={{ fontSize: 11, color: 'rgba(248,250,252,0.45)' }}>
              {user.email}
            </Typography>
          </Box>
          <MoreHorizRounded sx={{ color: 'rgba(248,250,252,0.4)', fontSize: 20 }} />
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
            onClick={() => { setAnchorEl(null); onMobileClose() }}
            sx={{ borderRadius: 2, mx: 0.5, my: 0.25 }}
          >
            <PersonOutlineRounded sx={{ mr: 1.5, fontSize: 20 }} />
            Mi Perfil
          </MenuItem>
          <MenuItem
            onClick={handleLogout}
            sx={{ color: 'error.main', borderRadius: 2, mx: 0.5, my: 0.25 }}
          >
            <LogoutRounded sx={{ mr: 1.5, fontSize: 20 }} />
            Cerrar Sesión
          </MenuItem>
        </Menu>
      </Box>
    </Box>
  )

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
            width: DRAWER_WIDTH,
            boxSizing: 'border-box',
            bgcolor: tokens.navy,
            backgroundImage: 'none',
            border: 0,
          },
        }}
      >
        {drawerContent}
      </Drawer>

      <Drawer
        variant="permanent"
        sx={{
          display: { xs: 'none', md: 'block' },
          width: DRAWER_WIDTH,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: DRAWER_WIDTH,
            boxSizing: 'border-box',
            bgcolor: 'transparent',
            backgroundImage: 'none',
            border: 0,
            boxShadow: 'none',
            backdropFilter: 'none',
          },
        }}
        open
      >
        {drawerContent}
      </Drawer>
    </>
  )
}
