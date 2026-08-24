'use client'

import { createContext, useCallback, useContext, useEffect, useSyncExternalStore } from 'react'

export type Theme = 'light' | 'dark' | 'system'
export type ResolvedTheme = 'light' | 'dark'

const STORAGE_KEY = 'theme'

interface ThemeContextType {
  theme: Theme
  setTheme: (theme: Theme) => void
  resolvedTheme: ResolvedTheme
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

function isTheme(value: string | null | undefined): value is Theme {
  return value === 'light' || value === 'dark' || value === 'system'
}

function storedPreference(): Theme {
  const stored = localStorage.getItem(STORAGE_KEY)
  return isTheme(stored) ? stored : 'system'
}

function systemPrefersDark() {
  return window.matchMedia('(prefers-color-scheme: dark)').matches
}

function applyToDocument(resolved: ResolvedTheme) {
  const root = document.documentElement
  root.classList.toggle('dark', resolved === 'dark')
  // Hace que scrollbars, inputs nativos y autofill sigan el tema.
  root.style.colorScheme = resolved
}

// ─── Store ────────────────────────────────────────────────────────────────────
// El tema aplicado vive en el DOM: la clase `dark` en <html>, puesta por el
// script de arranque del layout antes del primer pintado. Leerlo con
// useSyncExternalStore hace que la hidratación parta del valor del servidor y
// se corrija sola, sin errores de mismatch y sin sincronizar estado en efectos.

const listeners = new Set<() => void>()

function emit() {
  listeners.forEach((listener) => listener())
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  const observer = new MutationObserver(listener)
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
  return () => {
    listeners.delete(listener)
    observer.disconnect()
  }
}

function getResolvedSnapshot(): ResolvedTheme {
  return document.documentElement.classList.contains('dark') ? 'dark' : 'light'
}

// El servidor no puede conocer la preferencia del navegador, así que asume
// claro. El script de arranque ya corrigió el DOM cuando React hidrata.
const serverTheme = () => 'system' as Theme
const serverResolvedTheme = () => 'light' as const

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = useSyncExternalStore(subscribe, storedPreference, serverTheme)
  const resolvedTheme = useSyncExternalStore(subscribe, getResolvedSnapshot, serverResolvedTheme)

  // Sigue al sistema operativo mientras la preferencia sea 'system'.
  // Solo escribe en el DOM; el store se entera por el MutationObserver.
  useEffect(() => {
    if (theme !== 'system') {
      applyToDocument(theme)
      return
    }

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const sync = () => applyToDocument(mediaQuery.matches ? 'dark' : 'light')
    sync()
    mediaQuery.addEventListener('change', sync)
    return () => mediaQuery.removeEventListener('change', sync)
  }, [theme])

  const setTheme = useCallback((newTheme: Theme) => {
    localStorage.setItem(STORAGE_KEY, newTheme)
    applyToDocument(newTheme === 'system' ? (systemPrefersDark() ? 'dark' : 'light') : newTheme)
    emit()
  }, [])

  return (
    <ThemeContext.Provider value={{ theme, setTheme, resolvedTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) {
    // Retornar valores por defecto si no hay provider
    return {
      theme: 'system' as Theme,
      setTheme: () => {},
      resolvedTheme: 'light' as const,
    }
  }
  return context
}
