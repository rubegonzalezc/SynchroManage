'use client'

import * as React from 'react'
import { OutlinedInput } from '@mui/material'
import { cn } from '@/lib/utils'

export type TextareaProps = {
  className?: string
  value?: string
  defaultValue?: string
  onChange?: React.ChangeEventHandler<HTMLTextAreaElement | HTMLInputElement>
  placeholder?: string
  disabled?: boolean
  name?: string
  id?: string
  required?: boolean
  rows?: number
  minRows?: number
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, minRows = 4, rows, ...props }, ref) => {
    return (
      <OutlinedInput
        inputRef={ref}
        multiline
        minRows={rows ?? minRows}
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
