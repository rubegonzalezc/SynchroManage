'use client'

import { useState, useEffect, useMemo } from 'react'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { EditUserDialog } from './EditUserDialog'
import { DeleteUserDialog } from './DeleteUserDialog'
import { CreateUserDialog } from './CreateUserDialog'
import { Search, ChevronLeft, ChevronRight, X, RefreshCw, Loader2 } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { GlassPanel } from '@/components/ui/glass-panel'

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
  admin: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  pm: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  tech_lead: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  developer: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  stakeholder: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400',
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

  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [companyFilter, setCompanyFilter] = useState<string>('all')

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

  const totalPages = Math.ceil(filteredUsers.length / pageSize)
  const paginatedUsers = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return filteredUsers.slice(start, start + pageSize)
  }, [filteredUsers, currentPage, pageSize])

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

  const confirmedCount = users.filter(u => u.email_confirmed).length
  const pendingCount = users.filter(u => !u.email_confirmed).length

  const pillClass = (selected: boolean) =>
    `px-3.5 py-1.5 rounded-full text-[13px] font-medium whitespace-nowrap transition-colors ${
      selected
        ? 'bg-primary text-primary-foreground shadow-[0_6px_16px_rgba(37,99,235,0.28)]'
        : 'text-muted-foreground hover:bg-black/5 dark:hover:bg-white/8 hover:text-foreground'
    }`

  if (error && users.length === 0 && !loading) {
    return (
      <div className="space-y-5">
        <h1 className="text-[28px] font-semibold tracking-tight text-foreground leading-tight">Usuarios</h1>
        <GlassPanel>
          <p className="text-[14px] text-red-600 dark:text-red-400">{error}</p>
        </GlassPanel>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-[28px] font-semibold tracking-tight text-foreground leading-tight">Usuarios</h1>
          <p className="text-[15px] text-muted-foreground mt-1">Gestiona los usuarios del sistema</p>
        </div>
        <CreateUserDialog roles={roles} onSuccess={refreshUsers} />
      </div>

      <div className="grid gap-3 grid-cols-2 lg:grid-cols-3">
        <GlassPanel padding={2.25}>
          <p className="text-[12px] font-medium text-muted-foreground tracking-tight">Total</p>
          {loading ? <Skeleton className="h-7 w-10 mt-2" /> : (
            <p className="text-[28px] font-semibold tracking-tight leading-none mt-2" style={{ color: '#0A84FF' }}>{users.length}</p>
          )}
        </GlassPanel>
        <GlassPanel padding={2.25}>
          <p className="text-[12px] font-medium text-muted-foreground tracking-tight">Confirmados</p>
          {loading ? <Skeleton className="h-7 w-10 mt-2" /> : (
            <p className="text-[28px] font-semibold tracking-tight leading-none mt-2" style={{ color: '#30D158' }}>{confirmedCount}</p>
          )}
        </GlassPanel>
        <GlassPanel padding={2.25} className="col-span-2 lg:col-span-1">
          <p className="text-[12px] font-medium text-muted-foreground tracking-tight">Pendientes</p>
          {loading ? <Skeleton className="h-7 w-10 mt-2" /> : (
            <p className="text-[28px] font-semibold tracking-tight leading-none mt-2" style={{ color: '#FF9F0A' }}>{pendingCount}</p>
          )}
        </GlassPanel>
      </div>

      <GlassPanel padding={1} sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground z-10" />
          <Input
            placeholder="Buscar por nombre o email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <button type="button" onClick={() => setRoleFilter('all')} className={pillClass(roleFilter === 'all')}>
          Todos
        </button>
        {roles.map((role) => (
          <button type="button" key={role.id} onClick={() => setRoleFilter(role.name)} className={pillClass(roleFilter === role.name)}>
            {roleLabels[role.name] || role.name}
          </button>
        ))}

        <button type="button" onClick={() => setStatusFilter('all')} className={pillClass(statusFilter === 'all')}>
          Todos los estados
        </button>
        <button type="button" onClick={() => setStatusFilter('confirmed')} className={pillClass(statusFilter === 'confirmed')}>
          Confirmado
        </button>
        <button type="button" onClick={() => setStatusFilter('pending')} className={pillClass(statusFilter === 'pending')}>
          Pendiente
        </button>

        <Select value={companyFilter} onValueChange={setCompanyFilter}>
          <SelectTrigger className="w-[180px] h-8">
            <SelectValue placeholder="Empresa" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las empresas</SelectItem>
            {companies.map((company) => (
              <SelectItem key={company.id} value={company.id}>{company.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters} className="text-muted-foreground rounded-full">
            <X className="w-4 h-4" /> Limpiar
          </Button>
        )}
      </GlassPanel>

      {resendSuccess && (
        <GlassPanel padding={2}>
          <p className="text-[13px] text-green-600 dark:text-green-400">{resendSuccess}</p>
        </GlassPanel>
      )}
      {resendError && (
        <GlassPanel padding={2}>
          <p className="text-[13px] text-red-600 dark:text-red-400">{resendError}</p>
        </GlassPanel>
      )}

      <GlassPanel padding={2.25}>
        {loading ? (
          <div className="space-y-1">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center gap-3 rounded-2xl px-3 py-3">
                <Skeleton className="w-9 h-9 rounded-full flex-shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-44" />
                </div>
                <Skeleton className="h-5 w-20 rounded-full" />
              </div>
            ))}
          </div>
        ) : paginatedUsers.length === 0 ? (
          <p className="text-[14px] text-muted-foreground text-center py-12">
            {hasActiveFilters ? 'No se encontraron usuarios' : 'No hay usuarios registrados'}
          </p>
        ) : (
          <div className="space-y-0.5">
            {paginatedUsers.map((user) => {
              const userRoles = user.roles && user.roles.length > 0
                ? user.roles
                : user.role?.name ? [user.role.name] : []

              return (
                <div
                  key={user.id}
                  className="flex items-center gap-3 rounded-2xl px-3 py-3 hover:bg-black/[0.04] dark:hover:bg-white/[0.06] transition-colors"
                >
                  <Avatar className="w-9 h-9 flex-shrink-0">
                    <AvatarImage src={user.avatar_url || undefined} />
                    <AvatarFallback className="text-[11px]">
                      {getInitials(user.full_name, user.email)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="text-[14px] font-medium text-foreground truncate">{user.full_name || 'Sin nombre'}</p>
                    <p className="text-[12px] text-muted-foreground truncate mt-0.5">
                      {[user.email, user.company?.name].filter(Boolean).join(' · ')}
                    </p>
                  </div>
                  <div className="hidden sm:flex flex-wrap gap-1 flex-shrink-0">
                    {userRoles.length > 0 ? userRoles.map((roleName) => (
                      <span key={roleName} className={`text-[11px] font-semibold rounded-full px-2.5 py-0.5 ${roleBadgeColors[roleName] || 'bg-muted text-muted-foreground'}`}>
                        {roleLabels[roleName] || roleName}
                      </span>
                    )) : (
                      <span className="text-[11px] font-semibold rounded-full px-2.5 py-0.5 bg-muted text-muted-foreground">Sin rol</span>
                    )}
                  </div>
                  <span className={`text-[11px] font-semibold rounded-full px-2.5 py-0.5 flex-shrink-0 ${
                    user.email_confirmed
                      ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                      : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                  }`}>
                    {user.email_confirmed ? 'Confirmado' : 'Pendiente'}
                  </span>
                  <span className="hidden md:block text-[12px] text-muted-foreground flex-shrink-0 w-[100px] text-right">
                    {formatDate(user.created_at)}
                  </span>
                  <div className="flex items-center gap-0.5 flex-shrink-0">
                    {!user.email_confirmed && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-full"
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
                </div>
              )
            })}
          </div>
        )}

        {!loading && filteredUsers.length > 0 && (
          <div className="flex items-center justify-between gap-3 pt-4 mt-2">
            <div className="flex items-center gap-2 text-[13px] text-muted-foreground">
              <span>Mostrar</span>
              <Select value={pageSize.toString()} onValueChange={(v) => setPageSize(Number(v))}>
                <SelectTrigger className="w-[72px] h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5</SelectItem>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                </SelectContent>
              </Select>
              <span>de {filteredUsers.length}</span>
            </div>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="text-[13px] text-muted-foreground min-w-[88px] text-center">
                {currentPage} / {totalPages || 1}
              </span>
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage >= totalPages}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </GlassPanel>
    </div>
  )
}
