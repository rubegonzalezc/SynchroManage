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
          borderRadius: 0,
          p: padding,
          bgcolor: 'transparent',
          border: '1px solid color-mix(in srgb, var(--foreground) 16%, transparent)',
          boxShadow: 'none',
        },
        ...(Array.isArray(sx) ? sx : sx ? [sx] : []),
      ]}
    >
      {children}
    </Box>
  )
}
