'use client'

import * as React from 'react'
import { InputLabel } from '@mui/material'
import { cn } from '@/lib/utils'

function Label({
  className,
  children,
  htmlFor,
}: {
  className?: string
  children?: React.ReactNode
  htmlFor?: string
}) {
  return (
    <InputLabel
      htmlFor={htmlFor}
      className={cn('!relative !transform-none !mb-1 !text-sm !font-medium', className)}
    >
      {children}
    </InputLabel>
  )
}

export { Label }
