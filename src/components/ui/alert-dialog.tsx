'use client'

import * as React from 'react'
import {
  Dialog as MuiDialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Box,
} from '@mui/material'
import { Button } from '@/components/ui/button'

type Ctx = { open: boolean; setOpen: (v: boolean) => void }
const AlertCtx = React.createContext<Ctx | null>(null)

function useAlert() {
  const ctx = React.useContext(AlertCtx)
  if (!ctx) throw new Error('AlertDialog must be used within provider')
  return ctx
}

function AlertDialog({
  open: openProp,
  onOpenChange,
  children,
}: {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  children?: React.ReactNode
}) {
  const [uncontrolled, setUncontrolled] = React.useState(false)
  const open = openProp ?? uncontrolled
  const setOpen = (v: boolean) => {
    if (openProp === undefined) setUncontrolled(v)
    onOpenChange?.(v)
  }
  return <AlertCtx.Provider value={{ open, setOpen }}>{children}</AlertCtx.Provider>
}

function AlertDialogTrigger({ asChild, children }: { asChild?: boolean; children?: React.ReactNode }) {
  const { setOpen } = useAlert()
  const onClick = () => setOpen(true)
  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children as React.ReactElement<{ onClick?: () => void }>, { onClick })
  }
  return <button type="button" onClick={onClick}>{children}</button>
}

function AlertDialogContent({ children, className, size }: { children?: React.ReactNode; className?: string; size?: 'default' | 'sm' }) {
  const { open, setOpen } = useAlert()
  return (
    <MuiDialog open={open} onClose={() => setOpen(false)} maxWidth={size === 'sm' ? 'xs' : 'sm'} fullWidth>
      <Box className={className}>{children}</Box>
    </MuiDialog>
  )
}

function AlertDialogHeader({ className, ...props }: React.ComponentProps<'div'>) {
  return <Box className={className} sx={{ px: 3, pt: 3 }} {...props} />
}

function AlertDialogFooter({ className, children }: React.ComponentProps<'div'>) {
  return <DialogActions className={className}>{children}</DialogActions>
}

function AlertDialogTitle({ children, className }: React.ComponentProps<'h2'>) {
  return <DialogTitle className={className}>{children}</DialogTitle>
}

function AlertDialogDescription({ children, className }: React.ComponentProps<'p'>) {
  return <DialogContent><DialogContentText className={className}>{children}</DialogContentText></DialogContent>
}

function AlertDialogMedia({ className, ...props }: React.ComponentProps<'div'>) {
  return <Box className={className} {...props} />
}

function AlertDialogAction({ children, className, ...props }: React.ComponentProps<'button'> & { variant?: string; size?: string }) {
  const { setOpen } = useAlert()
  return (
    <Button className={className} onClick={(e) => { props.onClick?.(e); setOpen(false) }}>
      {children}
    </Button>
  )
}

function AlertDialogCancel({ children, className, ...props }: React.ComponentProps<'button'> & { variant?: string; size?: string }) {
  const { setOpen } = useAlert()
  return (
    <Button variant="outline" className={className} onClick={(e) => { props.onClick?.(e); setOpen(false) }}>
      {children}
    </Button>
  )
}

function AlertDialogPortal({ children }: { children?: React.ReactNode }) { return <>{children}</> }
function AlertDialogOverlay() { return null }

export {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogOverlay,
  AlertDialogPortal,
  AlertDialogTitle,
  AlertDialogTrigger,
}
