'use client'

import * as React from 'react'
import { Box, Card as MuiCard, CardContent as MuiCardContent, Typography } from '@mui/material'
import { cn } from '@/lib/utils'

function Card({ className, children }: { className?: string; children?: React.ReactNode }) {
  return (
    <MuiCard
      elevation={0}
      className={cn('flex flex-col gap-4', className)}
      sx={{ p: 0 }}
    >
      {children}
    </MuiCard>
  )
}

function CardHeader({ className, children }: { className?: string; children?: React.ReactNode }) {
  return <Box className={cn('px-6 pt-6', className)}>{children}</Box>
}

function CardTitle({ className, children }: { className?: string; children?: React.ReactNode }) {
  return <Typography variant="h6" className={cn('font-semibold', className)}>{children}</Typography>
}

function CardDescription({ className, children }: { className?: string; children?: React.ReactNode }) {
  return <Typography variant="body2" color="text.secondary" className={className}>{children}</Typography>
}

function CardAction({ className, children }: { className?: string; children?: React.ReactNode }) {
  return <Box className={cn('ml-auto', className)}>{children}</Box>
}

function CardContent({ className, children }: { className?: string; children?: React.ReactNode }) {
  return <MuiCardContent className={cn('px-6 pb-6 pt-0', className)}>{children}</MuiCardContent>
}

function CardFooter({ className, children }: { className?: string; children?: React.ReactNode }) {
  return <Box className={cn('flex items-center px-6 pb-6', className)}>{children}</Box>
}

export { Card, CardHeader, CardFooter, CardTitle, CardAction, CardDescription, CardContent }
