'use client'

import * as React from 'react'
import { OutlinedInput } from '@mui/material'
import { cn } from '@/lib/utils'

function Input({ className, type, sx, ...props }: Omit<React.ComponentProps<'input'>, 'size' | 'color'> & { sx?: object }) {
  const withIcon = className?.includes('pl-9')
  return (
    <OutlinedInput
      type={type}
      size="small"
      notched={false}
      className={cn('w-full', className)}
      sx={{
        width: '100%',
        borderRadius: '14px',
        ...(withIcon ? { '& .MuiOutlinedInput-input': { pl: 3.5 } } : {}),
        ...sx,
      }}
      {...props}
    />
  )
}

export { Input }
