'use client'

import * as React from 'react'
import { Button as MuiButton, IconButton } from '@mui/material'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-medium transition-all duration-300 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90',
        destructive: 'bg-destructive text-white hover:bg-destructive/90',
        outline: 'border bg-background hover:bg-accent',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
        ghost: 'hover:bg-accent',
        link: 'text-primary underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-9 px-4 py-2',
        xs: 'h-6 px-2 text-xs',
        sm: 'h-8 px-3',
        lg: 'h-10 px-6',
        icon: 'size-9',
        'icon-xs': 'size-6',
        'icon-sm': 'size-8',
        'icon-lg': 'size-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)

type ButtonVariant = NonNullable<VariantProps<typeof buttonVariants>['variant']>
type ButtonSize = NonNullable<VariantProps<typeof buttonVariants>['size']>

function mapVariant(variant: ButtonVariant | null | undefined) {
  switch (variant) {
    case 'outline':
      return { variant: 'outlined' as const, color: 'primary' as const }
    case 'ghost':
    case 'link':
      return { variant: 'text' as const, color: 'primary' as const }
    case 'secondary':
      return { variant: 'contained' as const, color: 'inherit' as const }
    case 'destructive':
      return { variant: 'contained' as const, color: 'error' as const }
    default:
      return { variant: 'contained' as const, color: 'primary' as const }
  }
}

function mapSize(size: ButtonSize | null | undefined) {
  if (size === 'sm' || size === 'xs') return 'small' as const
  if (size === 'lg') return 'large' as const
  return 'medium' as const
}

function isIconSize(size: ButtonSize | null | undefined) {
  return size === 'icon' || size === 'icon-xs' || size === 'icon-sm' || size === 'icon-lg'
}

function Button({
  className,
  variant = 'default',
  size = 'default',
  asChild = false,
  children,
  ...props
}: Omit<React.ComponentProps<'button'>, 'color'> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const mapped = mapVariant(variant)
  const muiSize = mapSize(size)
  const iconColor = mapped.color === 'inherit' ? 'default' : mapped.color

  if (asChild) {
    return (
      <Slot className={cn(buttonVariants({ variant, size }), className)} {...props}>
        {children}
      </Slot>
    )
  }

  if (isIconSize(size)) {
    return (
      <IconButton
        color={iconColor}
        size={muiSize}
        className={className}
        {...props}
      >
        {children}
      </IconButton>
    )
  }

  return (
    <MuiButton
      variant={mapped.variant}
      color={mapped.color}
      size={muiSize}
      className={className}
      disableElevation
      {...props}
    >
      {children}
    </MuiButton>
  )
}

export { Button, buttonVariants }
