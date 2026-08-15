'use client'

import * as React from 'react'
import { OutlinedInput } from '@mui/material'
import { cn } from '@/lib/utils'

export type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <OutlinedInput
        inputRef={ref}
        multiline
        minRows={4}
        notched={false}
        className={cn('w-full', className)}
        sx={{ width: '100%' }}
        {...props}
      />
    )
  }
)
Textarea.displayName = 'Textarea'

export { Textarea }
