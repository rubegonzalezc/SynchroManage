import { describe, expect, it } from 'vitest'
import {
  buildIlikePattern,
  escapeIlikePattern,
  mergeSearchResultsById,
  parseExactTaskNumber,
  parseSearchLimit,
} from '@/lib/utils/dashboard-search'

describe('escapeIlikePattern', () => {
  it('escapa % y _', () => {
    expect(escapeIlikePattern('100%_test')).toBe('100\\%\\_test')
  })
})

describe('buildIlikePattern', () => {
  it('envuelve la consulta con comodines', () => {
    expect(buildIlikePattern('login')).toBe('%login%')
  })
})

describe('parseExactTaskNumber', () => {
  it('parsea #56 y 56', () => {
    expect(parseExactTaskNumber('#56')).toBe(56)
    expect(parseExactTaskNumber('56')).toBe(56)
  })

  it('no parsea búsquedas parciales', () => {
    expect(parseExactTaskNumber('login 56')).toBeNull()
    expect(parseExactTaskNumber('HU-3')).toBeNull()
  })
})

describe('parseSearchLimit', () => {
  it('usa 5 por defecto y acota el máximo', () => {
    expect(parseSearchLimit(null)).toBe(5)
    expect(parseSearchLimit('99')).toBe(20)
    expect(parseSearchLimit('0')).toBe(1)
  })
})

describe('mergeSearchResultsById', () => {
  it('deduplica y respeta el límite', () => {
    const merged = mergeSearchResultsById(
      [{ id: 'a' }, { id: 'b' }],
      [{ id: 'b' }, { id: 'c' }],
      3
    )
    expect(merged.map((item) => item.id)).toEqual(['a', 'b', 'c'])
  })
})
