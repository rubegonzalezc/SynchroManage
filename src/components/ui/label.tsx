'use client'

import * as React from 'react'
import { InputLabel } from '@mui/material'
import { cn } from '@/lib/utils'

function Label({ className, ...props }: React.ComponentProps<'label'>) {
  return (
    <InputLabel
      className={cn('!relative !transform-none !mb-1 !text-sm !font-medium', className)}
      {...props}
    />
  )
}

export { Label }
