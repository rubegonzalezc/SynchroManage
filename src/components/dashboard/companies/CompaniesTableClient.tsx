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
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-[28px] font-semibold tracking-tight text-foreground leading-tight">Empresas</h1>
          <p className="text-[15px] text-muted-foreground mt-1">Gestiona las empresas del sistema</p>
        </div>
        <CreateCompanyDialog onCompanyCreated={fetchCompanies} />
      </div>

      <div className="grid gap-3 grid-cols-2 lg:grid-cols-3">
        <GlassPanel padding={2.25}>
          <p className="text-[12px] font-medium text-muted-foreground tracking-tight">Total</p>
          {loading ? <Skeleton className="h-7 w-10 mt-2" /> : (
            <p className="text-[28px] font-semibold tracking-tight leading-none mt-2" style={{ color: '#0A84FF' }}>{companies.length}</p>
          )}
        </GlassPanel>
        <GlassPanel padding={2.25}>
          <p className="text-[12px] font-medium text-muted-foreground tracking-tight">Activas</p>
          {loading ? <Skeleton className="h-7 w-10 mt-2" /> : (
            <p className="text-[28px] font-semibold tracking-tight leading-none mt-2" style={{ color: '#30D158' }}>{activeCount}</p>
          )}
        </GlassPanel>
        <GlassPanel padding={2.25} className="col-span-2 lg:col-span-1">
          <p className="text-[12px] font-medium text-muted-foreground tracking-tight">Inactivas</p>
          {loading ? <Skeleton className="h-7 w-10 mt-2" /> : (
            <p className="text-[28px] font-semibold tracking-tight leading-none mt-2" style={{ color: '#8E8E93' }}>{inactiveCount}</p>
          )}
        </GlassPanel>
      </div>

      <GlassPanel padding={1} sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
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
      </GlassPanel>

      {error ? (
        <GlassPanel>
          <p className="text-[14px] text-red-600 dark:text-red-400">{error}</p>
        </GlassPanel>
      ) : (
        <GlassPanel padding={2.25}>
          {loading ? (
            <div className="space-y-1">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center gap-3 rounded-2xl px-3 py-3">
                  <Skeleton className="h-4 flex-1" />
                  <Skeleton className="h-5 w-16 rounded-full" />
                </div>
              ))}
            </div>
          ) : paginatedCompanies.length === 0 ? (
            <p className="text-[14px] text-muted-foreground text-center py-12">
              {hasActiveFilters ? 'No se encontraron empresas' : 'No hay empresas registradas'}
            </p>
          ) : (
            <div className="space-y-0.5">
              {paginatedCompanies.map((company) => (
                <div
                  key={company.id}
                  className="flex items-center gap-3 rounded-2xl px-3 py-3 hover:bg-black/[0.04] dark:hover:bg-white/[0.06] transition-colors"
                >
                  <div className="w-9 h-9 rounded-2xl bg-black/[0.04] dark:bg-white/[0.06] flex items-center justify-center flex-shrink-0">
                    <Building2 className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[14px] font-medium text-foreground truncate">{company.name}</p>
                    <p className="text-[12px] text-muted-foreground truncate mt-0.5">
                      {[company.rut, company.email, company.phone].filter(Boolean).join(' · ') || 'Sin datos de contacto'}
                    </p>
                  </div>
                  <span className={`text-[11px] font-semibold rounded-full px-2.5 py-0.5 flex-shrink-0 ${
                    company.is_active
                      ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                      : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                  }`}>
                    {company.is_active ? 'Activa' : 'Inactiva'}
                  </span>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <EditCompanyDialog company={company} onCompanyUpdated={fetchCompanies} />
                    <DeleteCompanyDialog company={company} onCompanyDeleted={fetchCompanies} />
                  </div>
                </div>
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
        </GlassPanel>
      )}
    </div>
  )
}
