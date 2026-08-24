'use client'

import type { ReactNode } from 'react'
import { Box, type SxProps, type Theme } from '@mui/material'
import { tokens } from '@/theme/designTokens'

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
          borderRadius: '24px',
          p: padding,
          bgcolor: 'var(--glass-bg-soft)',
          backdropFilter: 'blur(28px) saturate(180%)',
          WebkitBackdropFilter: 'blur(28px) saturate(180%)',
          border: '1px solid var(--glass-border)',
          boxShadow: 'var(--shadow-soft), var(--glass-inner-top)',
          backgroundImage:
            'linear-gradient(180deg, var(--glass-highlight-soft) 0%, transparent 36%)',
          transition: `transform 400ms ${tokens.ease}, box-shadow 400ms ${tokens.ease}`,
        },
        ...(Array.isArray(sx) ? sx : sx ? [sx] : []),
      ]}
    >
      {children}
    </Box>
  )
}
