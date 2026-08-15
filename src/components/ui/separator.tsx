'use client'

import * as React from 'react'
import { Divider } from '@mui/material'
import { cn } from '@/lib/utils'

function Separator({
  className,
  orientation = 'horizontal',
  decorative = true,
}: { className?: string; orientation?: 'horizontal' | 'vertical'; decorative?: boolean }) {
  void decorative
  return (
    <Divider
      orientation={orientation}
      flexItem={orientation === 'vertical'}
      className={cn(className)}
    />
  )
}

export { Separator }
