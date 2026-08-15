import type { Theme } from '@mui/material/styles'
import { tokens } from './designTokens'

export function glassSx(theme: Theme) {
  const dark = theme.palette.mode === 'dark'
  return {
    background: dark ? 'rgba(15, 23, 42, 0.78)' : 'rgba(255, 255, 255, 0.72)',
    backdropFilter: 'blur(24px) saturate(180%)',
    WebkitBackdropFilter: 'blur(24px) saturate(180%)',
    border: dark ? '1px solid rgba(255,255,255,0.12)' : '1px solid rgba(255,255,255,0.65)',
    boxShadow: dark
      ? '0 8px 32px rgba(0,0,0,0.35)'
      : '0 8px 32px rgba(15, 23, 42, 0.06)',
    backgroundImage: dark
      ? 'linear-gradient(180deg, rgba(255,255,255,0.06) 0%, transparent 42%)'
      : 'linear-gradient(180deg, rgba(255,255,255,0.4) 0%, transparent 42%)',
    transition: `transform 400ms ${tokens.ease}, box-shadow 400ms ${tokens.ease}`,
  }
}

export function solidRowSx(theme: Theme) {
  const dark = theme.palette.mode === 'dark'
  return {
    backgroundColor: dark ? tokens.navy : '#FFFFFF',
    borderColor: theme.palette.divider,
  }
}
