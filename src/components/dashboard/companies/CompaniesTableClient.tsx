'use client'

import { useState, useEffect, useMemo } from 'react'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Search, Building2, ChevronLeft, ChevronRight, X } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { CreateCompanyDialog } from './CreateCompanyDialog'
import { EditCompanyDialog } from './EditCompanyDialog'
import { DeleteCompanyDialog } from './DeleteCompanyDialog'

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
  
  // Filtros
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  
  // Paginación
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

  // Filtrar empresas
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

  // Paginación
  const totalPages = Math.ceil(filteredCompanies.length / pageSize)
  const paginatedCompanies = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return filteredCompanies.slice(start, start + pageSize)
  }, [filteredCompanies, currentPage, pageSize])

  // Reset página cuando cambian filtros
  useEffect(() => {
    setCurrentPage(1)
  }, [search, statusFilter, pageSize])

  const clearFilters = () => {
    setSearch('')
    setStatusFilter('all')
  }

  const hasActiveFilters = search !== '' || statusFilter !== 'all'

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Empresas</h1>
          <p className="text-muted-foreground">Gestiona las empresas clientes</p>
        </div>
        <CreateCompanyDialog onCompanyCreated={fetchCompanies} />
      </div>

      <div className="space-y-4">
        {/* Filtros */}
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre, RUT o email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Filtrar por estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los estados</SelectItem>
              <SelectItem value="active">Activa</SelectItem>
              <SelectItem value="inactive">Inactiva</SelectItem>
            </SelectContent>
          </Select>

          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters} className="text-muted-foreground">
              <X className="w-4 h-4 mr-1" /> Limpiar
            </Button>
          )}
        </div>

        {loading ? (
          <div className="rounded-lg border bg-card">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead><Skeleton className="h-4 w-24" /></TableHead>
                  <TableHead><Skeleton className="h-4 w-16" /></TableHead>
                  <TableHead><Skeleton className="h-4 w-20" /></TableHead>
                  <TableHead><Skeleton className="h-4 w-16" /></TableHead>
                  <TableHead className="text-right"><Skeleton className="h-4 w-16 ml-auto" /></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[1, 2, 3, 4, 5].map((i) => (
                  <TableRow key={i}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Skeleton className="w-9 h-9 rounded-lg flex-shrink-0" />
                        <Skeleton className="h-4 w-36" />
                      </div>
                    </TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell>
                      <div className="space-y-1.5">
                        <Skeleton className="h-3.5 w-40" />
                        <Skeleton className="h-3 w-28" />
                      </div>
                    </TableCell>
                    <TableCell><Skeleton className="h-5 w-16 rounded-full" /></TableCell>
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
        ) : error ? (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-lg">{error}</div>
        ) : (
          <>
            {/* Tabla */}
            <div className="rounded-lg border bg-card">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>Empresa</TableHead>
                    <TableHead>RUT</TableHead>
                    <TableHead>Contacto</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedCompanies.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        {hasActiveFilters ? 'No se encontraron empresas con los filtros aplicados' : 'No hay empresas registradas'}
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedCompanies.map((company) => (
                      <TableRow key={company.id} className="hover:bg-muted/50">
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center">
                              <Building2 className="w-4 h-4 text-muted-foreground" />
                            </div>
                            <span className="font-medium text-foreground">{company.name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground">{company.rut || '-'}</TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <p className="text-muted-foreground">{company.email || '-'}</p>
                            <p className="text-muted-foreground/70">{company.phone || ''}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={company.is_active 
                            ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800' 
                            : 'bg-muted text-muted-foreground'}>
                            {company.is_active ? 'Activa' : 'Inactiva'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <EditCompanyDialog company={company} onCompanyUpdated={fetchCompanies} />
                            <DeleteCompanyDialog company={company} onCompanyDeleted={fetchCompanies} />
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
                <span>de {filteredCompanies.length} empresas</span>
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
          </>
        )}
      </div>
    </div>
  )
}
