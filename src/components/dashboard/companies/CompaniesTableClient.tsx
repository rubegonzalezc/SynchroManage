'use client'

import { useState, useEffect, useMemo } from 'react'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Search, Building2, ChevronLeft, ChevronRight, X } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { CreateCompanyDialog } from './CreateCompanyDialog'
import { EditCompanyDialog } from './EditCompanyDialog'
import { DeleteCompanyDialog } from './DeleteCompanyDialog'
import { RegistroTitle } from '@/components/dashboard/catalog/RegistroTitle'
import { GlassPanel } from '@/components/ui/glass-panel'

interface Company {
  id: string
  name: string
  rut: string | null
  email: string | null
  phone: string | null
  address: string | null
  is_active: boolean
  created_at: string
}

export function CompaniesTableClient() {
  const [companies, setCompanies] = useState<Company[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const fetchCompanies = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/dashboard/companies')
      const data = await response.json()
      if (!response.ok) throw new Error(data.error)
      setCompanies(data.companies)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar empresas')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchCompanies() }, [])

  const filteredCompanies = useMemo(() => {
    return companies.filter(c => {
      const matchesSearch = search === '' ||
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.rut?.toLowerCase().includes(search.toLowerCase()) ||
        c.email?.toLowerCase().includes(search.toLowerCase())

      const matchesStatus = statusFilter === 'all' ||
        (statusFilter === 'active' && c.is_active) ||
        (statusFilter === 'inactive' && !c.is_active)

      return matchesSearch && matchesStatus
    })
  }, [companies, search, statusFilter])

  const totalPages = Math.ceil(filteredCompanies.length / pageSize)
  const paginatedCompanies = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return filteredCompanies.slice(start, start + pageSize)
  }, [filteredCompanies, currentPage, pageSize])

  useEffect(() => {
    setCurrentPage(1)
  }, [search, statusFilter, pageSize])

  const clearFilters = () => {
    setSearch('')
    setStatusFilter('all')
  }

  const hasActiveFilters = search !== '' || statusFilter !== 'all'
  const activeCount = companies.filter(c => c.is_active).length
  const inactiveCount = companies.filter(c => !c.is_active).length

  const statusFilters = [
    { value: 'all', label: 'Todas' },
    { value: 'active', label: 'Activas' },
    { value: 'inactive', label: 'Inactivas' },
  ]

  return (
    <div className="space-y-5">
      <RegistroTitle
        title="Empresas"
        subtitle="Las empresas que agrupan los proyectos."
        action={<CreateCompanyDialog onCompanyCreated={fetchCompanies} />}
      />

      <div className="grid gap-3 grid-cols-2 lg:grid-cols-3">
        <div className="rounded-2xl border border-sky-200 bg-sky-50 px-4 py-4 dark:border-sky-800 dark:bg-sky-950/40">
          <p className="text-[12px] font-medium text-muted-foreground">Total</p>
          {loading ? <Skeleton className="mt-2 h-7 w-10" /> : (
            <p className="mt-2 text-[28px] font-semibold leading-none text-sky-700 dark:text-sky-200">{companies.length}</p>
          )}
        </div>
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-4 dark:border-emerald-800 dark:bg-emerald-950/40">
          <p className="text-[12px] font-medium text-muted-foreground">Activas</p>
          {loading ? <Skeleton className="mt-2 h-7 w-10" /> : (
            <p className="mt-2 text-[28px] font-semibold leading-none text-emerald-700 dark:text-emerald-200">{activeCount}</p>
          )}
        </div>
        <div className="col-span-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 dark:border-slate-700 dark:bg-slate-900/40 lg:col-span-1">
          <p className="text-[12px] font-medium text-muted-foreground">Inactivas</p>
          {loading ? <Skeleton className="mt-2 h-7 w-10" /> : (
            <p className="mt-2 text-[28px] font-semibold leading-none text-slate-600 dark:text-slate-200">{inactiveCount}</p>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground z-10" />
          <Input
            placeholder="Buscar por nombre, RUT o email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="flex items-center gap-1 flex-wrap">
          {statusFilters.map((filter) => {
            const selected = statusFilter === filter.value
            return (
              <button
                type="button"
                key={filter.value}
                onClick={() => setStatusFilter(filter.value)}
                className={`px-3.5 py-1.5 rounded-full text-[13px] font-medium whitespace-nowrap transition-colors ${
                  selected
                    ? 'bg-primary text-primary-foreground shadow-[0_6px_16px_rgba(37,99,235,0.28)]'
                    : 'text-muted-foreground hover:bg-black/5 dark:hover:bg-white/8 hover:text-foreground'
                }`}
              >
                {filter.label}
              </button>
            )
          })}
        </div>

        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters} className="text-muted-foreground rounded-full ml-auto">
            <X className="w-4 h-4" /> Limpiar
          </Button>
        )}
      </div>

      {error ? (
        <GlassPanel>
          <p className="text-[14px] text-red-600 dark:text-red-400">{error}</p>
        </GlassPanel>
      ) : (
        <>
        {loading ? (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="h-36 rounded-2xl" />
            ))}
          </div>
        ) : paginatedCompanies.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border px-4 py-12 text-center text-[14px] text-muted-foreground">
            {hasActiveFilters ? 'No se encontraron empresas' : 'No hay empresas registradas'}
          </p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {paginatedCompanies.map((company) => (
              <article
                key={company.id}
                className={`flex flex-col rounded-2xl border p-4 ${
                  company.is_active
                    ? 'border-emerald-200 bg-emerald-50/80 dark:border-emerald-800 dark:bg-emerald-950/25'
                    : 'border-border bg-card'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/80 dark:bg-white/10">
                    <Building2 className="h-4 w-4 text-emerald-700 dark:text-emerald-300" />
                  </div>
                  <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                    company.is_active
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                      : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                  }`}>
                    {company.is_active ? 'Activa' : 'Inactiva'}
                  </span>
                </div>
                <h2 className="mt-3 text-[16px] font-semibold tracking-tight">{company.name}</h2>
                <p className="mt-1 text-[13px] text-muted-foreground">
                  {[company.rut, company.email, company.phone].filter(Boolean).join(' · ') || 'Sin datos de contacto'}
                </p>
                {company.address && <p className="mt-1 text-[12px] text-muted-foreground">{company.address}</p>}
                <div className="mt-3 flex items-center justify-end gap-1">
                  <EditCompanyDialog company={company} onCompanyUpdated={fetchCompanies} />
                  <DeleteCompanyDialog company={company} onCompanyDeleted={fetchCompanies} />
                </div>
              </article>
            ))}
          </div>
        )}

          {!loading && filteredCompanies.length > 0 && (
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
                <span>de {filteredCompanies.length}</span>
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
        </>
      )}
    </div>
  )
}
