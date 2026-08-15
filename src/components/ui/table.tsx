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

function Table({ className, children, ...props }: React.ComponentProps<'table'>) {
  return (
    <TableContainer component={Paper} elevation={0} className={cn(className)}>
      <MuiTable size="small" {...props}>{children}</MuiTable>
    </TableContainer>
  )
}

function TableHeader({ className, ...props }: React.ComponentProps<'thead'>) {
  return <MuiTableHead className={className} {...props} />
}

function TableBody({ className, ...props }: React.ComponentProps<'tbody'>) {
  return <MuiTableBody className={className} {...props} />
}

function TableFooter({ className, ...props }: React.ComponentProps<'tfoot'>) {
  return <MuiTableFooter className={className} {...props} />
}

function TableRow({ className, ...props }: React.ComponentProps<'tr'>) {
  return <MuiTableRow hover className={className} {...props} />
}

function TableHead({ className, ...props }: React.ComponentProps<'th'>) {
  return <MuiTableCell component="th" className={className} {...props} />
}

function TableCell({ className, ...props }: React.ComponentProps<'td'>) {
  return <MuiTableCell className={className} {...props} />
}

function TableCaption({ className, ...props }: React.ComponentProps<'caption'>) {
  return <caption className={cn('text-sm text-muted-foreground p-2', className)} {...props} />
}

export { Table, TableHeader, TableBody, TableFooter, TableHead, TableRow, TableCell, TableCaption }
