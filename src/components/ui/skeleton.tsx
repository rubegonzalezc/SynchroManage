'use client'

import { Skeleton as MuiSkeleton } from '@mui/material'
import { cn } from '@/lib/utils'

function Skeleton({ className, ...props }: React.ComponentProps<'div'>) {
  return <MuiSkeleton className={cn('rounded-xl', className)} {...props} />
}

export { Skeleton }
