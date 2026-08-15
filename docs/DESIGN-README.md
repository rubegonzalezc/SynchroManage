# SynchroManage — Guía de diseño (MUI Liquid Glass)

El producto usa **MUI** como sistema de UI, con estética Apple Liquid Glass. Los datos siguen siendo reales (Supabase).

## Tema

- `src/theme/designTokens.ts` — paleta
- `src/theme/theme.ts` — `createTheme` light / dark
- `src/theme/ThemeRegistry.tsx` — Emotion + App Router
- `src/theme/glass.ts` — superficies translúcidas

## Primitivos

`src/components/ui/*` son adaptadores MUI con la API que ya usaba la app (Button, Card, Dialog, Select, etc.).

## Componentes

- `AppCard` / `StatCard` / `EmptyState` — `src/components/ui/app-card.tsx`
- `PageHeader` — `src/components/layout/PageHeader.tsx`
- Sidebar / Header — `src/components/layout/Sidebar.tsx`, `Header.tsx`

## Motion

Curva `cubic-bezier(0.22, 1, 0.36, 1)` en el tema. Hover lift y press en botones.
