'use client'

import * as React from 'react'
import { Divider } from '@mui/material'
import { cn } from '@/lib/utils'

function Separator({
  className,
  orientation = 'horizontal',
  decorative = true,
  ...props
}: React.ComponentProps<'hr'> & { orientation?: 'horizontal' | 'vertical'; decorative?: boolean }) {
  void decorative
  return (
    <Divider
      orientation={orientation}
      flexItem={orientation === 'vertical'}
      className={cn(className)}
      {...props}
    />
  )
}

export { Separator }
