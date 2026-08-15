'use client'

import * as React from 'react'
import { Popover as MuiPopover, Box } from '@mui/material'
import { cn } from '@/lib/utils'

type Ctx = {
  open: boolean
  setOpen: (v: boolean) => void
  anchor: HTMLElement | null
  setAnchor: (el: HTMLElement | null) => void
}

const PopoverCtx = React.createContext<Ctx | null>(null)

function usePopover() {
  const ctx = React.useContext(PopoverCtx)
  if (!ctx) throw new Error('Popover components must be used within <Popover>')
  return ctx
}

function Popover({
  open: openProp,
  onOpenChange,
  children,
}: {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  children?: React.ReactNode
}) {
  const [uncontrolled, setUncontrolled] = React.useState(false)
  const [anchor, setAnchor] = React.useState<HTMLElement | null>(null)
  const open = openProp ?? uncontrolled
  const setOpen = (v: boolean) => {
    if (openProp === undefined) setUncontrolled(v)
    onOpenChange?.(v)
    if (!v) setAnchor(null)
  }

  return (
    <PopoverCtx.Provider value={{ open, setOpen, anchor, setAnchor }}>
      {children}
    </PopoverCtx.Provider>
  )
}

function PopoverTrigger({
  asChild,
  children,
}: {
  asChild?: boolean
  children?: React.ReactNode
}) {
  const { setOpen, setAnchor, open } = usePopover()
  const onClick = (e: React.MouseEvent<HTMLElement>) => {
    setAnchor(e.currentTarget)
    setOpen(!open)
  }
  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children as React.ReactElement<{ onClick?: (e: React.MouseEvent<HTMLElement>) => void }>, { onClick })
  }
  return <button type="button" onClick={onClick}>{children}</button>
}

function PopoverContent({
  className,
  children,
  align = 'center',
}: {
  className?: string
  children?: React.ReactNode
  align?: 'start' | 'center' | 'end'
  sideOffset?: number
  side?: string
}) {
  const { open, setOpen, anchor } = usePopover()
  const horizontal = align === 'start' ? 'left' : align === 'end' ? 'right' : 'center'
  return (
    <MuiPopover
      open={open && Boolean(anchor)}
      anchorEl={anchor}
      onClose={() => setOpen(false)}
      anchorOrigin={{ vertical: 'bottom', horizontal }}
      transformOrigin={{ vertical: 'top', horizontal }}
    >
      <Box className={cn('p-2 min-w-[180px]', className)}>{children}</Box>
    </MuiPopover>
  )
}

function PopoverAnchor({ children }: { children?: React.ReactNode }) {
  return <>{children}</>
}

function PopoverHeader({ className, ...props }: React.ComponentProps<'div'>) {
  return <div className={cn('flex flex-col gap-1 text-sm', className)} {...props} />
}

function PopoverTitle({ className, ...props }: React.ComponentProps<'h2'>) {
  return <div className={cn('font-medium', className)} {...props} />
}

function PopoverDescription({ className, ...props }: React.ComponentProps<'p'>) {
  return <p className={cn('text-muted-foreground', className)} {...props} />
}

export {
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverAnchor,
  PopoverHeader,
  PopoverTitle,
  PopoverDescription,
}
