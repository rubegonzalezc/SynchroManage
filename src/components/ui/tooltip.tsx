'use client'

import * as React from 'react'
import { Tooltip as MuiTooltip } from '@mui/material'

function TooltipProvider({ children }: { children?: React.ReactNode; delayDuration?: number }) {
  return <>{children}</>
}

function Tooltip({ children }: { children?: React.ReactNode }) {
  let trigger: React.ReactNode = null
  let content: React.ReactNode = null

  React.Children.forEach(children, (child) => {
    if (!React.isValidElement(child)) return
    if (child.type === TooltipTrigger) {
      const props = child.props as { asChild?: boolean; children?: React.ReactNode }
      trigger = props.children
    }
    if (child.type === TooltipContent) {
      content = (child.props as { children?: React.ReactNode }).children
    }
  })

  return (
    <MuiTooltip title={content} arrow>
      <span style={{ display: 'inline-flex' }}>{trigger}</span>
    </MuiTooltip>
  )
}

function TooltipTrigger({ children }: { children?: React.ReactNode; asChild?: boolean }) {
  return <>{children}</>
}

function TooltipContent({ children }: { children?: React.ReactNode; className?: string; sideOffset?: number }) {
  return <>{children}</>
}

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider }
