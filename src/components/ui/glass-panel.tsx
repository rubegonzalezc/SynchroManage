'use client'

import type { ReactNode } from 'react'
import { Box, type SxProps, type Theme } from '@mui/material'
import { useTheme } from '@/components/theme-provider'

export function GlassPanel({
  children,
  className,
  sx,
  padding = 2.5,
}: {
  children: ReactNode
  className?: string
  sx?: SxProps<Theme>
  padding?: number | object
}) {
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme === 'dark'

  return (
    <Box
      className={className}
      sx={{
        borderRadius: '24px',
        p: padding,
        bgcolor: isDark ? 'rgba(15, 23, 42, 0.55)' : 'rgba(255, 255, 255, 0.58)',
        backdropFilter: 'blur(28px) saturate(180%)',
        WebkitBackdropFilter: 'blur(28px) saturate(180%)',
        border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(255,255,255,0.7)',
        boxShadow: isDark
          ? '0 12px 36px rgba(0,0,0,0.28), inset 0 1px 0 rgba(255,255,255,0.08)'
          : '0 12px 36px rgba(15, 23, 42, 0.06), inset 0 1px 0 rgba(255,255,255,0.7)',
        backgroundImage: isDark
          ? 'linear-gradient(180deg, rgba(255,255,255,0.06) 0%, transparent 36%)'
          : 'linear-gradient(180deg, rgba(255,255,255,0.55) 0%, transparent 36%)',
        transition: 'transform 400ms cubic-bezier(0.22, 1, 0.36, 1), box-shadow 400ms cubic-bezier(0.22, 1, 0.36, 1)',
        ...sx,
      }}
    >
      {children}
    </Box>
  )
}
