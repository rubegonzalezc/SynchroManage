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
  planning: 'bg-violet-500',
  in_progress: 'bg-sky-500',
  paused: 'bg-amber-500',
  completed: 'bg-emerald-500',
  cancelled: 'bg-rose-500',
}

const statusWash: Record<string, string> = {
  planning: 'bg-violet-50/80 dark:bg-violet-950/30',
  in_progress: 'bg-sky-50/80 dark:bg-sky-950/30',
  paused: 'bg-amber-50/80 dark:bg-amber-950/25',
  completed: 'bg-emerald-50/80 dark:bg-emerald-950/25',
  cancelled: 'bg-rose-50/80 dark:bg-rose-950/25',
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
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-[28px] font-semibold tracking-tight text-foreground sm:text-[32px]">{title}</h1>
          <p className="mt-1 max-w-lg text-[14px] text-muted-foreground">{subtitle}</p>
        </div>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:items-end">
          {action}
          <div className="relative w-full sm:w-80">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search}
              onChange={(event) => onSearch(event.target.value)}
              placeholder={searchPlaceholder}
              className="h-10 w-full rounded-xl border border-border bg-card pl-9 pr-3 text-[14px] text-foreground outline-none placeholder:text-muted-foreground"
            />
          </div>
        </div>
      </header>

      <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
        {filters.map((filter) => {
          const selected = statusFilter === filter.value
          const count = filter.value === 'all' ? allCount : counts[filter.value] || 0
          return (
            <button
              key={filter.value}
              type="button"
              onClick={() => onStatus(filter.value)}
              className={`shrink-0 rounded-xl border px-3 py-2 text-left ${
                selected ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-card text-foreground'
              }`}
            >
              <span className="block text-[18px] font-semibold tabular-nums leading-none">{loading ? '–' : count}</span>
              <span className={`mt-1 block text-[12px] ${selected ? 'text-primary-foreground/80' : 'text-muted-foreground'}`}>{filter.label}</span>
            </button>
          )
        })}
        {hasFilters && (
          <button type="button" onClick={onClear} className="shrink-0 self-center px-2 text-[13px] text-muted-foreground underline-offset-4 hover:underline">
            Limpiar
          </button>
        )}
      </div>

      {error ? (
        <p className="mt-6 border border-rose-600/40 px-4 py-6 text-[14px] text-rose-600">{error}</p>
      ) : loading ? (
        <div className="mt-6 space-y-3">
          {[1, 2, 3, 4, 5].map((item) => (
            <div key={item} className="rounded-2xl border border-border bg-card p-4">
              <Skeleton className="h-3 w-24 rounded-lg" />
              <Skeleton className="mt-3 h-5 w-2/3 rounded-lg" />
              <Skeleton className="mt-2 h-3 w-1/3 rounded-lg" />
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <p className="mt-8 border border-dashed border-foreground/25 px-4 py-12 text-center text-[14px] text-muted-foreground">
          {hasFilters ? filteredEmptyMessage : emptyMessage}
        </p>
      ) : (
        <>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {items.map((item) => (
            <article
              key={item.id}
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
              className={`cursor-pointer overflow-hidden rounded-2xl border border-border p-4 transition-colors hover:border-primary/40 ${statusWash[item.status] || 'bg-card'}`}
            >
              <div className="flex items-start justify-between gap-3">
                <span className="inline-flex items-center gap-2 text-[12px] font-medium text-muted-foreground">
                  <span className={`h-2 w-2 rounded-full ${statusInk[item.status] || statusInk.planning}`} />
                  {catalogStatusLabels[item.status] || item.status}
                </span>
                {item.actions && (
                  <div onClick={(event) => event.stopPropagation()} onKeyDown={(event) => event.stopPropagation()}>
                    {item.actions}
                  </div>
                )}
              </div>
              <h2 className="mt-3 text-[17px] font-semibold tracking-tight">{item.name}</h2>
              <p className="mt-1 text-[13px] text-muted-foreground">{item.meta}</p>
              <p className="mt-4 text-[12px] text-muted-foreground">{item.dates}</p>
            </article>
          ))}
        </div>
        </>
      )}

      {!loading && !error && total > 0 && (
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 text-[13px] text-muted-foreground">
            <span>Por página</span>
            <Select value={pageSize.toString()} onValueChange={(value) => onPageSize(Number(value))}>
              <SelectTrigger className="h-8 w-[72px] rounded-xl">
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
            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl" onClick={() => onPage(Math.max(1, page - 1))} disabled={page === 1}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="min-w-[72px] text-center text-[13px] tabular-nums text-muted-foreground">
              {page} / {totalPages}
            </span>
            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl" onClick={() => onPage(Math.min(totalPages, page + 1))} disabled={page >= totalPages}>
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
      <Skeleton className="h-8 w-48 rounded-lg" />
      <Skeleton className="mt-3 h-4 w-64 rounded-lg" />
      <div className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
        {[1, 2, 3, 4, 5, 6].map((item) => (
          <Skeleton key={item} className="h-[68px] rounded-xl" />
        ))}
      </div>
      <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {[1, 2, 3, 4].map((item) => (
          <Skeleton key={item} className="h-32 rounded-2xl" />
        ))}
      </div>
    </div>
  )
}
