import { darkTokens, tokens, type ThemeMode } from './designTokens'
import type { PaletteOptions } from '@mui/material/styles'

export function getPalette(mode: ThemeMode): PaletteOptions {
  if (mode === 'dark') {
    return {
      mode: 'dark',
      primary: {
        main: darkTokens.primary,
        dark: darkTokens.primaryDark,
        light: darkTokens.primaryLight,
        contrastText: darkTokens.background,
      },
      background: {
        default: darkTokens.background,
        paper: darkTokens.surface,
      },
      text: {
        primary: darkTokens.text,
        secondary: darkTokens.textMuted,
      },
      divider: darkTokens.border,
      success: { main: darkTokens.success },
      warning: { main: darkTokens.warning },
      error: { main: darkTokens.error },
      info: { main: darkTokens.info },
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
