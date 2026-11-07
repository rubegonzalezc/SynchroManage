'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
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
import { RegistroTitle } from '@/components/dashboard/catalog/RegistroTitle'
import { GlassPanel } from '@/components/ui/glass-panel'
import { cn } from '@/lib/utils'

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
  const searchParams = useSearchParams()
  const focusUserId = searchParams.get('user')
  const openedFocusRef = useRef(false)

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

  useEffect(() => {
    if (!focusUserId || loading || filteredUsers.length === 0) return

    const index = filteredUsers.findIndex((user) => user.id === focusUserId)
    if (index < 0) return

    setCurrentPage(Math.floor(index / pageSize) + 1)

    const timeout = window.setTimeout(() => {
      document.getElementById(`user-row-${focusUserId}`)?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      })
    }, 150)

    return () => window.clearTimeout(timeout)
  }, [focusUserId, filteredUsers, loading, pageSize])

  useEffect(() => {
    if (!focusUserId || loading || users.length === 0 || openedFocusRef.current) return

    const user = users.find((item) => item.id === focusUserId)
    if (!user) return

    openedFocusRef.current = true
    setSearch(user.full_name || user.email || '')
  }, [focusUserId, loading, users])

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
    `px-3 py-1.5 rounded-lg text-[13px] font-medium whitespace-nowrap border transition-colors ${
      selected
        ? 'bg-primary text-primary-foreground border-primary'
        : 'bg-card text-muted-foreground border-border hover:text-foreground'
    }`

  if (error && users.length === 0 && !loading) {
    return (
      <div className="space-y-5">
        <RegistroTitle title="Usuarios" />
        <GlassPanel>
          <p className="text-[14px] text-red-600 dark:text-red-400">{error}</p>
        </GlassPanel>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <RegistroTitle
        title="Usuarios"
        subtitle="Quién entra al sistema y con qué rol."
        action={<CreateUserDialog roles={roles} onSuccess={refreshUsers} />}
      />

      <div className="grid gap-3 grid-cols-2 lg:grid-cols-3">
        <div className="rounded-2xl border border-sky-200 bg-sky-50 px-4 py-4 dark:border-sky-800 dark:bg-sky-950/40">
          <p className="text-[12px] font-medium text-muted-foreground">Total</p>
          {loading ? <Skeleton className="h-7 w-10 mt-2" /> : (
            <p className="mt-2 text-[28px] font-semibold leading-none text-sky-700 dark:text-sky-200">{users.length}</p>
          )}
        </div>
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-4 dark:border-emerald-800 dark:bg-emerald-950/40">
          <p className="text-[12px] font-medium text-muted-foreground">Confirmados</p>
          {loading ? <Skeleton className="h-7 w-10 mt-2" /> : (
            <p className="mt-2 text-[28px] font-semibold leading-none text-emerald-700 dark:text-emerald-200">{confirmedCount}</p>
          )}
        </div>
        <div className="col-span-2 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4 dark:border-amber-800 dark:bg-amber-950/40 lg:col-span-1">
          <p className="text-[12px] font-medium text-muted-foreground">Pendientes</p>
          {loading ? <Skeleton className="h-7 w-10 mt-2" /> : (
            <p className="mt-2 text-[28px] font-semibold leading-none text-amber-700 dark:text-amber-200">{pendingCount}</p>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
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
      </div>

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

      {loading ? (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-36 rounded-2xl" />
          ))}
        </div>
      ) : paginatedUsers.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border px-4 py-12 text-center text-[14px] text-muted-foreground">
          {hasActiveFilters ? 'No se encontraron usuarios' : 'No hay usuarios registrados'}
        </p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {paginatedUsers.map((user) => {
            const userRoles = user.roles && user.roles.length > 0
              ? user.roles
              : user.role?.name ? [user.role.name] : []
            const wash = userRoles.includes('admin')
              ? 'bg-rose-50 dark:bg-rose-950/25'
              : userRoles.includes('pm')
                ? 'bg-sky-50 dark:bg-sky-950/25'
                : userRoles.includes('tech_lead')
                  ? 'bg-violet-50 dark:bg-violet-950/25'
                  : userRoles.includes('developer')
                    ? 'bg-emerald-50 dark:bg-emerald-950/25'
                    : 'bg-card'

            return (
              <article
                key={user.id}
                id={`user-row-${user.id}`}
                className={cn(
                  'flex flex-col rounded-2xl border border-border p-4',
                  wash,
                  focusUserId === user.id && 'ring-2 ring-primary/40'
                )}
              >
                <div className="flex items-start gap-3">
                  <Avatar className="h-10 w-10 shrink-0">
                    <AvatarImage src={user.avatar_url || undefined} />
                    <AvatarFallback className="text-[11px]">
                      {getInitials(user.full_name, user.email)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[15px] font-semibold">{user.full_name || 'Sin nombre'}</p>
                    <p className="truncate text-[12px] text-muted-foreground">{user.email}</p>
                  </div>
                  <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                    user.email_confirmed
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                      : 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200'
                  }`}>
                    {user.email_confirmed ? 'Confirmado' : 'Pendiente'}
                  </span>
                </div>
                <div className="mt-3 flex flex-wrap gap-1">
                  {userRoles.length > 0 ? userRoles.map((roleName) => (
                    <span key={roleName} className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${roleBadgeColors[roleName] || 'bg-muted text-muted-foreground'}`}>
                      {roleLabels[roleName] || roleName}
                    </span>
                  )) : (
                    <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-semibold text-muted-foreground">Sin rol</span>
                  )}
                </div>
                <p className="mt-2 text-[12px] text-muted-foreground">
                  {user.company?.name || 'Sin empresa'} · {formatDate(user.created_at)}
                </p>
                <div className="mt-3 flex items-center justify-end gap-0.5">
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
              </article>
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
    </div>
  )
}
