'use client'

import { useEffect, useState } from 'react'

export type LayoutMode = 'unknown' | 'phone' | 'desktop'

/** El primer render coincide con el servidor. Después elige teléfono o escritorio. */
export function useLayoutMode(): LayoutMode {
  const [mode, setMode] = useState<LayoutMode>('unknown')

  useEffect(() => {
    const query = window.matchMedia('(max-width: 767px)')
    const sync = () => setMode(query.matches ? 'phone' : 'desktop')
    sync()
    query.addEventListener('change', sync)
    return () => query.removeEventListener('change', sync)
  }, [])

  return mode
}
