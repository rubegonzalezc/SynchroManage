import type { Theme } from '@mui/material/styles'
import { darkTokens, tokens } from './designTokens'

/**
 * Superficie de cristal. Se apoya en las variables CSS de
 * src/styles/design-system.css en lugar de en `theme.palette.mode`, así que el
 * modo oscuro queda aplicado en el primer pintado y no depende de que React
 * haya hidratado. Por eso ya no necesita leer el modo del tema.
 */
export const glassSurfaceSx = {
  background: 'var(--card)',
  backgroundImage: 'none',
  backdropFilter: 'none',
  WebkitBackdropFilter: 'none',
  border: '1px solid var(--border)',
  boxShadow: '0 1px 2px rgba(15, 23, 42, 0.04)',
} as const

export function glassSx() {
  return glassSurfaceSx
}

export function solidRowSx(theme: Theme) {
  const dark = theme.palette.mode === 'dark'
  return {
    backgroundColor: dark ? darkTokens.surface : tokens.surface,
    borderColor: theme.palette.divider,
  }
}
