import { describe, expect, it } from 'vitest'
import { BUG_TRIAGE_FILTER_DEFAULTS } from '@/hooks/useBugTriageFilters'

describe('BUG_TRIAGE_FILTER_DEFAULTS', () => {
  it('usa all para filtros de lista', () => {
    expect(BUG_TRIAGE_FILTER_DEFAULTS.severity).toBe('all')
    expect(BUG_TRIAGE_FILTER_DEFAULTS.status).toBe('all')
    expect(BUG_TRIAGE_FILTER_DEFAULTS.project).toBe('all')
    expect(BUG_TRIAGE_FILTER_DEFAULTS.assignee).toBe('all')
  })
})
