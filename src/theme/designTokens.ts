export const tokens = {
  primary: '#2563EB',
  primaryDark: '#1D4ED8',
  primaryLight: '#60A5FA',
  background: '#F3F6FB',
  surface: '#FFFFFF',
  surfaceMuted: '#EEF3FA',
  navy: '#0F172A',
  navyDark: '#020617',
  text: '#0F172A',
  textSecondary: '#475467',
  textMuted: '#667085',
  border: '#D7E2F0',
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#2563EB',
  ease: 'cubic-bezier(0.22, 1, 0.36, 1)',
  sidebarWidth: 276,
} as const

export type ThemeMode = 'light' | 'dark'

/**
 * Equivalentes de `tokens` para modo oscuro. Mismos roles semánticos,
 * de modo que un componente pueda elegir la variante sin inventar colores.
 */
export const darkTokens = {
  primary: '#60A5FA',
  primaryDark: '#2563EB',
  primaryLight: '#93C5FD',
  background: '#020617',
  surface: '#0F172A',
  surfaceMuted: '#151F35',
  text: '#F8FAFC',
  textSecondary: '#CBD5E1',
  textMuted: '#94A3B8',
  border: 'rgba(255, 255, 255, 0.12)',
  success: '#34D399',
  warning: '#FBBF24',
  error: '#F87171',
  info: '#60A5FA',
} as const

/**
 * Espejo en TypeScript de las variables `--glass-*` de
 * src/styles/design-system.css. El CSS es la fuente de verdad para todo lo que
 * se pinta con estilos; esto existe solo para los casos que necesitan un color
 * concreto en JS y no aceptan `var()`, como los tooltips SVG de recharts.
 *
 * Antes cada componente definía su propio rgba y el modo oscuro mezclaba dos
 * familias: slate (15, 23, 42) en las cards y gris Apple (44, 44, 46) en el
 * header y los charts. Aquí todo es slate, igual que `--background` y `--card`.
 */
export const glassTokens = {
  light: {
    /** Superficie por defecto: cards, header, popovers. */
    surface: 'rgba(255, 255, 255, 0.72)',
    /** Paneles anidados sobre otra superficie glass. */
    surfaceSoft: 'rgba(255, 255, 255, 0.58)',
    /** Tooltips y overlays que necesitan más opacidad para legibilidad. */
    surfaceStrong: 'rgba(255, 255, 255, 0.88)',
    border: 'rgba(255, 255, 255, 0.68)',
    /** Brillo superior que simula el canto del cristal. */
    highlight: 'linear-gradient(180deg, rgba(255, 255, 255, 0.4) 0%, transparent 42%)',
    highlightSoft: 'linear-gradient(180deg, rgba(255, 255, 255, 0.55) 0%, transparent 36%)',
    innerTop: 'inset 0 1px 0 rgba(255, 255, 255, 0.7)',
    shadow: '0 8px 28px rgba(15, 23, 42, 0.06)',
    shadowSoft: '0 8px 32px rgba(15, 23, 42, 0.06), 0 1px 2px rgba(15, 23, 42, 0.04)',
    shadowLift: '0 18px 40px rgba(15, 23, 42, 0.1)',
    /** Campos de formulario dentro de una superficie glass. */
    fieldBg: 'rgba(255, 255, 255, 0.7)',
    tableRowBg: '#FFFFFF',
    tableRowHover: '#F8FBFF',
    tableHeadBg: 'rgba(238, 243, 250, 0.8)',
    text: tokens.text,
  },
  dark: {
    surface: 'rgba(15, 23, 42, 0.72)',
    surfaceSoft: 'rgba(15, 23, 42, 0.55)',
    surfaceStrong: 'rgba(15, 23, 42, 0.9)',
    border: 'rgba(255, 255, 255, 0.12)',
    highlight: 'linear-gradient(180deg, rgba(255, 255, 255, 0.06) 0%, transparent 42%)',
    highlightSoft: 'linear-gradient(180deg, rgba(255, 255, 255, 0.07) 0%, transparent 36%)',
    innerTop: 'inset 0 1px 0 rgba(255, 255, 255, 0.08)',
    shadow: '0 8px 28px rgba(0, 0, 0, 0.45)',
    shadowSoft: '0 8px 32px rgba(0, 0, 0, 0.4), 0 1px 2px rgba(0, 0, 0, 0.24)',
    shadowLift: '0 18px 40px rgba(0, 0, 0, 0.55)',
    fieldBg: 'rgba(255, 255, 255, 0.04)',
    tableRowBg: 'rgba(15, 23, 42, 0.6)',
    tableRowHover: 'rgba(255, 255, 255, 0.04)',
    tableHeadBg: 'rgba(255, 255, 255, 0.03)',
    text: darkTokens.text,
  },
} as const

export const tokensFor = (mode: ThemeMode) => (mode === 'dark' ? darkTokens : tokens)
