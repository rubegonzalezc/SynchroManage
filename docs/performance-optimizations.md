# Optimizaciones de Rendimiento — SynchroManage

Este documento describe todas las optimizaciones de rendimiento aplicadas al sistema, por qué se hicieron y cómo funcionan. Está pensado para que cualquier miembro del equipo entienda las decisiones técnicas.

---

## Resumen ejecutivo

El sistema tenía un problema de carga lenta principalmente por tres razones:
1. Demasiadas llamadas a la base de datos en cada request (incluyendo en el middleware)
2. Componentes client-side haciendo sus propios fetches al montar, en cascada
3. Componentes pesados (Kanban, charts) cargándose aunque no fueran visibles
4. Re-renders innecesarios de componentes que no habían cambiado

Las optimizaciones se dividieron en dos rondas y atacan cada uno de estos problemas.

---

## Ronda 1 — Reducción de llamadas a la API y caché del servidor

### 1. Caché de rol en el Middleware

**Archivo:** `src/lib/supabase/middleware.ts`

**Problema:** El middleware de Next.js se ejecuta en CADA request (navegación, prefetch, etc.). Antes hacía una query a Supabase para obtener el rol del usuario en cada request de rutas protegidas.

**Solución:** El rol se guarda en una cookie `httpOnly` con duración de 1 hora. En requests posteriores se lee la cookie en lugar de consultar la base de datos.

```
Primera visita:  Request → Supabase query → Cookie guardada → Respuesta
Visitas siguientes: Request → Lee cookie → Respuesta (sin query)
```

**Impacto:** Elimina 1 query a Supabase por cada navegación entre páginas.

---

### 2. Caché de lista de proyectos (`unstable_cache`)

**Archivo:** `src/app/api/dashboard/projects/route.ts`

**Problema:** La lista de proyectos se recalculaba en cada request, incluyendo joins con companies, profiles y project_members.

**Solución:** Se usa `unstable_cache` de Next.js con tag `projects` y revalidación de 60 segundos. La caché se invalida automáticamente cuando se crea, edita o elimina un proyecto.

```typescript
// La primera llamada ejecuta la query
// Las siguientes 60s devuelven el resultado cacheado
getCachedProjectsList(userId, roleName, typeFilter)
```

**Tags de invalidación:** `projects`, `projects-user-{userId}`

---

### 3. Caché de mis tareas (`unstable_cache`)

**Archivo:** `src/app/api/dashboard/my-tasks/route.ts`

**Problema:** Las tareas del usuario se recalculaban en cada visita a "Mis Tareas".

**Solución:** `unstable_cache` con tag `my-tasks-{userId}` y revalidación de 60 segundos. Se invalida cuando se crean o modifican tareas.

---

### 4. Notificaciones: eliminada query duplicada

**Archivo:** `src/app/api/dashboard/notifications/route.ts`

**Problema:** Se hacían 2 queries: una para traer las notificaciones y otra para contar las no leídas.

**Solución:** El conteo se calcula desde los datos ya obtenidos con `.filter(n => !n.read).length`.

```typescript
// Antes: 2 queries
const notifications = await supabase.from('notifications').select(...)
const { count } = await supabase.from('notifications').select('*', { count: 'exact', head: true })...

// Ahora: 1 query
const notifications = await supabase.from('notifications').select(...)
const unreadCount = notifications.filter(n => !n.read).length
```

---

### 5. Dashboard: eliminados 3 fetches client-side

**Archivos:** `src/app/dashboard/page.tsx`, `src/components/dashboard/UpcomingMeetings.tsx`, `src/components/dashboard/UnassignedTasks.tsx`, `src/components/dashboard/OpenBugsList.tsx`

**Problema:** Los componentes `UpcomingMeetings`, `UnassignedTasks` y `OpenBugsList` hacían sus propios fetches al montar en el cliente. Esto creaba un "waterfall": primero cargaba el HTML, luego el JS, luego los 3 fetches en paralelo, y finalmente se mostraban los datos.

**Solución:** Los datos se obtienen en el servidor (SSR) dentro del `Promise.all` del dashboard y se pasan como props a los componentes.

```
Antes:  SSR → HTML → JS → fetch meetings → fetch unassigned → fetch bugs → render
Ahora:  SSR (todo en paralelo) → HTML con datos → render inmediato
```

Los componentes siguen siendo `'use client'` para mantener interactividad, pero reciben `initialMeetings`, `tasks` y `bugs` como props del servidor.

---

### 6. Dashboard: 4 queries de bugs → 1 query

**Archivo:** `src/app/dashboard/page.tsx`

**Problema:** Se hacían 4 queries separadas para contar bugs por estado (`open`, `in_progress`, `resolved`, `closed`).

**Solución:** Una sola query trae todos los bugs con su estado, y los conteos se calculan en memoria con `.filter()`.

```typescript
// Antes: 4 queries
supabase.from('bugs').select('*', { count: 'exact', head: true }).eq('status', 'open')
supabase.from('bugs').select('*', { count: 'exact', head: true }).eq('status', 'in_progress')
// ...

// Ahora: 1 query
const { data: bugsForChart } = await supabase.from('bugs').select('status')
const bugsOpenCount = bugsForChart.filter(b => b.status === 'open').length
```

---

### 7. Corrección de `revalidateTag` con argumento incorrecto

**Archivos:** Todos los routes de tasks, sprints y projects.

**Problema:** `revalidateTag` se llamaba con 2 argumentos (`revalidateTag('tag', 'max')`). En esta versión de Next.js el segundo argumento es requerido por los tipos pero el primero es el que realmente invalida el caché. Los llamados sin el segundo argumento fallaban en TypeScript.

**Solución:** Todos los `revalidateTag` usan la firma correcta `revalidateTag('tag', 'max')`.

---

### 8. SWR: intervalo de deduplicación aumentado

**Archivo:** `src/components/dashboard/DashboardLayoutClient.tsx`

**Cambio:** `dedupingInterval` de 10s → 30s, y `revalidateOnReconnect: false`.

Esto significa que si el mismo endpoint se llama varias veces en 30 segundos, SWR devuelve el resultado cacheado en lugar de hacer un nuevo fetch. Reduce llamadas redundantes al navegar entre páginas.

---

### 9. Sprints en "Mis Tareas" sin fetch extra

**Archivo:** `src/components/my-tasks/MyTasksClient.tsx`

**Problema:** Al seleccionar un proyecto en "Mis Tareas", se hacía un fetch extra a `/api/dashboard/projects/{id}/sprints`.

**Solución:** La query de `/api/dashboard/my-tasks` ahora incluye los campos completos del sprint (`goal`, `start_date`, `end_date`, `order_index`). Los sprints se derivan de las tareas ya cargadas con un `useMemo`.

---

### 10. `optimizePackageImports` en Next.js config

**Archivo:** `next.config.ts`

```typescript
experimental: {
  optimizePackageImports: ['lucide-react', 'date-fns', 'recharts'],
}
```

Next.js hace tree-shaking más agresivo en estas librerías, reduciendo el bundle JS que se envía al cliente. `lucide-react` tiene cientos de iconos — sin esto se importan todos aunque solo uses 10.

---

## Ronda 2 — Rendimiento del cliente

### 11. `React.memo` en TaskCard

**Archivo:** `src/components/dashboard/projects/TaskCard.tsx`

**Problema:** Cada vez que cualquier tarea cambiaba (ej: drag & drop), React re-renderizaba TODAS las tarjetas del Kanban, aunque la mayoría no hubiera cambiado.

**Solución:** `React.memo` con comparador personalizado. Una tarjeta solo se re-renderiza si cambian sus props relevantes.

```typescript
export const TaskCard = memo(function TaskCard(...) {
  // ...
}, (prev, next) => {
  // Retorna true = NO re-renderizar (props iguales)
  return (
    prev.task.id === next.task.id &&
    prev.task.title === next.task.title &&
    prev.task.status === next.task.status &&
    // ... más comparaciones
  )
})
```

**Impacto:** En un proyecto con 50 tareas, un drag & drop antes re-renderizaba 50 tarjetas. Ahora re-renderiza solo la que se movió.

---

### 12. `React.memo` en KanbanColumn

**Archivo:** `src/components/dashboard/projects/KanbanColumn.tsx`

Mismo principio que TaskCard. Las columnas del Kanban solo se re-renderizan si cambia su contenido o si son el destino del drag.

---

### 13. Lazy loading del KanbanBoard y TaskListView

**Archivo:** `src/components/dashboard/projects/ProjectDetailClient.tsx`

**Problema:** El bundle de `KanbanBoard` incluye dnd-kit (drag & drop), que es una librería pesada. Se cargaba aunque el usuario no hubiera llegado aún a la vista del proyecto.

**Solución:** `React.lazy` + `Suspense`. El código del Kanban solo se descarga cuando el usuario abre un proyecto.

```typescript
const KanbanBoard = lazy(() => import('./KanbanBoard').then(m => ({ default: m.KanbanBoard })))
const TaskListView = lazy(() => import('./TaskListView').then(m => ({ default: m.TaskListView })))

// En el JSX:
<Suspense fallback={<KanbanSkeleton />}>
  <KanbanBoard ... />
</Suspense>
```

Mientras carga, se muestra un skeleton animado que replica la estructura del Kanban.

---

### 14. Prefetch de proyectos en hover

**Archivo:** `src/components/dashboard/projects/ProjectsTableClient.tsx`

**Problema:** Al hacer clic en un proyecto, Next.js empezaba a cargar la página en ese momento.

**Solución:** Al hacer hover sobre una fila, se llama a `router.prefetch()` para que Next.js empiece a precargar la página del proyecto en segundo plano. Cuando el usuario hace clic, la navegación es casi instantánea.

```typescript
const handleProjectHover = useCallback((projectId: string) => {
  router.prefetch(`/projects/${projectId}`)
}, [router])

// En la fila:
<TableRow onMouseEnter={() => handleProjectHover(project.id)}>
```

---

### 15. Optimistic updates en el Kanban (mejorado)

**Archivos:** `src/hooks/useProject.ts`, `src/components/dashboard/projects/KanbanBoard.tsx`

**Problema:** El drag & drop ya tenía optimistic update local (dentro del KanbanBoard), pero el estado del padre (SWR cache) no se actualizaba hasta que llegaba la respuesta del servidor. Esto causaba un "flash" al completar el drag.

**Solución:** Se agregó `optimisticMoveTask` al hook `useProject` que actualiza el caché de SWR inmediatamente sin esperar al servidor.

```typescript
// En useProject.ts
const optimisticMoveTask = (taskId, newStatus, newPosition) => {
  mutate(
    { project: { ...data.project, tasks: data.project.tasks.map(t =>
      t.id === taskId ? { ...t, status: newStatus, position: newPosition } : t
    )}},
    { revalidate: false } // No re-fetch, solo actualizar cache
  )
}
```

---

### 16. `loading.tsx` por ruta

**Archivos creados:**
- `src/app/dashboard/loading.tsx`
- `src/app/projects/loading.tsx`
- `src/app/my-tasks/loading.tsx`
- `src/app/change-controls/loading.tsx`
- `src/app/dashboard/users/loading.tsx`
- `src/app/dashboard/companies/loading.tsx`
- `src/app/dashboard/reports/loading.tsx`

**Qué hace:** Next.js muestra automáticamente estos skeletons mientras el servidor está generando la página (SSR). El usuario ve contenido inmediatamente en lugar de una pantalla en blanco.

```
Sin loading.tsx:  Clic → Pantalla en blanco → Página cargada
Con loading.tsx:  Clic → Skeleton animado → Página cargada
```

Los skeletons replican la estructura visual de cada página para que la transición sea suave.

---

## Tabla resumen

| # | Optimización | Tipo | Impacto |
|---|---|---|---|
| 1 | Caché de rol en middleware | Servidor | Alto — elimina query por navegación |
| 2 | Caché lista de proyectos | Servidor | Alto — 60s de caché con invalidación |
| 3 | Caché mis tareas | Servidor | Alto — 60s de caché con invalidación |
| 4 | Notificaciones: 2 queries → 1 | Servidor | Medio |
| 5 | Dashboard: 3 fetches client → SSR | Servidor/Cliente | Alto — elimina waterfall |
| 6 | Dashboard: 4 queries bugs → 1 | Servidor | Medio |
| 7 | `revalidateTag` corregido | Servidor | Medio — caché funcionaba mal |
| 8 | SWR dedupingInterval 10s → 30s | Cliente | Medio |
| 9 | Sprints sin fetch extra | Cliente | Medio |
| 10 | `optimizePackageImports` | Build | Medio — bundle más pequeño |
| 11 | `React.memo` TaskCard | Cliente | Alto — Kanban con muchas tareas |
| 12 | `React.memo` KanbanColumn | Cliente | Medio |
| 13 | Lazy loading KanbanBoard | Cliente | Alto — carga inicial más rápida |
| 14 | Prefetch en hover proyectos | Cliente | Alto — navegación instantánea |
| 15 | Optimistic updates Kanban | Cliente | Medio — drag & drop más fluido |
| 16 | `loading.tsx` por ruta | Cliente | Alto — UX percibida |

---

## Cómo funciona el caché en producción

```
Usuario A abre /projects
  → Cache miss → Query a Supabase → Resultado guardado en cache (tag: projects-user-A)
  → Respuesta en ~300ms

Usuario A abre /projects de nuevo (dentro de 60s)
  → Cache hit → Respuesta en ~5ms

Admin crea un proyecto nuevo
  → revalidateTag('projects', 'max') → Cache invalidado
  → Próxima visita hace query fresca
```

El caché vive en el servidor de Next.js (en memoria o filesystem según el deployment). En Vercel esto funciona automáticamente. En un servidor propio, el caché persiste mientras el proceso Node.js esté corriendo.

---

## Reglas para el equipo al agregar nuevas features

1. **Nuevos endpoints de lista** → usar `unstable_cache` con un tag descriptivo
2. **Mutaciones (POST/PUT/DELETE)** → llamar `revalidateTag('tag', 'max')` al final
3. **Componentes que solo muestran datos** → considerar si pueden recibir datos como props del SSR en lugar de hacer fetch propio
4. **Componentes pesados** (con librerías grandes) → usar `React.lazy` + `Suspense`
5. **Listas de items** → si el item tiene muchas props que no cambian frecuentemente, considerar `React.memo`
6. **Nuevas páginas** → crear `loading.tsx` con un skeleton que replique la estructura

---

## Herramientas para medir rendimiento

- **Next.js build output**: muestra el tamaño de cada bundle. Ejecutar `npm run build` y revisar los tamaños.
- **Chrome DevTools → Network**: filtrar por `Fetch/XHR` para ver las llamadas a la API y sus tiempos.
- **Chrome DevTools → Performance**: grabar una sesión para ver re-renders y tiempo de JS.
- **React DevTools → Profiler**: identificar qué componentes se re-renderizan y cuánto tardan.
- **Vercel Analytics** (si se usa Vercel): métricas de Core Web Vitals en producción.
