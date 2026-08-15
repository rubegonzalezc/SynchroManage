'use client'

import * as React from 'react'
import { Avatar as MuiAvatar } from '@mui/material'
import { cn } from '@/lib/utils'

function Avatar({
  className,
  size = 'default',
  children,
  ...props
}: React.ComponentProps<'div'> & { size?: 'default' | 'sm' | 'lg' }) {
  let src: string | undefined
  let fallback: React.ReactNode = null

  React.Children.forEach(children, (child) => {
    if (!React.isValidElement(child)) return
    if (child.type === AvatarImage) {
      src = (child.props as { src?: string | null }).src || undefined
    }
    if (child.type === AvatarFallback) {
      fallback = (child.props as { children?: React.ReactNode }).children
    }
  })

  const dim = size === 'lg' ? 40 : size === 'sm' ? 24 : 32

  return (
    <MuiAvatar src={src} className={cn(className)} sx={{ width: dim, height: dim, fontSize: size === 'sm' ? 11 : 13 }} {...props}>
      {fallback}
    </MuiAvatar>
  )
}

function AvatarImage(_props: {
  src?: string | null
  className?: string
  alt?: string
  onLoadingStatusChange?: (status: string) => void
}) {
  return null
}

function AvatarFallback({ children }: { children?: React.ReactNode; className?: string }) {
  return <>{children}</>
}

function AvatarBadge({ className, ...props }: React.ComponentProps<'span'>) {
  return <span className={cn(className)} {...props} />
}

function AvatarGroup({ className, ...props }: React.ComponentProps<'div'>) {
  return <div className={cn('flex -space-x-2', className)} {...props} />
}

function AvatarGroupCount({ className, ...props }: React.ComponentProps<'div'>) {
  return <div className={cn(className)} {...props} />
}

export { Avatar, AvatarImage, AvatarFallback, AvatarBadge, AvatarGroup, AvatarGroupCount }
