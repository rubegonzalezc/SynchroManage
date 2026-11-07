'use client'

import type { ReactNode } from 'react'
import { Search, ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'

export const catalogStatusLabels: Record<string, string> = {
  planning: 'Planificación',
  in_progress: 'En curso',
  paused: 'Pausado',
  completed: 'Cerrado',
  cancelled: 'Cancelado',
}

const statusInk: Record<string, string> = {
  planning: 'bg-zinc-400',
  in_progress: 'bg-sky-600',
  paused: 'bg-amber-500',
  completed: 'bg-emerald-600',
  cancelled: 'bg-rose-600',
}

const filters = [
  { value: 'all', label: 'Todos' },
  { value: 'in_progress', label: 'En curso' },
  { value: 'planning', label: 'Plan' },
  { value: 'paused', label: 'Pausa' },
  { value: 'completed', label: 'Cerrados' },
  { value: 'cancelled', label: 'Cancelados' },
]

export interface CatalogCard {
  id: string
  name: string
  status: string
  meta: string
  dates: string
  actions?: ReactNode
}

interface WorkCatalogProps {
  title: string
  subtitle: string
  action?: ReactNode
  items: CatalogCard[]
  total: number
  counts: Record<string, number>
  loading: boolean
  error: string | null
  search: string
  onSearch: (value: string) => void
  searchPlaceholder: string
  statusFilter: string
  onStatus: (value: string) => void
  onClear: () => void
  page: number
  pageSize: number
  onPage: (page: number) => void
  onPageSize: (size: number) => void
  emptyMessage: string
  filteredEmptyMessage: string
  onOpen: (id: string) => void
  onHover?: (id: string) => void
}

export function WorkCatalog({
  title,
  subtitle,
  action,
  items,
  total,
  counts,
  loading,
  error,
  search,
  onSearch,
  searchPlaceholder,
  statusFilter,
  onStatus,
  onClear,
  page,
  pageSize,
  onPage,
  onPageSize,
  emptyMessage,
  filteredEmptyMessage,
  onOpen,
  onHover,
}: WorkCatalogProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const hasFilters = search !== '' || statusFilter !== 'all'
  const allCount = Object.values(counts).reduce((sum, value) => sum + value, 0)

  return (
    <div className="w-full overflow-x-hidden">
      <header className="flex flex-col gap-4 border-b border-foreground/20 pb-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-muted-foreground">Registro</p>
          <h1
            className="mt-1 text-[34px] leading-none tracking-tight text-foreground sm:text-[44px]"
            style={{ fontFamily: 'Georgia, "Iowan Old Style", Palatino, serif' }}
          >
            {title}
          </h1>
          <p className="mt-2 max-w-lg text-[14px] text-muted-foreground">{subtitle}</p>
        </div>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:items-end">
          {action}
          <div className="relative w-full sm:w-80">
            <Search className="pointer-events-none absolute left-0 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search}
              onChange={(event) => onSearch(event.target.value)}
              placeholder={searchPlaceholder}
              className="h-10 w-full border-0 border-b border-foreground/40 bg-transparent pl-6 text-[14px] text-foreground outline-none placeholder:text-muted-foreground"
            />
          </div>
        </div>
      </header>

      <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
        {filters.map((filter) => {
          const selected = statusFilter === filter.value
          const count = filter.value === 'all' ? allCount : counts[filter.value] || 0
          return (
            <button
              key={filter.value}
              type="button"
              onClick={() => onStatus(selected && filter.value !== 'all' ? 'all' : filter.value)}
              className={`border border-foreground/15 px-3 py-3 text-left ${
                selected ? 'bg-foreground text-background' : 'bg-transparent hover:bg-foreground/[0.04]'
              }`}
            >
              <span className="block text-[26px] font-semibold tabular-nums leading-none">
                {loading ? '–' : count}
              </span>
              <span className={`mt-2 block text-[11px] uppercase tracking-[0.16em] ${selected ? 'text-background/70' : 'text-muted-foreground'}`}>
                {filter.label}
              </span>
            </button>
          )
        })}
      </div>

      {hasFilters && (
        <button type="button" onClick={onClear} className="mt-3 text-[12px] uppercase tracking-[0.14em] text-muted-foreground underline-offset-4 hover:underline">
          Quitar filtros
        </button>
      )}

      {error ? (
        <p className="mt-6 border border-rose-600/40 px-4 py-6 text-[14px] text-rose-600">{error}</p>
      ) : loading ? (
        <div className="mt-6 space-y-3">
          {[1, 2, 3, 4, 5].map((item) => (
            <div key={item} className="grid grid-cols-[16px_1fr] gap-3 border-b border-foreground/10 py-3">
              <Skeleton className="mt-1 h-2.5 w-2.5 rounded-none" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-1/2 rounded-none" />
                <Skeleton className="h-3 w-1/3 rounded-none" />
              </div>
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <p className="mt-8 border border-dashed border-foreground/25 px-4 py-12 text-center text-[14px] text-muted-foreground">
          {hasFilters ? filteredEmptyMessage : emptyMessage}
        </p>
      ) : (
        <>
          <div className="mt-6 hidden md:grid md:grid-cols-[1.6fr_1.1fr_0.9fr_7.5rem_2rem] md:gap-4 md:border-b md:border-foreground/20 md:px-1 md:pb-2">
            {['Nombre', 'Contexto', 'Fechas', 'Estado', ''].map((label) => (
              <span key={label || 'accion'} className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                {label}
              </span>
            ))}
          </div>
          <ul>
            {items.map((item) => (
              <li key={item.id} className="border-b border-foreground/10">
                <div
                  role="link"
                  tabIndex={0}
                  onClick={() => onOpen(item.id)}
                  onMouseEnter={() => onHover?.(item.id)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault()
                      onOpen(item.id)
                    }
                  }}
                  className="cursor-pointer py-3.5 md:grid md:grid-cols-[1.6fr_1.1fr_0.9fr_7.5rem_2rem] md:items-center md:gap-4"
                >
                  <div className="flex min-w-0 items-start gap-3">
                    <span className={`mt-1.5 h-2.5 w-2.5 shrink-0 ${statusInk[item.status] || statusInk.planning}`} />
                    <span className="min-w-0">
                      <span className="block text-[16px] font-medium leading-snug">{item.name}</span>
                      <span className="mt-1 block text-[13px] text-muted-foreground md:hidden">{item.meta}</span>
                    </span>
                  </div>
                  <p className="hidden text-[13px] text-muted-foreground md:block md:truncate">{item.meta}</p>
                  <p className="mt-2 pl-[22px] text-[13px] text-muted-foreground md:mt-0 md:pl-0">{item.dates}</p>
                  <p className="mt-1 pl-[22px] text-[11px] uppercase tracking-[0.14em] md:mt-0 md:pl-0">
                    {catalogStatusLabels[item.status] || item.status}
                  </p>
                  {item.actions ? (
                    <div
                      className="mt-2 pl-[22px] md:mt-0 md:pl-0"
                      onClick={(event) => event.stopPropagation()}
                      onKeyDown={(event) => event.stopPropagation()}
                    >
                      {item.actions}
                    </div>
                  ) : (
                    <span className="hidden md:block" />
                  )}
                </div>
              </li>
            ))}
          </ul>
        </>
      )}

      {!loading && !error && total > 0 && (
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 text-[13px] text-muted-foreground">
            <span>Filas</span>
            <Select value={pageSize.toString()} onValueChange={(value) => onPageSize(Number(value))}>
              <SelectTrigger className="h-8 w-[72px] rounded-none">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="6">6</SelectItem>
                <SelectItem value="12">12</SelectItem>
                <SelectItem value="24">24</SelectItem>
              </SelectContent>
            </Select>
            <span>de {total}</span>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-none" onClick={() => onPage(Math.max(1, page - 1))} disabled={page === 1}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="min-w-[72px] text-center text-[13px] tabular-nums text-muted-foreground">
              {page} / {totalPages}
            </span>
            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-none" onClick={() => onPage(Math.min(totalPages, page + 1))} disabled={page >= totalPages}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

export function CatalogPageLoading() {
  return (
    <div>
      <Skeleton className="h-3 w-16 rounded-none" />
      <Skeleton className="mt-3 h-10 w-56 rounded-none" />
      <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
        {[1, 2, 3, 4, 5, 6].map((item) => (
          <Skeleton key={item} className="h-[76px] rounded-none" />
        ))}
      </div>
      <div className="mt-6 space-y-3">
        {[1, 2, 3, 4].map((item) => (
          <Skeleton key={item} className="h-12 rounded-none" />
        ))}
      </div>
    </div>
  )
}
