'use client'

import * as React from 'react'
import { Checkbox as MuiCheckbox } from '@mui/material'

function Checkbox({
  className,
  checked,
  onCheckedChange,
  disabled,
  id,
}: {
  className?: string
  checked?: boolean | 'indeterminate'
  onCheckedChange?: (checked: boolean) => void
  disabled?: boolean
  id?: string
}) {
  return (
    <MuiCheckbox
      id={id}
      className={className}
      size="small"
      checked={checked === true}
      indeterminate={checked === 'indeterminate'}
      disabled={disabled}
      onChange={(_, value) => onCheckedChange?.(value)}
    />
  )
}

export { Checkbox }
