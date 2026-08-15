import { tokens } from './designTokens'
import type { PaletteOptions } from '@mui/material/styles'

export function getPalette(mode: 'light' | 'dark'): PaletteOptions {
  if (mode === 'dark') {
    return {
      mode: 'dark',
      primary: {
        main: tokens.primaryLight,
        dark: tokens.primary,
        light: '#93C5FD',
        contrastText: tokens.navyDark,
      },
      background: {
        default: tokens.navyDark,
        paper: tokens.navy,
      },
      text: {
        primary: '#F8FAFC',
        secondary: '#94A3B8',
      },
      divider: 'rgba(255,255,255,0.12)',
      success: { main: '#34D399' },
      warning: { main: '#FBBF24' },
      error: { main: '#F87171' },
      info: { main: tokens.primaryLight },
    }
  }

  return {
    mode: 'light',
    primary: {
      main: tokens.primary,
      dark: tokens.primaryDark,
      light: tokens.primaryLight,
      contrastText: '#FFFFFF',
    },
    background: {
      default: tokens.background,
      paper: tokens.surface,
    },
    text: {
      primary: tokens.text,
      secondary: tokens.textMuted,
    },
    divider: tokens.border,
    success: { main: tokens.success },
    warning: { main: tokens.warning },
    error: { main: tokens.error },
    info: { main: tokens.info },
  }
}
