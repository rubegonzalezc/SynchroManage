import type { CSSProperties } from 'react'
import { darkTokens, glassTokens, tokens } from './designTokens'

export const appleChart = {
  blue: '#0A84FF',
  green: '#30D158',
  orange: '#FF9F0A',
  purple: '#BF5AF2',
  red: '#FF453A',
  gray: '#8E8E93',
  teal: '#64D2FF',
}

export function getChartTooltipStyle(isDark: boolean): CSSProperties {
  const g = glassTokens[isDark ? 'dark' : 'light']
  return {
    backgroundColor: g.surfaceStrong,
    backdropFilter: 'blur(24px) saturate(180%)',
    WebkitBackdropFilter: 'blur(24px) saturate(180%)',
    border: `1px solid ${g.border}`,
    borderRadius: 14,
    color: g.text,
    fontSize: 12,
    fontWeight: 500,
    fontFamily: 'var(--font-plus-jakarta), "Plus Jakarta Sans", system-ui, sans-serif',
    boxShadow: g.shadowSoft,
    padding: '8px 12px',
  }
}

const tickBase = {
  fontSize: 11,
  fontFamily: 'var(--font-plus-jakarta), "Plus Jakarta Sans", system-ui, sans-serif',
}

/**
 * Ticks de eje. El gris fijo anterior quedaba con muy poco contraste sobre
 * el fondo oscuro, así que se alinea con `text.secondary` de cada modo.
 */
export function getChartTick(isDark: boolean) {
  return {
    ...tickBase,
    fill: isDark ? darkTokens.textMuted : tokens.textMuted,
  }
}

/** @deprecated Usar `getChartTick(isDark)` para que respete el tema. */
export const chartTick = {
  ...tickBase,
  fill: appleChart.gray,
}

/** Color de las series dentro del tooltip, alineado al texto del modo activo. */
export function getChartItemStyle(isDark: boolean): CSSProperties {
  return { color: glassTokens[isDark ? 'dark' : 'light'].text }
}

/** Resaltado de la barra/sector bajo el cursor. */
export function getChartCursorFill(isDark: boolean) {
  return { fill: isDark ? 'rgba(96,165,250,0.12)' : 'rgba(10,132,255,0.06)' }
}
