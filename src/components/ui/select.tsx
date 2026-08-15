'use client'

import * as React from 'react'
import { Button, Menu, MenuItem, ListSubheader, Divider } from '@mui/material'
import ExpandMoreRounded from '@mui/icons-material/ExpandMoreRounded'
import { cn } from '@/lib/utils'

type SelectCtx = {
  value?: string
  onValueChange?: (value: string) => void
  disabled?: boolean
  anchor: HTMLElement | null
  setAnchor: (el: HTMLElement | null) => void
  labels: Record<string, React.ReactNode>
}

const SelectContext = React.createContext<SelectCtx | null>(null)

function useSelect() {
  const ctx = React.useContext(SelectContext)
  if (!ctx) throw new Error('Select components must be used within <Select>')
  return ctx
}

function collectLabels(node: React.ReactNode, acc: Record<string, React.ReactNode>) {
  React.Children.forEach(node, (child) => {
    if (!React.isValidElement(child)) return
    const type = child.type as { displayName?: string; isSelectItem?: boolean } | string
    const props = child.props as { value?: unknown; children?: React.ReactNode }
    if (
      typeof type !== 'string' &&
      typeof props.value === 'string' &&
      (type.displayName === 'SelectItem' || type.isSelectItem)
    ) {
      acc[props.value] = props.children
    }
    if (props.children) collectLabels(props.children, acc)
  })
}

function Select({
  value,
  defaultValue,
  onValueChange,
  disabled,
  children,
  required: _required,
}: {
  value?: string
  defaultValue?: string
  onValueChange?: (value: string) => void
  disabled?: boolean
  required?: boolean
  children?: React.ReactNode
}) {
  const [uncontrolled, setUncontrolled] = React.useState(defaultValue)
  const [anchor, setAnchor] = React.useState<HTMLElement | null>(null)
  const current = value ?? uncontrolled

  const labels = React.useMemo(() => {
    const acc: Record<string, React.ReactNode> = {}
    collectLabels(children, acc)
    return acc
  }, [children])

  const handleChange = React.useCallback((v: string) => {
    if (value === undefined) setUncontrolled(v)
    onValueChange?.(v)
  }, [value, onValueChange])

  const ctx = React.useMemo(
    () => ({
      value: current,
      onValueChange: handleChange,
      disabled,
      anchor,
      setAnchor,
      labels,
    }),
    [current, handleChange, disabled, anchor, labels]
  )

  return (
    <SelectContext.Provider value={ctx}>
      {children}
    </SelectContext.Provider>
  )
}

function SelectTrigger({
  className,
  children,
  size,
  ...props
}: Omit<React.ComponentProps<'button'>, 'color' | 'size'> & { size?: 'sm' | 'default' }) {
  const ctx = useSelect()
  return (
    <Button
      variant="outlined"
      disabled={ctx.disabled}
      size={size === 'sm' ? 'small' : 'medium'}
      endIcon={<ExpandMoreRounded />}
      className={cn('justify-between', className)}
      onClick={(e) => ctx.setAnchor(e.currentTarget)}
      sx={{
        borderRadius: 999,
        minWidth: 0,
        width: className?.includes('w-[') ? undefined : '100%',
        height: 40,
        px: 1.75,
        justifyContent: 'space-between',
        textTransform: 'none',
        fontWeight: 500,
        fontSize: 13.5,
        letterSpacing: '-0.01em',
        bgcolor: 'background.paper',
      }}
      {...props}
    >
      {children}
    </Button>
  )
}

function SelectValue({ placeholder }: { placeholder?: string }) {
  const ctx = useSelect()
  if (!ctx.value) return <span style={{ opacity: 0.6 }}>{placeholder}</span>
  return <>{ctx.labels[ctx.value] ?? placeholder ?? ctx.value}</>
}

function SelectContent({ children }: { children?: React.ReactNode; className?: string; position?: string; align?: string }) {
  const ctx = useSelect()
  return (
    <Menu
      anchorEl={ctx.anchor}
      open={Boolean(ctx.anchor)}
      onClose={() => ctx.setAnchor(null)}
      slotProps={{ paper: { sx: { minWidth: ctx.anchor?.offsetWidth, mt: 0.5 } } }}
    >
      {children}
    </Menu>
  )
}

function SelectItem({
  value,
  children,
  disabled,
  className,
}: {
  value: string
  children?: React.ReactNode
  disabled?: boolean
  className?: string
}) {
  const ctx = useSelect()

  return (
    <MenuItem
      disabled={disabled}
      selected={ctx.value === value}
      className={className}
      onClick={() => {
        ctx.onValueChange?.(value)
        ctx.setAnchor(null)
      }}
    >
      {children}
    </MenuItem>
  )
}
SelectItem.displayName = 'SelectItem'
;(SelectItem as typeof SelectItem & { isSelectItem: boolean }).isSelectItem = true

function SelectGroup({ children }: { children?: React.ReactNode }) {
  return <>{children}</>
}

function SelectLabel({ children, className }: { children?: React.ReactNode; className?: string }) {
  return <ListSubheader className={className}>{children}</ListSubheader>
}

function SelectSeparator({ className }: { className?: string }) {
  return <Divider className={className} />
}

function SelectScrollUpButton() { return null }
function SelectScrollDownButton() { return null }

export {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectScrollDownButton,
  SelectScrollUpButton,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
}
