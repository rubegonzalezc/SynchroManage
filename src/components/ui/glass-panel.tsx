'use client'

import type { ReactNode } from 'react'
import { Box, type SxProps, type Theme } from '@mui/material'

/**
 * Panel de cristal. Se apoya en las variables CSS del design system, por lo que
 * responde al modo oscuro sin leer el tema desde JavaScript.
 */
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
  return (
    <Box
      className={className}
      sx={[
        {
          borderRadius: '16px',
          p: padding,
          bgcolor: 'var(--card)',
          border: '1px solid var(--border)',
          boxShadow: 'none',
        },
        ...(Array.isArray(sx) ? sx : sx ? [sx] : []),
      ]}
    >
      {children}
    </Box>
  )
}
