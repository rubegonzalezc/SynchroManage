'use client'

import { Card, CardActionArea, CardContent, Stack, Typography, Box } from '@mui/material'
import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

export function AppCard({
  className,
  children,
  ...props
}: React.ComponentProps<typeof Card>) {
  return (
    <Card elevation={0} className={cn(className)} {...props}>
      {children}
    </Card>
  )
}

export function StatCard({
  title,
  value,
  description,
  icon,
  href,
}: {
  title: string
  value: ReactNode
  description?: string
  icon?: React.ReactNode
  href?: string
}) {
  const inner = (
    <CardContent>
      <Stack direction="row" spacing={2} sx={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Box>
          <Typography variant="body2" color="text.secondary">{title}</Typography>
          <Typography variant="h5" fontWeight={700} sx={{ mt: 0.5 }}>{value}</Typography>
          {description && (
            <Typography variant="caption" color="text.secondary">{description}</Typography>
          )}
        </Box>
        {icon && (
          <Box sx={{ p: 1, borderRadius: 2, bgcolor: 'primary.main', color: 'primary.contrastText', display: 'grid', placeItems: 'center', opacity: 0.9 }}>
            {icon}
          </Box>
        )}
      </Stack>
    </CardContent>
  )

  if (href) {
    return (
      <AppCard>
        <CardActionArea href={href} sx={{ height: '100%' }}>{inner}</CardActionArea>
      </AppCard>
    )
  }

  return <AppCard>{inner}</AppCard>
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string
  description?: string
  action?: ReactNode
}) {
  return (
    <Stack spacing={1.5} sx={{ py: 8, px: 3, textAlign: 'center', alignItems: 'center', justifyContent: 'center' }}>
      <Typography variant="subtitle1" fontWeight={600}>{title}</Typography>
      {description && <Typography variant="body2" color="text.secondary">{description}</Typography>}
      {action}
    </Stack>
  )
}
