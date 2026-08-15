'use client'

import * as React from 'react'
import { Menu, MenuItem, Divider, ListItemIcon, ListItemText, ListSubheader, Checkbox as MuiCheckbox } from '@mui/material'
import { cn } from '@/lib/utils'

type MenuCtx = {
  open: boolean
  setOpen: (v: boolean) => void
  anchor: HTMLElement | null
  setAnchor: (el: HTMLElement | null) => void
}

const MenuContext = React.createContext<MenuCtx | null>(null)

function useMenu() {
  const ctx = React.useContext(MenuContext)
  if (!ctx) throw new Error('DropdownMenu components must be used within <DropdownMenu>')
  return ctx
}

function DropdownMenu({
  children,
  open: openProp,
  onOpenChange,
}: {
  children?: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
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
    <MenuContext.Provider value={{ open, setOpen, anchor, setAnchor }}>
      {children}
    </MenuContext.Provider>
  )
}

function DropdownMenuTrigger({
  asChild,
  children,
  ...props
}: React.ComponentProps<'button'> & { asChild?: boolean }) {
  const { setAnchor, setOpen } = useMenu()
  const onClick = (e: React.MouseEvent<HTMLElement>) => {
    setAnchor(e.currentTarget)
    setOpen(true)
    if (React.isValidElement(children)) {
      (children.props as { onClick?: (e: React.MouseEvent<HTMLElement>) => void }).onClick?.(e)
    }
  }
  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children as React.ReactElement<{ onClick?: (e: React.MouseEvent<HTMLElement>) => void }>, { onClick })
  }
  return (
    <button type="button" onClick={onClick} {...props}>
      {children}
    </button>
  )
}

function DropdownMenuContent({
  children,
  className,
}: {
  children?: React.ReactNode
  className?: string
  side?: string
  align?: string
  sideOffset?: number
  onCloseAutoFocus?: (e: Event) => void
}) {
  const { open, setOpen, anchor } = useMenu()
  return (
    <Menu
      anchorEl={anchor}
      open={open && Boolean(anchor)}
      onClose={() => setOpen(false)}
      className={className}
    >
      {children}
    </Menu>
  )
}

function DropdownMenuItem({
  children,
  onClick,
  className,
  disabled,
  asChild,
  variant,
}: React.ComponentProps<'div'> & { inset?: boolean; variant?: 'default' | 'destructive'; asChild?: boolean; disabled?: boolean }) {
  const { setOpen } = useMenu()
  const handle = (e: React.MouseEvent<HTMLLIElement>) => {
    onClick?.(e as unknown as React.MouseEvent<HTMLDivElement>)
    setOpen(false)
  }
  if (asChild && React.isValidElement(children)) {
    return (
      <MenuItem onClick={handle} disabled={disabled} className={className} sx={variant === 'destructive' ? { color: 'error.main' } : undefined}>
        {children}
      </MenuItem>
    )
  }
  return (
    <MenuItem onClick={handle} disabled={disabled} className={cn(className)} sx={variant === 'destructive' ? { color: 'error.main' } : undefined}>
      {children}
    </MenuItem>
  )
}

function DropdownMenuSeparator() {
  return <Divider />
}

function DropdownMenuLabel({ children, className }: { children?: React.ReactNode; className?: string; inset?: boolean }) {
  return <ListSubheader className={className}>{children}</ListSubheader>
}

function DropdownMenuGroup({ children }: { children?: React.ReactNode }) {
  return <>{children}</>
}

function DropdownMenuCheckboxItem({
  children,
  checked,
  onSelect,
  onClick,
}: {
  children?: React.ReactNode
  checked?: boolean
  onSelect?: (e: Event) => void
  onClick?: React.MouseEventHandler
}) {
  return (
    <MenuItem
      onClick={(e) => {
        onClick?.(e)
        onSelect?.(e.nativeEvent)
      }}
    >
      <ListItemIcon>
        <MuiCheckbox size="small" checked={!!checked} />
      </ListItemIcon>
      <ListItemText>{children}</ListItemText>
    </MenuItem>
  )
}

function DropdownMenuRadioGroup({ children }: { children?: React.ReactNode; value?: string; onValueChange?: (v: string) => void }) {
  return <>{children}</>
}

function DropdownMenuRadioItem({ children }: { children?: React.ReactNode; value?: string }) {
  return <MenuItem>{children}</MenuItem>
}

function DropdownMenuShortcut({ children, className }: React.ComponentProps<'span'>) {
  return <span className={cn('ml-auto text-xs opacity-60', className)}>{children}</span>
}

function DropdownMenuPortal({ children }: { children?: React.ReactNode }) {
  return <>{children}</>
}

function DropdownMenuSub({ children }: { children?: React.ReactNode }) {
  return <>{children}</>
}

function DropdownMenuSubTrigger({ children }: { children?: React.ReactNode; inset?: boolean; className?: string }) {
  return <MenuItem>{children}</MenuItem>
}

function DropdownMenuSubContent({ children }: { children?: React.ReactNode; className?: string }) {
  return <>{children}</>
}

export {
  DropdownMenu,
  DropdownMenuPortal,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
}
