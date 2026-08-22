'use client'

import { useCallback, useMemo } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'

export interface BugTriageFilters {
  search: string
  severity: string
  status: string
  project: string
  assignee: string
}

export const BUG_TRIAGE_FILTER_DEFAULTS: BugTriageFilters = {
  search: '',
  severity: 'all',
  status: 'all',
  project: 'all',
  assignee: 'all',
}

function readFilters(searchParams: URLSearchParams): BugTriageFilters {
  return {
    search: searchParams.get('q') ?? BUG_TRIAGE_FILTER_DEFAULTS.search,
    severity: searchParams.get('severity') ?? BUG_TRIAGE_FILTER_DEFAULTS.severity,
    status: searchParams.get('status') ?? BUG_TRIAGE_FILTER_DEFAULTS.status,
    project: searchParams.get('project') ?? BUG_TRIAGE_FILTER_DEFAULTS.project,
    assignee: searchParams.get('assignee') ?? BUG_TRIAGE_FILTER_DEFAULTS.assignee,
  }
}

function writeFilters(
  searchParams: URLSearchParams,
  filters: BugTriageFilters
): URLSearchParams {
  const params = new URLSearchParams(searchParams.toString())

  const entries: Array<[keyof BugTriageFilters, string, string]> = [
    ['search', 'q', BUG_TRIAGE_FILTER_DEFAULTS.search],
    ['severity', 'severity', BUG_TRIAGE_FILTER_DEFAULTS.severity],
    ['status', 'status', BUG_TRIAGE_FILTER_DEFAULTS.status],
    ['project', 'project', BUG_TRIAGE_FILTER_DEFAULTS.project],
    ['assignee', 'assignee', BUG_TRIAGE_FILTER_DEFAULTS.assignee],
  ]

  for (const [filterKey, paramKey, defaultValue] of entries) {
    const value = filters[filterKey]
    if (value && value !== defaultValue) {
      params.set(paramKey, value)
    } else {
      params.delete(paramKey)
    }
  }

  return params
}

export function useBugTriageFilters() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  const filters = useMemo(() => readFilters(searchParams), [searchParams])

  const setFilters = useCallback((updates: Partial<BugTriageFilters>) => {
    const next = { ...filters, ...updates }
    const params = writeFilters(searchParams, next)
    const query = params.toString()
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false })
  }, [filters, pathname, router, searchParams])

  const clearFilters = useCallback(() => {
    router.replace(pathname, { scroll: false })
  }, [pathname, router])

  const hasActiveFilters = useMemo(
    () => Object.entries(BUG_TRIAGE_FILTER_DEFAULTS).some(
      ([key, defaultValue]) => filters[key as keyof BugTriageFilters] !== defaultValue
    ),
    [filters]
  )

  return { filters, setFilters, clearFilters, hasActiveFilters }
}
