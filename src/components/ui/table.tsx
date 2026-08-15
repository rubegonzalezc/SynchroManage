'use client'

import * as React from 'react'
import {
  Table as MuiTable,
  TableBody as MuiTableBody,
  TableCell as MuiTableCell,
  TableContainer,
  TableHead as MuiTableHead,
  TableRow as MuiTableRow,
  TableFooter as MuiTableFooter,
  Paper,
} from '@mui/material'
import { cn } from '@/lib/utils'

function Table({ className, children }: { className?: string; children?: React.ReactNode }) {
  return (
    <TableContainer component={Paper} elevation={0} className={cn(className)}>
      <MuiTable size="small">{children}</MuiTable>
    </TableContainer>
  )
}

function TableHeader({ className, children }: { className?: string; children?: React.ReactNode }) {
  return <MuiTableHead className={className}>{children}</MuiTableHead>
}

function TableBody({ className, children }: { className?: string; children?: React.ReactNode }) {
  return <MuiTableBody className={className}>{children}</MuiTableBody>
}

function TableFooter({ className, children }: { className?: string; children?: React.ReactNode }) {
  return <MuiTableFooter className={className}>{children}</MuiTableFooter>
}

function TableRow({ className, children, onClick, onMouseEnter }: {
  className?: string
  children?: React.ReactNode
  onClick?: React.MouseEventHandler
  onMouseEnter?: React.MouseEventHandler
}) {
  return <MuiTableRow hover className={className} onClick={onClick} onMouseEnter={onMouseEnter}>{children}</MuiTableRow>
}

function TableHead({ className, children, colSpan }: { className?: string; children?: React.ReactNode; colSpan?: number }) {
  return <MuiTableCell component="th" className={className} colSpan={colSpan}>{children}</MuiTableCell>
}

function TableCell({ className, children, colSpan }: { className?: string; children?: React.ReactNode; colSpan?: number }) {
  return <MuiTableCell className={className} colSpan={colSpan}>{children}</MuiTableCell>
}

function TableCaption({ className, ...props }: React.ComponentProps<'caption'>) {
  return <caption className={cn('text-sm text-muted-foreground p-2', className)} {...props} />
}

export { Table, TableHeader, TableBody, TableFooter, TableHead, TableRow, TableCell, TableCaption }
