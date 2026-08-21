import type { DashboardSearchResponse } from '@/lib/types/search'
import { EMPTY_DASHBOARD_SEARCH_RESPONSE } from '@/lib/types/search'

export const DEFAULT_SEARCH_LIMIT = 5
export const MAX_SEARCH_LIMIT = 20
export const MIN_SEARCH_QUERY_LENGTH = 1

/** Escapa comodines de PostgreSQL ILIKE. */
export function escapeIlikePattern(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/%/g, '\\%').replace(/_/g, '\\_')
}

export function buildIlikePattern(query: string): string {
  return `%${escapeIlikePattern(query.trim())}%`
}

/** Si la consulta es `#56` o `56`, devuelve el número para búsqueda exacta por task_number. */
export function parseExactTaskNumber(query: string): number | null {
  const trimmed = query.trim()
  const match = trimmed.match(/^#?(\d+)$/)
  if (!match) return null

  const value = Number.parseInt(match[1], 10)
  return Number.isFinite(value) && value > 0 ? value : null
}

export function parseSearchLimit(raw: string | null): number {
  const parsed = Number.parseInt(raw ?? '', 10)
  if (!Number.isFinite(parsed)) return DEFAULT_SEARCH_LIMIT
  return Math.min(Math.max(parsed, 1), MAX_SEARCH_LIMIT)
}

export function normalizeSearchQuery(raw: string | null): string {
  return raw?.trim() ?? ''
}

export function isSearchQueryValid(query: string): boolean {
  return query.length >= MIN_SEARCH_QUERY_LENGTH
}

export function emptySearchResponse(): DashboardSearchResponse {
  return { ...EMPTY_DASHBOARD_SEARCH_RESPONSE }
}

export function mergeSearchResultsById<T extends { id: string }>(
  primary: T[],
  secondary: T[],
  limit: number
): T[] {
  const merged = new Map<string, T>()
  for (const item of [...primary, ...secondary]) {
    merged.set(item.id, item)
    if (merged.size >= limit) break
  }
  return [...merged.values()].slice(0, limit)
}
