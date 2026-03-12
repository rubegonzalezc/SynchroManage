'use client'

import { useState } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { EditUserDialog } from './EditUserDialog'
import { DeleteUserDialog } from './DeleteUserDialog'

interface Role {
  id: number
  name: string
  description: string
}

interface User {
  id: string
  email: string | null
  full_name: string | null
  avatar_url: string | null
  role_id: number
  role: Role | null
  company_id: string | null
  created_at: string | null
}

interface UsersTableProps {
  users: User[]
  roles: Role[]
}

const roleBadgeColors: Record<string, string> = {
  admin: 'bg-red-100 text-red-700 border-red-200',
  pm: 'bg-blue-100 text-blue-700 border-blue-200',
  tech_lead: 'bg-purple-100 text-purple-700 border-purple-200',
  developer: 'bg-green-100 text-green-700 border-green-200',
}

const roleLabels: Record<string, string> = {
  admin: 'Administrador',
  pm: 'Project Manager',
  tech_lead: 'Tech Lead',
  developer: 'Desarrollador',
}

export function UsersTable({ users, roles }: UsersTableProps) {
  const getInitials = (name: string | null, email: string | null) => {
    if (name) {
      return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    }
    return email?.slice(0, 2).toUpperCase() || '??'
  }

  const formatDate = (date: string | null) => {
    if (!date) return '-'
    return new Date(date).toLocaleDateString('es-CL', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white">
      <Table>
        <TableHeader>
          <TableRow className="bg-slate-50">
            <TableHead className="text-slate-600">Usuario</TableHead>
            <TableHead className="text-slate-600">Rol</TableHead>
            <TableHead className="text-slate-600">Fecha Registro</TableHead>
            <TableHead className="text-slate-600 text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.length === 0 ? (
            <TableRow>
              <TableCell colSpan={4} className="text-center py-8 text-slate-500">
                No hay usuarios registrados
              </TableCell>
            </TableRow>
          ) : (
            users.map((user) => (
              <TableRow key={user.id} className="hover:bg-slate-50">
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="w-9 h-9">
                      <AvatarImage src={user.avatar_url || undefined} />
                      <AvatarFallback className="bg-slate-200 text-slate-600 text-xs">
                        {getInitials(user.full_name, user.email)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-slate-800">
                        {user.full_name || 'Sin nombre'}
                      </p>
                      <p className="text-sm text-slate-500">{user.email}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge 
                    variant="outline" 
                    className={roleBadgeColors[user.role?.name || ''] || 'bg-slate-100 text-slate-700'}
                  >
                    {roleLabels[user.role?.name || ''] || user.role?.name || 'Sin rol'}
                  </Badge>
                </TableCell>
                <TableCell className="text-slate-600">
                  {formatDate(user.created_at)}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <EditUserDialog user={user} roles={roles} />
                    <DeleteUserDialog user={user} />
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}
