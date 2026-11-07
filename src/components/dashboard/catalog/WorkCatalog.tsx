'use client'

import type { ReactNode } from 'react'
import { Search, ChevronLeft, ChevronRight, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'

export const catalogStatusLabels: Record<string, string> = {
  planning: 'Planificación',
  in_progress: 'En progreso',
  paused: 'Pausado',
  completed: 'Completado',
  cancelled: 'Cancelado',
}

const statusClass: Record<string, string> = {
  planning: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  in_progress: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  paused: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  completed: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  cancelled: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
}

const statusBar: Record<string, string> = {
  planning: 'bg-slate-400',
  in_progress: 'bg-blue-500',
  paused: 'bg-amber-500',
  completed: 'bg-green-500',
  cancelled: 'bg-red-500',
}

const filters = [
  { value: 'all', label: 'Todos' },
  { value: 'in_progress', label: 'En progreso' },
  { value: 'planning', label: 'Planificación' },
  { value: 'paused', label: 'Pausados' },
  { value: 'completed', label: 'Completados' },
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
    <div className="space-y-5 w-full overflow-x-hidden">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-[32px] font-semibold tracking-tight leading-none text-foreground sm:text-[40px]">
            {title}
          </h1>
          <p className="mt-3 max-w-xl text-[15px] text-muted-foreground">{subtitle}</p>
        </div>
        {action}
      </header>

      <section className="rounded-[28px] border border-border bg-card p-4 sm:p-5">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => onSearch(event.target.value)}
            placeholder={searchPlaceholder}
            className="h-11 rounded-2xl pl-10"
          />
        </div>
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1 snap-x">
          {filters.map((filter) => {
            const selected = statusFilter === filter.value
            const count = filter.value === 'all' ? allCount : counts[filter.value] || 0
            return (
              <button
                key={filter.value}
                type="button"
                onClick={() => onStatus(filter.value)}
                className={`snap-start shrink-0 rounded-full px-3.5 py-2 text-[13px] font-medium ${
                  selected
                    ? 'bg-primary text-primary-foreground'
                    : 'border border-border bg-background text-muted-foreground'
                }`}
              >
                {filter.label}
                <span className="ml-1.5 tabular-nums">{loading ? '–' : count}</span>
              </button>
            )
          })}
          {hasFilters && (
            <Button type="button" variant="ghost" size="sm" onClick={onClear} className="shrink-0 rounded-full">
              <X className="h-4 w-4" /> Limpiar
            </Button>
          )}
        </div>
      </section>

      {error ? (
        <section className="rounded-[28px] border border-border bg-card p-6">
          <p className="text-[14px] text-red-600 dark:text-red-400">{error}</p>
        </section>
      ) : (
        <section>
          {loading ? (
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {[1, 2, 3, 4, 5, 6].map((item) => (
                <div key={item} className="rounded-[24px] border border-border bg-card p-4">
                  <Skeleton className="h-5 w-24 rounded-full" />
                  <Skeleton className="mt-4 h-5 w-3/4" />
                  <Skeleton className="mt-2 h-4 w-1/2" />
                  <Skeleton className="mt-4 h-3 w-2/5" />
                </div>
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="rounded-[28px] border border-border bg-card px-4 py-14 text-center text-[14px] text-muted-foreground">
              {hasFilters ? filteredEmptyMessage : emptyMessage}
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {items.map((item) => (
                <article
                  key={item.id}
                  onClick={() => onOpen(item.id)}
                  onMouseEnter={() => onHover?.(item.id)}
                  className="flex cursor-pointer flex-col rounded-[24px] border border-border bg-card p-4 transition-colors hover:border-primary/40"
                >
                  <div className="flex items-start justify-between gap-3">
                    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${statusClass[item.status] || statusClass.planning}`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${statusBar[item.status] || statusBar.planning}`} />
                      {catalogStatusLabels[item.status] || item.status}
                    </span>
                    {item.actions && (
                      <div onClick={(event) => event.stopPropagation()}>{item.actions}</div>
                    )}
                  </div>
                  <h2 className="mt-3 text-[17px] font-semibold tracking-tight text-foreground">{item.name}</h2>
                  <p className="mt-1 text-[13px] text-muted-foreground">{item.meta}</p>
                  <p className="mt-4 text-[12px] text-muted-foreground">{item.dates}</p>
                </article>
              ))}
            </div>
          )}

          {!loading && total > 0 && (
            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2 text-[13px] text-muted-foreground">
                <span>Mostrar</span>
                <Select value={pageSize.toString()} onValueChange={(value) => onPageSize(Number(value))}>
                  <SelectTrigger className="h-8 w-[72px]">
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
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 rounded-full"
                  onClick={() => onPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="min-w-[72px] text-center text-[13px] text-muted-foreground">
                  {page} / {totalPages}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 rounded-full"
                  onClick={() => onPage(Math.min(totalPages, page + 1))}
                  disabled={page >= totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </section>
      )}
    </div>
  )
}

export function CatalogPageLoading() {
  return (
    <div className="space-y-5">
      <div className="space-y-3">
        <Skeleton className="h-10 w-56" />
        <Skeleton className="h-4 w-72" />
      </div>
      <Skeleton className="h-28 w-full rounded-[28px]" />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map((item) => (
          <Skeleton key={item} className="h-36 rounded-[24px]" />
        ))}
      </div>
    </div>
  )
}
