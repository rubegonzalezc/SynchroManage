'use client'

import * as React from 'react'
import { Chip, type ChipProps } from '@mui/material'
import { cn } from '@/lib/utils'

const variantColor = {
  default: 'primary',
  secondary: 'secondary',
  destructive: 'error',
  outline: 'default',
  ghost: 'default',
  link: 'primary',
} as const satisfies Record<string, NonNullable<ChipProps['color']>>

type BadgeVariant = keyof typeof variantColor

function Badge({
  className,
  variant = 'default',
  asChild,
  children,
}: {
  className?: string
  variant?: BadgeVariant
  asChild?: boolean
  children?: React.ReactNode
}) {
  void asChild
  return (
    <Chip
      size="small"
      color={variantColor[variant]}
      variant={variant === 'outline' || variant === 'ghost' ? 'outlined' : 'filled'}
      label={children}
      className={cn(className)}
    />
  )
}

export { Badge }
export const badgeVariants = () => ''
