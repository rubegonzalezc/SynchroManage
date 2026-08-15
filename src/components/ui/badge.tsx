'use client'

import * as React from 'react'
import { Chip } from '@mui/material'
import { cn } from '@/lib/utils'

const variantColor: Record<string, 'default' | 'primary' | 'error' | 'secondary'> = {
  default: 'primary',
  secondary: 'secondary',
  destructive: 'error',
  outline: 'default',
  ghost: 'default',
  link: 'primary',
}

function Badge({
  className,
  variant = 'default',
  asChild,
  children,
  ...props
}: React.ComponentProps<'span'> & {
  variant?: 'default' | 'secondary' | 'destructive' | 'outline' | 'ghost' | 'link'
  asChild?: boolean
}) {
  void asChild
  return (
    <Chip
      size="small"
      color={variantColor[variant] ?? 'default'}
      variant={variant === 'outline' || variant === 'ghost' ? 'outlined' : 'filled'}
      label={children}
      className={cn(className)}
      {...props}
    />
  )
}

export { Badge }
export const badgeVariants = () => ''
