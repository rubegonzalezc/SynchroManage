# SynchroManage — Guía de diseño (MUI Liquid Glass)

El producto usa **MUI** como sistema de UI, con estética Apple Liquid Glass. Los datos siguen siendo reales (Supabase).

## Tema

- `src/theme/designTokens.ts` — paleta
- `src/theme/theme.ts` — `createTheme` light / dark
- `src/theme/ThemeRegistry.tsx` — Emotion + App Router
- `src/theme/glass.ts` — superficies translúcidas

### Modo claro / oscuro

Las superficies (fondos, bordes, sombras, cristal) se definen como variables CSS
en `src/styles/design-system.css`, con un bloque `:root` y su equivalente en
`.dark`. **Esa es la fuente de verdad**: los componentes usan `var(--glass-bg)` y
compañía en lugar de leer el tema desde JavaScript, para que el modo oscuro esté
aplicado en el primer pintado.

`glassTokens` en `designTokens.ts` es el espejo en TS de esas variables y solo se
usa donde hace falta un color concreto que no acepta `var()`, como los tooltips
SVG de recharts. Si cambias un valor en un lado, cámbialo en el otro.

La clase `dark` en `<html>` la aplica un script inline en `src/app/layout.tsx`
antes del primer pintado; `theme-provider.tsx` la lee con `useSyncExternalStore`.

## Primitivos

`src/components/ui/*` son adaptadores MUI con la API que ya usaba la app (Button, Card, Dialog, Select, etc.).

## Componentes

- `AppCard` / `StatCard` / `EmptyState` — `src/components/ui/app-card.tsx`
- `PageHeader` — `src/components/layout/PageHeader.tsx`
- Sidebar / Header — `src/components/layout/Sidebar.tsx`, `Header.tsx`

## Motion

Curva `cubic-bezier(0.22, 1, 0.36, 1)` en el tema. Hover lift y press en botones.
