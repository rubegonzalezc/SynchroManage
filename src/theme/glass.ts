import type { Theme } from '@mui/material/styles'
import { darkTokens, tokens } from './designTokens'

/**
 * Superficie de cristal. Se apoya en las variables CSS de
 * src/styles/design-system.css en lugar de en `theme.palette.mode`, así que el
 * modo oscuro queda aplicado en el primer pintado y no depende de que React
 * haya hidratado. Por eso ya no necesita leer el modo del tema.
 */
export const glassSurfaceSx = {
  background: 'var(--glass-bg)',
  backdropFilter: 'blur(24px) saturate(180%)',
  WebkitBackdropFilter: 'blur(24px) saturate(180%)',
  border: '1px solid var(--glass-border)',
  boxShadow: 'var(--shadow-soft)',
  backgroundImage: 'linear-gradient(180deg, var(--glass-highlight) 0%, transparent 42%)',
  transition: `transform 400ms ${tokens.ease}, box-shadow 400ms ${tokens.ease}`,
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
