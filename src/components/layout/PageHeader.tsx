import type { ReactNode } from 'react'
import { Box, Stack, Typography } from '@mui/material'

interface PageHeaderProps {
  title: string
  description?: string
  actions?: ReactNode
  className?: string
}

export function PageHeader({ title, description, actions, className }: PageHeaderProps) {
  return (
    <Stack
      direction={{ xs: 'column', sm: 'row' }}
      className={className}
      sx={{
        mb: 1,
        gap: 1.5,
        alignItems: { sm: 'center' },
        justifyContent: 'space-between',
      }}
    >
      <Box>
        <Typography variant="h5" fontWeight={650} letterSpacing="-0.03em">{title}</Typography>
        {description && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>{description}</Typography>
        )}
      </Box>
      {actions && <Box sx={{ flexShrink: 0 }}>{actions}</Box>}
    </Stack>
  )
}
