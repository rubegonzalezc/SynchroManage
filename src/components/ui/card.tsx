'use client'

import * as React from 'react'
import { Box, Card as MuiCard, CardContent as MuiCardContent, Typography } from '@mui/material'
import { cn } from '@/lib/utils'

function Card({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <MuiCard
      elevation={0}
      className={cn('flex flex-col gap-4', className)}
      sx={{ p: 0 }}
      {...props}
    />
  )
}

function CardHeader({ className, ...props }: React.ComponentProps<'div'>) {
  return <Box className={cn('px-6 pt-6', className)} {...props} />
}

function CardTitle({ className, ...props }: React.ComponentProps<'div'>) {
  return <Typography variant="h6" className={cn('font-semibold', className)} {...props} />
}

function CardDescription({ className, ...props }: React.ComponentProps<'div'>) {
  return <Typography variant="body2" color="text.secondary" className={className} {...props} />
}

function CardAction({ className, ...props }: React.ComponentProps<'div'>) {
  return <Box className={cn('ml-auto', className)} {...props} />
}

function CardContent({ className, ...props }: React.ComponentProps<'div'>) {
  return <MuiCardContent className={cn('px-6 pb-6 pt-0', className)} {...props} />
}

function CardFooter({ className, ...props }: React.ComponentProps<'div'>) {
  return <Box className={cn('flex items-center px-6 pb-6', className)} {...props} />
}

export { Card, CardHeader, CardFooter, CardTitle, CardAction, CardDescription, CardContent }
