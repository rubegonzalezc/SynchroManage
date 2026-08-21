import useSWR from 'swr'
import type { DashboardSearchResponse } from '@/lib/types/search'
import { EMPTY_DASHBOARD_SEARCH_RESPONSE } from '@/lib/types/search'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'

export const COMMAND_PALETTE_MIN_QUERY_LENGTH = 2
export const COMMAND_PALETTE_DEBOUNCE_MS = 300

const searchFetcher = (url: string) =>
  fetch(url, { cache: 'no-store' }).then((res) => {
    if (!res.ok) throw new Error('Error al buscar')
    return res.json() as Promise<DashboardSearchResponse>
  })

export function useDashboardSearch(query: string, enabled: boolean) {
  const debouncedQuery = useDebouncedValue(query.trim(), COMMAND_PALETTE_DEBOUNCE_MS)
  const shouldFetch = enabled && debouncedQuery.length >= COMMAND_PALETTE_MIN_QUERY_LENGTH

  const { data, error, isLoading, isValidating } = useSWR<DashboardSearchResponse>(
    shouldFetch
      ? `/api/dashboard/search?q=${encodeURIComponent(debouncedQuery)}&limit=5`
      : null,
    searchFetcher,
    { revalidateOnFocus: false, dedupingInterval: 0 }
  )

  return {
    results: data ?? EMPTY_DASHBOARD_SEARCH_RESPONSE,
    isLoading: shouldFetch && (isLoading || isValidating),
    error,
    debouncedQuery,
    shouldFetch,
  }
}
