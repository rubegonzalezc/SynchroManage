'use client'

import * as React from 'react'
import {
  Dialog as MuiDialog,
  DialogTitle as MuiDialogTitle,
  DialogContentText,
  IconButton,
  Box,
  Grow,
} from '@mui/material'
import CloseRounded from '@mui/icons-material/CloseRounded'
import { cn } from '@/lib/utils'

type DialogCtx = {
  open: boolean
  setOpen: (open: boolean) => void
}

const DialogContext = React.createContext<DialogCtx | null>(null)

function useDialog() {
  const ctx = React.useContext(DialogContext)
  if (!ctx) throw new Error('Dialog components must be used within <Dialog>')
  return ctx
}

function Dialog({
  open: openProp,
  defaultOpen,
  onOpenChange,
  children,
}: {
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
  children?: React.ReactNode
}) {
  const [uncontrolled, setUncontrolled] = React.useState(defaultOpen ?? false)
  const open = openProp ?? uncontrolled
  const setOpen = (next: boolean) => {
    if (openProp === undefined) setUncontrolled(next)
    onOpenChange?.(next)
  }

  return (
    <DialogContext.Provider value={{ open, setOpen }}>
      {children}
    </DialogContext.Provider>
  )
}

function DialogTrigger({
  asChild,
  children,
  ...props
}: React.ComponentProps<'button'> & { asChild?: boolean }) {
  const { setOpen } = useDialog()
  const handleClick = (e: React.MouseEvent<HTMLElement>) => {
    setOpen(true)
    if (React.isValidElement(children)) {
      const childProps = children.props as { onClick?: (e: React.MouseEvent<HTMLElement>) => void }
      childProps.onClick?.(e)
    }
  }

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children as React.ReactElement<{ onClick?: (e: React.MouseEvent<HTMLElement>) => void }>, {
      onClick: handleClick,
    })
  }

  return (
    <button type="button" onClick={handleClick} {...props}>
      {children}
    </button>
  )
}

function dialogMaxWidth(className?: string): 'xs' | 'sm' | 'md' | 'lg' {
  const c = className ?? ''
  if (c.includes('max-w-4xl') || c.includes('max-w-5xl')) return 'lg'
  if (c.includes('max-w-2xl') || c.includes('max-w-3xl') || c.includes('max-w-xl')) return 'md'
  if (c.includes('max-w-md') || c.includes('max-w-lg')) return 'sm'
  return 'sm'
}

function innerDialogClass(className?: string) {
  return (className ?? '')
    .replace(/\bmax-w-\S+/g, '')
    .replace(/\bmax-h-\[[^\]]+\]/g, '')
    .replace(/\boverflow-y-auto\b/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function DialogContent({
  className,
  children,
  showCloseButton = true,
  footer,
}: React.ComponentProps<'div'> & { showCloseButton?: boolean; footer?: React.ReactNode }) {
  const { open, setOpen } = useDialog()
  const innerClass = innerDialogClass(className)
  const noPadding = innerClass.includes('p-0')

  return (
    <MuiDialog
      open={open}
      onClose={() => setOpen(false)}
      fullWidth
      maxWidth={dialogMaxWidth(className)}
      scroll="paper"
      TransitionComponent={Grow}
      transitionDuration={{ enter: 320, exit: 220 }}
      slotProps={{
        paper: {
          sx: {
            width: '100%',
            maxHeight: '90dvh',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            m: 2,
          },
        },
      }}
    >
      {showCloseButton && (
        <IconButton
          onClick={() => setOpen(false)}
          sx={{ position: 'absolute', right: 10, top: 10, zIndex: 2 }}
          aria-label="Cerrar"
        >
          <CloseRounded fontSize="small" />
        </IconButton>
      )}
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          flex: '1 1 auto',
          minHeight: 0,
          width: '100%',
          maxHeight: '90dvh',
          overflow: 'hidden',
        }}
      >
        <Box
          className={cn(innerClass)}
          sx={{
            flex: '1 1 auto',
            minHeight: 0,
            overflowY: 'auto',
            overflowX: 'hidden',
            width: '100%',
            boxSizing: 'border-box',
            px: noPadding ? 0 : 3,
            py: noPadding ? 0 : 2.75,
          }}
        >
          {children}
        </Box>
        {footer ? (
          <Box
            sx={{
              flexShrink: 0,
              width: '100%',
              boxSizing: 'border-box',
              px: 3,
              py: 1.75,
              borderTop: '1px solid',
              borderColor: 'divider',
            }}
          >
            {footer}
          </Box>
        ) : null}
      </Box>
    </MuiDialog>
  )
}

function DialogHeader({ className, ...props }: React.ComponentProps<'div'>) {
  return <Box className={cn('mb-3', className)} {...props} />
}

function DialogFooter({ className, children, ...props }: React.ComponentProps<'div'> & { showCloseButton?: boolean }) {
  return (
    <Box className={cn('mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end', className)} {...props}>
      {children}
    </Box>
  )
}

function DialogTitle({ className, ...props }: React.ComponentProps<'h2'>) {
  return <MuiDialogTitle className={cn('p-0 text-lg font-semibold', className)} {...props} />
}

function DialogDescription({ className, ...props }: React.ComponentProps<'p'>) {
  return <DialogContentText className={cn('mt-1', className)} {...props} />
}

function DialogClose({
  asChild,
  children,
  ...props
}: React.ComponentProps<'button'> & { asChild?: boolean }) {
  const { setOpen } = useDialog()
  const onClick = () => setOpen(false)
  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children as React.ReactElement<{ onClick?: () => void }>, { onClick })
  }
  return (
    <button type="button" onClick={onClick} {...props}>
      {children}
    </button>
  )
}

function DialogPortal({ children }: { children?: React.ReactNode }) {
  return <>{children}</>
}

function DialogOverlay(_props: React.ComponentProps<'div'>) {
  return null
}

export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
}
