import type { CSSProperties } from 'react'

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
  return {
    backgroundColor: isDark ? 'rgba(44, 44, 46, 0.88)' : 'rgba(255, 255, 255, 0.88)',
    backdropFilter: 'blur(24px) saturate(180%)',
    WebkitBackdropFilter: 'blur(24px) saturate(180%)',
    border: isDark ? '1px solid rgba(255,255,255,0.12)' : '1px solid rgba(255,255,255,0.7)',
    borderRadius: 14,
    color: isDark ? '#F5F5F7' : '#1C1C1E',
    fontSize: 12,
    fontWeight: 500,
    fontFamily: 'var(--font-plus-jakarta), "Plus Jakarta Sans", system-ui, sans-serif',
    boxShadow: '0 12px 40px rgba(0,0,0,0.18)',
    padding: '8px 12px',
  }
}

export const chartTick = {
  fontSize: 11,
  fill: '#8E8E93',
  fontFamily: 'var(--font-plus-jakarta), "Plus Jakarta Sans", system-ui, sans-serif',
}
