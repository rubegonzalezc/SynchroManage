# Nueva paleta de colores (reemplazar completamente la de SynchroSign)

## Brand

PRIMARY: #2563EB
PRIMARY_DARK: #1D4ED8
PRIMARY_LIGHT: #60A5FA

## Surfaces

BACKGROUND: #F3F6FB
SURFACE: #FFFFFF
SURFACE_MUTED: #EEF3FA
NAVY: #0F172A
NAVY_DARK: #020617

## Text

TEXT: #0F172A
TEXT_SECONDARY: #475467
TEXT_MUTED: #667085

## Borders

BORDER: #D7E2F0

## Semantic

SUCCESS: #10B981
WARNING: #F59E0B
ERROR: #EF4444
INFO: #2563EB

---

# Estilo visual

Mantener:

- Soft glassmorphism
- Sombras difusas
- Bordes redondeados
- Motion líquido
- Navegación tipo pill
- Paneles navy
- Tarjetas elevadas

Eliminar:

- Estética fintech
- Tinte lila
- Violeta eléctrico
- Lenguaje de firma electrónica

El fondo principal debe sentirse más tecnológico y corporativo.

---

# Estructura del producto

Módulos:

- Dashboard
- Tickets
- Usuarios
- Roles y permisos
- Equipos
- Activos TI
- Base de conocimiento
- Configuración

---

# Dashboard

Diseñar un dashboard de soporte técnico con:

- Tickets abiertos
- Tickets pendientes
- Tickets resueltos hoy
- SLA en riesgo
- Técnicos conectados
- Tiempo promedio de respuesta

Agregar:

- Gráfico de tickets por día (Recharts, client component)
- Lista de tickets recientes
- Lista de técnicos más activos

Todo solo visual. Datos desde `src/shared/mock/dashboard.ts`.

---

# Tickets

Crear vistas para:

- Lista de tickets → `/tickets`
- Detalle del ticket → `/tickets/[id]`
- Crear ticket → `/tickets/nuevo`
- Estados
- Prioridades
- Asignación de técnico
- Comentarios
- Evidencias

Estados:

- Nuevo
- En progreso
- Pendiente
- Resuelto
- Cerrado

Prioridades:

- Baja
- Media
- Alta
- Crítica

---

# Roles y permisos (solo vistas)

Implementar un sistema visual de permisos basado en módulos.

Debe existir:

- Tabla de roles → `/roles`
- Crear rol → `/roles/nuevo`
- Editar rol → `/roles/[id]`
- Asignar permisos por módulo y acción

Acciones:

- Ver
- Crear
- Editar
- Eliminar
- Exportar
- Aprobar

Usar una matriz de permisos moderna estilo enterprise.

---

# Usuarios

Vista de usuarios con:

- Avatar
- Nombre
- Correo
- Rol
- Estado
- Último acceso

---

# Equipos

Vista para agrupar técnicos en:

- Mesa de ayuda
- Soporte terreno
- Infraestructura
- Redes
- Desarrollo

---

# Activos TI

Vista visual de inventario:

- Equipos
- Impresoras
- Routers
- Switches
- Licencias

---

# Navegación principal

Sidebar oscuro con iconos. Componente client con `usePathname()` para resaltar ruta activa.

Orden:

1. Dashboard
2. Tickets
3. Usuarios
4. Roles y permisos
5. Equipos
6. Activos TI
7. Base de conocimiento
8. Configuración

Header superior con:

- Búsqueda global (decorativa)
- Notificaciones (decorativa)
- Cambio de tema
- Perfil de usuario

Implementado en `src/app/(dashboard)/layout.tsx` envolviendo todas las rutas del producto.

---

# Componentes reutilizables

Ubicación: `src/components/ui/`

- AppCard
- StatCard
- TicketRow
- StatusBadge
- PriorityBadge
- PageHeader
- EmptyState
- PermissionMatrix
- UserAvatar
- AppTable

---

# Integración MUI + Next.js App Router

## ThemeRegistry (obligatorio)

MUI con App Router requiere un registry client que gestione el cache de Emotion y evite hydration mismatch:

```tsx
// src/theme/ThemeRegistry.tsx
'use client'
import { CacheProvider } from '@emotion/react'
import createCache from '@emotion/cache'
import { useServerInsertedHTML } from 'next/navigation'
// ... crear cache, insertar estilos en SSR, envolver con ThemeProvider
```

## Fuentes

```tsx
// src/app/layout.tsx
import { Plus_Jakarta_Sans } from 'next/font/google'

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
})
```

## Metadatos

```tsx
export const metadata = {
  title: 'SynchroDesk — Mesa de ayuda IT',
  description: 'Plataforma de gestión de tickets y soporte técnico',
}
```

---

# Motion system

Mantener exactamente el sistema de animaciones:

- hover lift
- fade-up
- stagger
- liquid ease
- press feedback

Curva principal:

```css
transition-timing-function: cubic-bezier(0.22, 1, 0.36, 1);
```

No usar transiciones bruscas. Definir en `src/styles/design-system.css`.

---

# Modo oscuro

Soporte completo de dark mode visual mediante `ThemeModeProvider` (React state, sin localStorage ni cookies).

En dark mode:

- Fondo: NAVY_DARK
- Superficie: NAVY
- Texto: blanco
- Bordes: alpha 12%

Toggle en Header. El tema MUI se regenera con `createTheme({ palette: { mode } })`.

---

# Responsividad

Diseño mobile-first.

- Sidebar colapsable (drawer en móvil con MUI `Drawer`)
- Tablas adaptables (`AppTable` con scroll horizontal)
- Cards apiladas en móvil (`Grid` MUI responsive)
- Header compacto

---

# Entregables

Generar directamente el código y la estructura visual completa:

1. `docs/system-design.md` — copia de este documento adaptado
2. `src/styles/design-system.css`
3. `src/theme/designTokens.ts`
4. `src/theme/palette.ts`
5. `src/theme/theme.ts` — MUI theme completo (light + dark)
6. `src/theme/ThemeRegistry.tsx`
7. `src/theme/ThemeModeProvider.tsx`
8. `src/app/layout.tsx` — root layout
9. `src/app/(dashboard)/layout.tsx` — layout principal
10. `src/components/layout/Sidebar.tsx`
11. `src/components/layout/Header.tsx`
12. `src/app/(dashboard)/dashboard/page.tsx`
13. `src/app/(dashboard)/tickets/` — lista, detalle, nuevo
14. `src/app/(dashboard)/roles/` — lista, crear, editar
15. `src/app/(dashboard)/usuarios/page.tsx`
16. `src/app/(dashboard)/equipos/page.tsx`
17. `src/app/(dashboard)/activos/page.tsx`
18. `src/app/(dashboard)/conocimiento/page.tsx`
19. `src/app/(dashboard)/configuracion/page.tsx`
20. `src/components/ui/` — componentes reutilizables
21. `src/shared/mock/` — datos estáticos tipados
22. `docs/DESIGN-README.md` — guía de diseño
23. `next.config.ts`
24. `package.json` con Next.js 16.3

No expliques la teoría. Genera directamente el código, preparado para **Next.js 16 + TypeScript + MUI enterprise**.

---

## Nueva dirección visual obligatoria: Apple Liquid Enterprise

El diseño NO debe verse como un dashboard fintech ni como un glassmorphism genérico.

Debe inspirarse en:

- iOS 26 Liquid Glass
- visionOS
- Apple Human Interface
- Linear
- Notion (espaciado)
- Raycast (contraste)

### Reglas visuales

- Fondo claro con gradientes muy sutiles azul hielo.
- Sidebar oscuro sólido.
- Tarjetas translúcidas con blur suave (20-28px).
- Bordes blancos semitransparentes.
- Reflejo interno superior.
- Sombras muy difusas y ligeras.
- Mucho espacio en blanco.
- Nada de neón.
- Nada de gradientes agresivos.
- Nada de lila fintech.

### Componente base

Todas las tarjetas principales deben usar un estilo liquid glass:

- background rgba(255,255,255,0.72)
- backdrop-filter blur(24px) saturate(180%)
- border rgba(255,255,255,0.65)
- shadow suave
- radius 24px

### Motion

Usar curvas tipo Apple:

`cubic-bezier(0.22, 1, 0.36, 1)`

Hover:

- translateY(-4px)
- scale(1.005)

Press:

- scale(0.992)

### Tipografía

- SF Pro Display si está disponible (sistema)
- Plus Jakarta Sans via `next/font/google` como fuente principal

### Dashboard

El dashboard debe sentirse como una app nativa de iPad Pro:

- KPI cards flotantes
- Header flotante
- Sidebar premium
- Gráficos suaves
- Separación amplia entre secciones

### Tickets

La tabla de tickets NO debe ser totalmente translúcida.

Usar:

- toolbar glass
- filas sólidas blancas
- hover muy sutil

### Roles y permisos

Usar paneles glass con contenido sólido para mantener legibilidad.

### Resultado esperado

El usuario debe sentir que SynchroDesk es una mezcla entre:

- Apple
- Linear
- Jira Service Management
- Freshservice
- Raycast

con identidad propia de SynchroDev.

---

## Alcance de esta fase (OBLIGATORIO)

Esta primera etapa es únicamente una **maqueta funcional de interfaz (UI Prototype)**.

NO implementar lógica de negocio real.

### Todos los datos deben ser estáticos

- Tickets
- Usuarios
- Roles
- Permisos
- Equipos
- Activos TI
- Notificaciones
- Métricas
- Gráficos
- Comentarios
- Evidencias

Todo debe provenir de archivos locales en `src/shared/mock/`, importados directamente en Server Components o pasados como props.

### No implementar

- Backend / API Routes
- Server Actions con persistencia
- API calls (fetch, axios)
- React Query / SWR
- Zustand / Redux
- Context de datos de negocio
- Autenticación real (middleware, NextAuth, etc.)
- Persistencia (localStorage, cookies, IndexedDB)
- Formularios funcionales con submit real
- Validaciones reales
- CRUD
- WebSockets
- Notificaciones push
- Base de datos

### Sí implementar

- App Router con layouts anidados
- Navegación entre pantallas (`next/link`)
- Sidebar con ruta activa
- Header
- Dark mode visual (state en memoria)
- Estados hover
- Animaciones suaves
- Componentes reutilizables
- Datos mock tipados con TypeScript
- `next/font` para tipografía optimizada
- Metadatos por página

### Estructura mock

```
src/shared/mock/
  tickets.ts
  users.ts
  roles.ts
  teams.ts
  assets.ts
  dashboard.ts
  notifications.ts
```

### Ejemplo

`src/shared/mock/tickets.ts`

```ts
import type { Ticket } from '@/shared/types/ticket'

export const tickets: Ticket[] = [
  {
    id: 'TCK-1001',
    title: 'No hay acceso a internet',
    status: 'En progreso',
    priority: 'Alta',
    technician: 'Carlos Soto',
    requester: 'María Pérez',
    createdAt: '2026-08-14 09:30',
  },
]
```

### Objetivo de esta fase

El resultado debe verse como un producto SaaS real y premium, pero ser técnicamente una **demo estática navegable**.

Debe permitir:

- Mostrar el diseño a clientes
- Validar UX
- Definir arquitectura visual
- Tomar capturas
- Grabar demos
- Presentar el proyecto a inversionistas o empresas

No optimizar para funcionalidad; optimizar para **calidad visual, consistencia y experiencia de usuario**.

### Indicador visual

Agregar en el footer o configuración una pequeña etiqueta:

**"SynchroDesk UI Prototype · Static demo data"**

para dejar claro que es una versión de demostración.

Componente: `src/components/layout/PrototypeBadge.tsx`

---

## Configuración Next.js recomendada

`next.config.ts`:

```ts
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Prototipo UI: sin optimizaciones de producción agresivas
  reactStrictMode: true,
}

export default nextConfig
```

`tsconfig.json` — alias:

```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```
