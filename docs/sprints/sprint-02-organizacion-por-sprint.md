# Sprint 2 — Organización de tareas por sprint

**Proyecto:** SynchroManage  
**Duración sugerida:** 2 semanas  
**Equipo:** 3 desarrolladores  
**Depende de:** Sprint 1 (dependencias operativas) completado o en rama estable

| Desarrollador | Perfil | Rol en el sprint |
|---------------|--------|------------------|
| **Rubén González** | Senior | Modelo de datos, API, migraciones, revisión |
| **José** | Frontend | Selectores, vistas, etiquetas HU-N en UI |
| **Sebastián** | Fullstack | Integración API↔UI, listas, pruebas |

## Objetivo del sprint

Permitir **agrupar y referenciar tareas por sprint** con numeración local (`HU-1`, `HU-2`…) sin perder el `#global` del proyecto, mejorar el selector de **dependencias** (sprint → tarea) y soportar **varias tareas como dependencias** de una misma historia.

**Épica:** *Planificación por sprint con historias de usuario numeradas y dependencias múltiples*

---

## Definition of Done (DoD)

- Migración aplicada en Supabase y archivo en `supabase/migrations/`.
- `task_number` global intacto; `sprint_order` coherente por sprint.
- Selector de dependencias en crear/editar tarea con filtro por sprint (**varias tareas** por historia).
- UI muestra `Sprint N · HU-M` junto al `#global` donde aplique.
- Bloqueo operativo (Sprint 1) aplica cuando **cualquier** dependencia no está en `done`.
- Build y pruebas manuales en proyecto con ≥2 sprints.
- Sin regresiones en Kanban, dependencias operativas (Sprint 1) ni APIs existentes.

---

## Capacidad estimada

| Desarrollador | Puntos asignados |
|---------------|------------------|
| Rubén González | ~18 pts |
| José | ~11 pts |
| Sebastián | ~14 pts |
| **Total** | **~43 pts** |

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
| HU-01 | Campo `sprint_order` y migración | **P0** | 5 | Rubén González |
| HU-02 | Autoasignar orden al crear/mover tarea en sprint | **P1** | 3 | Rubén González |
| HU-03 | Selector de dependencias en dos pasos (sprint → tarea) | **P1** | 8 | José |
| HU-04 | Etiquetas `Sprint · HU-N` en tarjetas y detalle | **P1** | 5 | José |
| HU-05 | Agrupación visual por sprint en vista lista | **P2** | 5 | Sebastián |
| HU-06 | API y tipos actualizados (`sprint_order`) | **P1** | 3 | Sebastián |
| HU-07 | Reordenar HU-N dentro del sprint (opcional) | **P3** | 5 | Rubén González |
| HU-08 | Documentación sprint y modelo de numeración | **P2** | 2 | José |
| HU-09 | Dependencias múltiples por tarea | **P1** | 10 | Rubén González |

> **Nota de capacidad:** ~43 pts puede requerir extender el sprint a 2.5 semanas o posponer HU-07 si no hay tiempo.

---

## Historias de usuario

### HU-01 — Campo `sprint_order` y migración

**Como** equipo de desarrollo  
**Quiero** un orden secuencial de tareas dentro de cada sprint  
**Para** identificar historias como HU-1, HU-2 sin reemplazar el `#global` del proyecto  

**Criterios de aceptación:**
- Migración: `sprint_order INTEGER` en `tasks` (nullable; null si sin sprint).
- Índice único parcial opcional: `(sprint_id, sprint_order)` donde ambos no son null.
- Script de backfill: tareas existentes con `sprint_id` reciben orden según `position` o `created_at`.
- `task_number` global no se modifica.

**Puntos:** 5  
**Prioridad:** P0 — Crítica  
**Asignado:** Rubén González

---

### HU-02 — Autoasignar orden al crear o mover tarea a sprint

**Como** PM o Tech Lead  
**Quiero** que al asignar una tarea a un sprint se le asigne automáticamente el siguiente `sprint_order`  
**Para** no numerar manualmente cada historia  

**Criterios de aceptación:**
- Al crear tarea con `sprint_id`, `sprint_order = MAX + 1` en ese sprint.
- Al cambiar `sprint_id` en PUT, recalcular orden en sprint destino.
- Al quitar sprint (`sprint_id = null`), `sprint_order = null`.
- Sin huecos obligatorios al eliminar tareas (no recompactar en este sprint salvo HU-07).

**Puntos:** 3  
**Prioridad:** P1 — Alta  
**Asignado:** Rubén González  
**Depende de:** HU-01

---

### HU-03 — Selector de dependencias en dos pasos (sprint → tarea)

**Como** PM o Developer  
**Quiero** elegir dependencias filtrando primero por sprint y luego por historia  
**Para** no confundir HU-3 del Sprint 1 con HU-3 del Sprint 2  

**Criterios de aceptación:**
- Paso 1: sprint — opciones: sprint actual, backlog, otros sprints, **Todos**.
- Paso 2: buscar por título, `#global`, `HU-3` o número de orden.
- Opción **Sin dependencias** siempre visible.
- Etiqueta: `Sprint 1 · HU-3 · Título` + `#58` en tooltip.
- Dependencias **cross-sprint** permitidas (validación Sprint 1 intacta).
- Componente base preparado para **selección múltiple** (HU-09).
- Componente: evolución de `SingleSelectTask` → `SprintTaskSelect`.

**Puntos:** 8  
**Prioridad:** P1 — Alta  
**Asignado:** José  
**Depende de:** HU-01, HU-06

---

### HU-04 — Etiquetas Sprint · HU-N en tarjetas y detalle

**Como** usuario del proyecto  
**Quiero** ver la referencia local de la historia junto al número global  
**Para** hablar del sprint en daily/reuniones con el mismo lenguaje  

**Criterios de aceptación:**
- `TaskCard`, `TaskListView` y diálogos de detalle muestran `Sprint X · HU-N` si tiene sprint y orden.
- Si no hay `sprint_order`, mostrar solo `#global` y nombre del sprint.
- Diseño coherente con glass/MUI; no saturar la tarjeta.

**Puntos:** 5  
**Prioridad:** P1 — Alta  
**Asignado:** José  
**Depende de:** HU-06

---

### HU-05 — Agrupación visual por sprint en vista lista

**Como** PM  
**Quiero** ver las tareas agrupadas por sprint en la vista lista  
**Para** revisar el contenido de cada iteración sin cambiar al Kanban  

**Criterios de aceptación:**
- Vista lista agrupa por sprint activo/seleccionado o muestra secciones por sprint.
- Sección **Backlog** para tareas sin sprint.
- Orden dentro del grupo por `sprint_order` ascendente.
- Compatible con filtros existentes (búsqueda, prioridad, asignado).

**Puntos:** 5  
**Prioridad:** P2 — Media  
**Asignado:** Sebastián  
**Depende de:** HU-04

---

### HU-06 — API y tipos actualizados (`sprint_order`)

**Como** equipo de desarrollo  
**Quiero** que las APIs expongan y acepten `sprint_order`  
**Para** que el frontend y otras vistas consuman datos consistentes  

**Criterios de aceptación:**
- GET proyecto, GET/PUT tarea incluyen `sprint_order`.
- POST/PUT validan: `sprint_order` solo si hay `sprint_id`.
- Tipos en `useProject`, `TaskCard`, hooks y diálogos actualizados.
- Caché/revalidate de proyecto tras cambios.

**Puntos:** 3  
**Prioridad:** P1 — Alta  
**Asignado:** Sebastián  
**Depende de:** HU-01

---

### HU-07 — Reordenar HU-N dentro del sprint (stretch)

**Como** PM  
**Quiero** cambiar el orden de las historias dentro de un sprint  
**Para** reflejar prioridades sin renumerar el `#global`  

**Criterios de aceptación:**
- Drag & drop o botones subir/bajar en vista lista del sprint.
- Actualiza `sprint_order` de las tareas afectadas.
- Solo dentro del mismo sprint.

**Puntos:** 5  
**Prioridad:** P3 — Baja  
**Asignado:** Rubén González  
**Depende de:** HU-05

---

### HU-08 — Documentación del modelo de numeración

**Como** nuevo desarrollador  
**Quiero** documentación clara sobre `#global` vs `HU-N`  
**Para** no mezclar identificadores en bugs, ramas y dependencias  

**Criterios de aceptación:**
- Sección en README o `docs/sprints/`.
- Tabla: `task_number`, `sprint_order`, `task_dependencies`, migración desde `depends_on_task_id`.
- Ejemplos de dependencia cross-sprint y **múltiples dependencias**.

**Puntos:** 2  
**Prioridad:** P2 — Media  
**Asignado:** José  
**Depende de:** HU-03, HU-04, HU-09

---

### HU-09 — Dependencias múltiples por tarea

**Como** PM o Developer  
**Quiero** poder asignar **varias tareas** como dependencias de una misma historia  
**Para** reflejar que debo completar más de un entregable antes de avanzar (ej. #56 y #57 antes de #58)  

**Criterios de aceptación:**

**Modelo de datos**
- Nueva tabla `task_dependencies` (`task_id`, `depends_on_task_id`, `created_at`).
- PK/unique en `(task_id, depends_on_task_id)`; FK con `ON DELETE CASCADE` en la fila de dependencia.
- Migración de datos: copiar `tasks.depends_on_task_id` existente a `task_dependencies`.
- Deprecar `depends_on_task_id` en `tasks` (mantener columna temporalmente o eliminar tras migración y backfill).

**API**
- POST/PUT aceptan `depends_on_task_ids: string[]` (array de UUIDs).
- GET tarea y GET proyecto devuelven `dependencies: [{ id, task_number, title, status, sprint_id?, sprint_order? }]`.
- Validaciones: mismo proyecto, sin auto-referencia, sin ciclos, sin duplicados.
- Bloqueo (Sprint 1): no avanzar a `in_progress` / `review` / `done` si **alguna** dependencia no está en `done`.
- Mensaje de error lista **todas** las dependencias pendientes (ej. *"Debes completar #56 X y #57 Y"*).

**UI**
- Campo **Dependencias** (plural) con selección múltiple sobre el selector sprint → tarea (HU-03).
- Chips/lista de dependencias seleccionadas con opción de quitar una sin limpiar todas.
- Búsqueda por `#global`, `HU-N` o título; excluir la tarea actual.
- Aviso de bloqueo y badge en Kanban muestran **N dependencias** o las más críticas (ej. `Bloqueada · 2 tareas`).
- Funciona en crear tarea, editar tarea y `TaskDetailDialogStandalone`.

**Puntos:** 10  
**Prioridad:** P1 — Alta  
**Asignado:** Rubén González  
**Apoyo UI:** José (selector múltiple), Sebastián (integración formularios y Mis Tareas)  
**Depende de:** HU-03, Sprint 1 (HU-01 bloqueo API)  
**Notas técnicas:**
- Refactorizar `assertTaskNotBlockedByDependency` para consultar `task_dependencies`.
- Componente `MultiSelectTask` o extender `SprintTaskSelect` con modo `multiple`.
- Actualizar `enrichTasksWithDependencies` → `enrichTasksWithDependencyList`.

---

## Orden de ejecución recomendado

| Orden | HU | Prioridad | Responsable |
|-------|-----|-----------|-------------|
| 1 | HU-01 | **P0** | Rubén González |
| 2 | HU-06 | **P1** | Sebastián |
| 3 | HU-02 | **P1** | Rubén González |
| 4 | HU-03 | **P1** | José |
| 5 | HU-09 | **P1** | Rubén González |
| 6 | HU-04 | **P1** | José |
| 7 | HU-05 | **P2** | Sebastián |
| 8 | HU-08 | **P2** | José |
| 9 | HU-07 | **P3** | Rubén González |

---

## Demo del sprint

1. Proyecto con **Sprint 1** (HU-1…HU-6) y **Sprint 2** (HU-1…HU-4).
2. Crear tarea en Sprint 2 → se asigna **HU-5** automáticamente.
3. En dependencias: filtrar **Sprint 1** → elegir **HU-5** y **HU-6** como dependencias de una tarea del Sprint 2.
4. Intentar avanzar la tarea → bloqueada hasta completar **ambas** dependencias.
5. Ver en Kanban: `Sprint 2 · HU-3` y `#62` en la tarjeta; badge `Bloqueada · 2 tareas`.
6. Vista lista agrupada por sprint con orden correcto.

---

## Riesgos

| Riesgo | Mitigación |
|--------|------------|
| Confusión `#global` vs `HU-N` | Mostrar siempre ambos en UI y docs |
| Backfill incorrecto en datos legacy | Script SQL revisado + prueba en staging |
| Selector dependencias más lento | Cargar tareas del proyecto una vez; filtrar en cliente |
| Migración `depends_on_task_id` → N:M | Script idempotente + verificar filas huérfanas |
| Sprint sobrecargado (~43 pts) | Priorizar HU-09; posponer HU-07 |
| Alcance de reorden (HU-07) | Dejar como stretch; no bloquea el objetivo |
