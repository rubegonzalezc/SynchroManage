'use client'

import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { CommandPalette } from '@/components/dashboard/CommandPalette'

interface SearchCommandContextValue {
  open: boolean
  openPalette: () => void
  closePalette: () => void
}

const SearchCommandContext = createContext<SearchCommandContextValue | null>(null)

export function SearchCommandProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false)

  const openPalette = useCallback(() => setOpen(true), [])
  const closePalette = useCallback(() => setOpen(false), [])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setOpen(true)
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  return (
    <SearchCommandContext.Provider value={{ open, openPalette, closePalette }}>
      {children}
      <CommandPalette open={open} onOpenChange={setOpen} />
    </SearchCommandContext.Provider>
  )
}

export function useSearchCommand() {
  const context = useContext(SearchCommandContext)
  if (!context) {
    throw new Error('useSearchCommand debe usarse dentro de SearchCommandProvider')
  }
  return context
}
