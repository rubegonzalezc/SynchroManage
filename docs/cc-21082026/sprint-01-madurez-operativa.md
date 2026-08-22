# Sprint 1 — Madurez operativa

**Control de cambios:** CC-21082026  
**Proyecto:** SynchroManage  
**Duración sugerida:** 2 semanas  
**Equipo:** 3 desarrolladores  
**Depende de:** Sprints 1–3 del producto base completados

| Desarrollador | Perfil | Rol en el sprint |
|---------------|--------|------------------|
| **Rubén González** | Senior | API duplicar tarea, modelo reacciones, revisión |
| **José** | Frontend | UI duplicar, reacciones, filtro fecha Kanban |
| **Sebastián** | Fullstack | `@Todos` en Mis Tareas, README, pruebas |

## Objetivo del sprint

Reducir **fricción operativa** en el flujo diario: reutilizar tareas existentes, reaccionar sin comentar de más, y filtrar por urgencia de fecha.

**Épica:** *Operar sin fricción*

---

## Definition of Done (DoD)

- Funcionalidades probadas en roles PM, Tech Lead y Developer.
- Mensajes y etiquetas en español.
- APIs con validación server-side.
- Build sin errores; sin regresiones en comentarios, Kanban y Mis Tareas.
- Revisión de código entre pares.

---

## Capacidad estimada

| Desarrollador | Puntos asignados |
|---------------|------------------|
| Rubén González | ~10 pts |
| José | ~11 pts |
| Sebastián | ~7 pts |
| **Total** | **~28 pts** |

---

## Escala de prioridades

| Prioridad | Significado | Criterio |
|-----------|-------------|----------|
| **P0 — Crítica** | Obligatoria | Sin esto el sprint no cumple su objetivo |
| **P1 — Alta** | Muy importante | Core del sprint |
| **P2 — Media** | Importante | Recortable si falta tiempo |
| **P3 — Baja** | Deseable | Stretch goal |

### Resumen de prioridades

| HU | Título | Prioridad | Puntos | Asignado |
|----|--------|-----------|--------|----------|
| HU-01 | API y reglas para duplicar tarea | **P0** | 5 | Rubén González |
| HU-02 | Duplicar tarea desde UI (detalle y menú) | **P1** | 5 | José |
| HU-03 | Reacciones en comentarios (modelo + API) | **P1** | 5 | Rubén González |
| HU-04 | Reacciones en comentarios (UI) | **P1** | 5 | José |
| HU-05 | Filtro por fecha límite en Kanban | **P1** | 3 | José |
| HU-06 | `@Todos` en comentarios de Mis Tareas | **P2** | 2 | Sebastián |
| HU-07 | Actualizar README con estado real del producto | **P2** | 2 | Sebastián |
| HU-08 | Pruebas de duplicar y reacciones | **P2** | 3 | Sebastián |

---

## Historias de usuario

### HU-01 — API y reglas para duplicar tarea

**Como** PM o Tech Lead  
**Quiero** un endpoint que cree una copia de una tarea existente  
**Para** reutilizar estructura sin reescribir desde cero  

**Criterios de aceptación:**
- `POST /api/dashboard/tasks/[id]/duplicate` crea una tarea nueva en el mismo proyecto.
- Copia: título (con sufijo «(copia)»), descripción, categoría, prioridad, sprint, asignados.
- **No** copia: bugs vinculados, dependencias, comentarios, archivos adjuntos, `task_number` (nuevo secuencial).
- Estado inicial: `backlog` o `todo` (configurable en body, default `backlog`).
- Respeta permisos del rol (mismos que crear tarea).
- Registra actividad en `activity_log` (`action: created`, detalle `duplicated_from`).

**Puntos:** 5  
**Prioridad:** P0 — Crítica  
**Asignado:** Rubén González  
**Notas técnicas:** Reutilizar lógica de `POST /api/dashboard/tasks` y `sprint_order` si aplica.

---

### HU-02 — Duplicar tarea desde UI (detalle y menú)

**Como** usuario con permiso de edición  
**Quiero** duplicar una tarea desde su detalle o menú contextual  
**Para** crear variantes rápidamente  

**Criterios de aceptación:**
- Acción **Duplicar** visible en `TaskDetailDialog` y menú de `TaskCard` (roles con permiso de crear tarea).
- Confirmación opcional o acción directa con toast de éxito.
- Tras duplicar: abre el detalle de la nueva tarea o navega con `?task=[newId]`.
- La lista/Kanban se actualiza sin recargar la página completa.
- Mensaje de error claro si falla la API.

**Puntos:** 5  
**Prioridad:** P1 — Alta  
**Asignado:** José  
**Depende de:** HU-01

---

### HU-03 — Reacciones en comentarios (modelo + API)

**Como** equipo de desarrollo  
**Quiero** persistir reacciones en comentarios  
**Para** dar feedback ligero sin saturar el hilo  

**Criterios de aceptación:**
- Tabla `comment_reactions` (o equivalente): `comment_id`, `user_id`, `emoji` (`thumbs_up`, `check`, `eyes`).
- Un usuario solo puede tener **una reacción activa** por comentario (cambiar emoji reemplaza la anterior; mismo emoji = quitar).
- `POST /api/dashboard/comments/[id]/reactions` y `DELETE` (o toggle en POST).
- `GET` comentarios incluye conteo y reacción del usuario actual.
- RLS: solo usuarios con acceso al proyecto/tarea del comentario.

**Puntos:** 5  
**Prioridad:** P1 — Alta  
**Asignado:** Rubén González  
**Notas técnicas:** Migración en `supabase/migrations/`.

---

### HU-04 — Reacciones en comentarios (UI)

**Como** usuario del sistema  
**Quiero** reaccionar con 👍 ✅ 👀 a comentarios  
**Para** confirmar lectura o acuerdo sin escribir otro comentario  

**Criterios de aceptación:**
- Botones de reacción bajo cada comentario en: proyecto, tarea (detalle), bug y Mis Tareas.
- Muestra conteo por emoji; resalta la reacción propia.
- Toggle al hacer clic (añadir / quitar / cambiar).
- Actualización optimista o feedback inmediato con rollback en error.
- Accesible en móvil (targets táctiles ≥ 44px).

**Puntos:** 5  
**Prioridad:** P1 — Alta  
**Asignado:** José  
**Depende de:** HU-03

---

### HU-05 — Filtro por fecha límite en Kanban

**Como** PM o Developer  
**Quiero** filtrar tareas por fecha límite en el tablero  
**Para** priorizar vencidas o las de esta semana  

**Criterios de aceptación:**
- Nuevo selector en `TaskFilters`: **Todas**, **Vencidas**, **Vence hoy**, **Esta semana**, **Sin fecha**.
- Aplica a vista Kanban y Lista (misma barra de filtros existente).
- Compatible con filtros actuales (prioridad, categoría, asignado, búsqueda).
- Botón **Limpiar** resetea también el filtro de fecha.
- Tareas `done` no aparecen en «Vencidas» aunque `due_date` sea pasada.

**Puntos:** 3  
**Prioridad:** P1 — Alta  
**Asignado:** José

---

### HU-06 — `@Todos` en comentarios de Mis Tareas

**Como** Developer  
**Quiero** mencionar `@Todos` en comentarios de Mis Tareas  
**Para** notificar al equipo igual que en el detalle del proyecto  

**Criterios de aceptación:**
- `TaskDetailDialogStandalone` usa `extractMentionAll` y notifica a integrantes del proyecto.
- Mismo comportamiento que `TaskDetailDialog` (excluir autor y ya mencionados por nombre).
- `@Todos` se resalta en verde al renderizar comentarios.
- Sin regresión en menciones individuales `@Nombre`.

**Puntos:** 2  
**Prioridad:** P2 — Media  
**Asignado:** Sebastián  
**Depende de:** Ninguna (reutilizar `mention-input.tsx`)

---

### HU-07 — Actualizar README con estado real del producto

**Como** equipo  
**Quiero** que el README refleje lo ya implementado  
**Para** onboarding y planificación correctos  

**Criterios de aceptación:**
- Marcar como hechas: filtros Kanban, vista lista, `@Todos`, historial, burndown, búsqueda global, optimistic Kanban, SWR.
- Documentar pendientes reales de este CC (duplicar, reacciones, filtro fecha, paginación, export tareas).
- Enlace a `docs/cc-21082026/` desde README o sección de sprints.
- Sin información contradictoria con el código actual.

**Puntos:** 2  
**Prioridad:** P2 — Media  
**Asignado:** Sebastián

---

### HU-08 — Pruebas de duplicar y reacciones

**Como** equipo  
**Quiero** tests automatizados de las reglas nuevas  
**Para** evitar regresiones  

**Criterios de aceptación:**
- Tests unitarios: payload de duplicar (campos copiados / excluidos).
- Tests unitarios: toggle de reacción (una por usuario, cambio de emoji).
- Al menos un test de integración o API mock para duplicate 400/403.
- `npm run build` y suite de tests relevantes en verde.

**Puntos:** 3  
**Prioridad:** P2 — Media  
**Asignado:** Sebastián  
**Depende de:** HU-01, HU-03

---

## Orden de ejecución recomendado

| Orden | HU | Responsable |
|-------|-----|-------------|
| 1 | HU-01 | Rubén González |
| 2 | HU-03 | Rubén González |
| 3 | HU-02 | José |
| 4 | HU-04 | José |
| 5 | HU-05 | José |
| 6 | HU-06 | Sebastián |
| 7 | HU-08 | Sebastián |
| 8 | HU-07 | Sebastián |

---

## Demo del sprint

1. Abrir tarea → **Duplicar** → ver nueva tarea en backlog con «(copia)».
2. Comentar en proyecto → reaccionar 👍 → ver conteo y toggle.
3. Filtrar Kanban por **Vencidas** → solo tareas con fecha pasada y no completadas.
4. Comentar en Mis Tareas con `@Todos` → notificación a integrantes.
