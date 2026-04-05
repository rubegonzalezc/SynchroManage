'use client'

import { useState, useEffect, useMemo } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { EditUserDialog } from './EditUserDialog'
import { DeleteUserDialog } from './DeleteUserDialog'
import { CreateUserDialog } from './CreateUserDialog'
import { Search, ChevronLeft, ChevronRight, X, RefreshCw, Loader2 } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'

interface Role {
  id: number
  name: string
  description: string
}

interface Company {
  id: string
  name: string
}

interface User {
  id: string
  email: string | null
  full_name: string | null
  avatar_url: string | null
  role_id: number
  role: Role | null
  roles?: string[]
  company_id: string | null
  company: Company | null
  created_at: string | null
  email_confirmed: boolean
  last_sign_in: string | null
}

interface UsersTableClientProps {
  roles: Role[]
}

const roleBadgeColors: Record<string, string> = {
  admin: 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800',
  pm: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800',
  tech_lead: 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800',
  developer: 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800',
  stakeholder: 'bg-cyan-100 text-cyan-700 border-cyan-200 dark:bg-cyan-900/30 dark:text-cyan-400 dark:border-cyan-800',
}

const roleLabels: Record<string, string> = {
  admin: 'Administrador',
  pm: 'Project Manager',
  tech_lead: 'Tech Lead',
  developer: 'Desarrollador',
  stakeholder: 'Stakeholder',
}

export function UsersTableClient({ roles }: UsersTableClientProps) {
  const [users, setUsers] = useState<User[]>([])
  const [companies, setCompanies] = useState<Company[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)
  const [resendingUserId, setResendingUserId] = useState<string | null>(null)
  const [resendSuccess, setResendSuccess] = useState<string | null>(null)
  const [resendError, setResendError] = useState<string | null>(null)
  
  // Filtros
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [companyFilter, setCompanyFilter] = useState<string>('all')
  
  // Paginación
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const [usersRes, companiesRes] = await Promise.all([
        fetch('/api/dashboard/users'),
        fetch('/api/dashboard/companies'),
      ])
      const usersData = await usersRes.json()
      const companiesData = await companiesRes.json()
      if (!usersRes.ok) throw new Error(usersData.error || 'Error al cargar usuarios')
      setUsers(usersData.users)
      setCompanies(companiesData.companies || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar usuarios')
    } finally {
      setLoading(false)
    }
  }

  const refreshUsers = () => setRefreshKey(k => k + 1)

  const handleResendInvite = async (userId: string) => {
    setResendingUserId(userId)
    setResendSuccess(null)
    setResendError(null)

    try {
      const response = await fetch('/api/dashboard/resend-invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      })
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Error al reenviar invitación')
      }

      setResendSuccess('Invitación reenviada correctamente')
      setTimeout(() => setResendSuccess(null), 3000)
    } catch (err) {
      setResendError(err instanceof Error ? err.message : 'Error al reenviar invitación')
      setTimeout(() => setResendError(null), 5000)
    } finally {
      setResendingUserId(null)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [refreshKey])

  // Filtrar usuarios
  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      const matchesSearch = search === '' || 
        user.full_name?.toLowerCase().includes(search.toLowerCase()) ||
        user.email?.toLowerCase().includes(search.toLowerCase())
      
      const matchesRole = roleFilter === 'all' || 
        (user.roles && user.roles.length > 0 ? user.roles.includes(roleFilter) : user.role?.name === roleFilter)
      const matchesStatus = statusFilter === 'all' || 
        (statusFilter === 'confirmed' && user.email_confirmed) ||
        (statusFilter === 'pending' && !user.email_confirmed)
      const matchesCompany = companyFilter === 'all' || user.company_id === companyFilter
      
      return matchesSearch && matchesRole && matchesStatus && matchesCompany
    })
  }, [users, search, roleFilter, statusFilter, companyFilter])

  // Paginación
  const totalPages = Math.ceil(filteredUsers.length / pageSize)
  const paginatedUsers = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return filteredUsers.slice(start, start + pageSize)
  }, [filteredUsers, currentPage, pageSize])

  // Reset página cuando cambian filtros
  useEffect(() => {
    setCurrentPage(1)
  }, [search, roleFilter, statusFilter, companyFilter, pageSize])

  const clearFilters = () => {
    setSearch('')
    setRoleFilter('all')
    setStatusFilter('all')
    setCompanyFilter('all')
  }

  const hasActiveFilters = search !== '' || roleFilter !== 'all' || statusFilter !== 'all' || companyFilter !== 'all'

  const getInitials = (name: string | null, email: string | null) => {
    if (name) return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    return email?.slice(0, 2).toUpperCase() || '??'
  }

  const formatDate = (date: string | null) => {
    if (!date) return '-'
    return new Date(date).toLocaleDateString('es-CL', { day: '2-digit', month: 'short', year: 'numeric' })
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1.5">
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-4 w-52" />
          </div>
          <Skeleton className="h-9 w-32 rounded-md" />
        </div>
        <div className="flex flex-wrap gap-3">
          <Skeleton className="h-9 flex-1 min-w-[200px] max-w-sm" />
          <Skeleton className="h-9 w-[160px]" />
          <Skeleton className="h-9 w-[160px]" />
          <Skeleton className="h-9 w-[180px]" />
        </div>
        <div className="rounded-lg border bg-card">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead><Skeleton className="h-4 w-20" /></TableHead>
                <TableHead><Skeleton className="h-4 w-12" /></TableHead>
                <TableHead><Skeleton className="h-4 w-20" /></TableHead>
                <TableHead><Skeleton className="h-4 w-16" /></TableHead>
                <TableHead><Skeleton className="h-4 w-28" /></TableHead>
                <TableHead className="text-right"><Skeleton className="h-4 w-16 ml-auto" /></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[1, 2, 3, 4, 5].map((i) => (
                <TableRow key={i}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Skeleton className="w-9 h-9 rounded-full flex-shrink-0" />
                      <div className="space-y-1.5">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-44" />
                      </div>
                    </div>
                  </TableCell>
                  <TableCell><Skeleton className="h-5 w-24 rounded-full" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-20 rounded-full" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Skeleton className="w-8 h-8 rounded-md" />
                      <Skeleton className="w-8 h-8 rounded-md" />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    )
  }

  if (error) {
    return <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-lg">{error}</div>
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Usuarios</h1>
          <p className="text-muted-foreground">Gestiona los usuarios del sistema</p>
        </div>
        <CreateUserDialog roles={roles} onSuccess={refreshUsers} />
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre o email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Filtrar por rol" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los roles</SelectItem>
            {roles.map((role) => (
              <SelectItem key={role.id} value={role.name}>
                {roleLabels[role.name] || role.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Filtrar por estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los estados</SelectItem>
            <SelectItem value="confirmed">Confirmado</SelectItem>
            <SelectItem value="pending">Pendiente</SelectItem>
          </SelectContent>
        </Select>

        <Select value={companyFilter} onValueChange={setCompanyFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filtrar por empresa" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las empresas</SelectItem>
            {companies.map((company) => (
              <SelectItem key={company.id} value={company.id}>{company.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters} className="text-muted-foreground">
            <X className="w-4 h-4 mr-1" /> Limpiar
          </Button>
        )}
      </div>

      {/* Notificaciones de reenvío */}
      {resendSuccess && (
        <div className="bg-green-50 border border-green-200 text-green-600 dark:bg-green-900/20 dark:border-green-800 dark:text-green-400 px-4 py-3 rounded-lg text-sm">
          {resendSuccess}
        </div>
      )}
      {resendError && (
        <div className="bg-red-50 border border-red-200 text-red-600 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400 px-4 py-3 rounded-lg text-sm">
          {resendError}
        </div>
      )}

      {/* Tabla */}
      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>Usuario</TableHead>
              <TableHead>Rol</TableHead>
              <TableHead>Empresa</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Fecha Registro</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  {hasActiveFilters ? 'No se encontraron usuarios con los filtros aplicados' : 'No hay usuarios registrados'}
                </TableCell>
              </TableRow>
            ) : (
              paginatedUsers.map((user) => (
                <TableRow key={user.id} className="hover:bg-muted/50">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="w-9 h-9">
                        <AvatarImage src={user.avatar_url || undefined} />
                        <AvatarFallback className="bg-muted text-muted-foreground text-xs">
                          {getInitials(user.full_name, user.email)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-foreground">{user.full_name || 'Sin nombre'}</p>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {user.roles && user.roles.length > 0 ? (
                        user.roles.map((roleName) => (
                          <Badge key={roleName} variant="outline" className={roleBadgeColors[roleName] || 'bg-muted text-muted-foreground'}>
                            {roleLabels[roleName] || roleName}
                          </Badge>
                        ))
                      ) : (
                        <Badge variant="outline" className={roleBadgeColors[user.role?.name || ''] || 'bg-muted text-muted-foreground'}>
                          {roleLabels[user.role?.name || ''] || user.role?.name || 'Sin rol'}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {user.company?.name || '-'}
                  </TableCell>
                  <TableCell>
                    {user.email_confirmed ? (
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800">Confirmado</Badge>
                    ) : (
                      <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800">Pendiente</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{formatDate(user.created_at)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      {!user.email_confirmed && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleResendInvite(user.id)}
                          disabled={resendingUserId === user.id}
                          title="Reenviar invitación"
                        >
                          {resendingUserId === user.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <RefreshCw className="w-4 h-4" />
                          )}
                        </Button>
                      )}
                      <EditUserDialog user={user} roles={roles} onSuccess={refreshUsers} />
                      <DeleteUserDialog user={user} onSuccess={refreshUsers} />
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Paginación */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>Mostrar</span>
          <Select value={pageSize.toString()} onValueChange={(v) => setPageSize(Number(v))}>
            <SelectTrigger className="w-[70px] h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="5">5</SelectItem>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="20">20</SelectItem>
              <SelectItem value="50">50</SelectItem>
            </SelectContent>
          </Select>
          <span>de {filteredUsers.length} usuarios</span>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="text-sm text-muted-foreground min-w-[100px] text-center">
            Página {currentPage} de {totalPages || 1}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage >= totalPages}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
