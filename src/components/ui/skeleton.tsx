'use client'

import { Skeleton as MuiSkeleton } from '@mui/material'
import { cn } from '@/lib/utils'

function Skeleton({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return <MuiSkeleton className={cn('rounded-xl', className)} style={style} />
}

export { Skeleton }
