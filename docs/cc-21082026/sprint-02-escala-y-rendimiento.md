# Sprint 2 — Escala y rendimiento

**Control de cambios:** CC-21082026  
**Proyecto:** SynchroManage  
**Duración sugerida:** 2 semanas  
**Equipo:** 3 desarrolladores  
**Depende de:** Sprint 1 de CC-21082026 (recomendado, sin bloqueo fuerte)

| Desarrollador | Perfil | Rol en el sprint |
|---------------|--------|------------------|
| **Rubén González** | Senior | API paginación, optimización queries, revisión |
| **José** | Frontend | UI paginación lista/bugs, UX carga |
| **Sebastián** | Fullstack | Tests regresión, lazy load, integración |

## Objetivo del sprint

Garantizar que SynchroManage **escale** cuando los proyectos tienen muchas tareas o la vista global de bugs crece, sin degradar la experiencia de Kanban y listas.

**Épica:** *Operar sin fricción*

---

## Definition of Done (DoD)

- Listas de 200+ ítems navegables sin timeout perceptible.
- Paginación o carga progresiva documentada en README/API.
- Sin regresiones en filtros, drag Kanban y búsqueda Cmd+K.
- Revisión de código entre pares.

---

## Capacidad estimada

| Desarrollador | Puntos asignados |
|---------------|------------------|
| Rubén González | ~13 pts |
| José | ~11 pts |
| Sebastián | ~7 pts |
| **Total** | **~31 pts** |

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
| HU-01 | Paginación en vista lista de tareas | **P0** | 8 | José |
| HU-02 | Paginación en vista global de bugs | **P1** | 5 | José |
| HU-03 | API proyecto: carga paginada de tareas | **P1** | 8 | Rubén González |
| HU-04 | Indicadores de carga y empty states | **P1** | 3 | José |
| HU-05 | Lazy load / límite inicial en Kanban | **P2** | 5 | Sebastián |
| HU-06 | Tests de regresión flujos críticos | **P1** | 5 | Sebastián |

---

## Historias de usuario

### HU-01 — Paginación en vista lista de tareas

**Como** PM con proyectos grandes  
**Quiero** paginar la vista lista de tareas  
**Para** no cargar cientos de filas de una vez  

**Criterios de aceptación:**
- `TaskListView` muestra paginación (ej. 25 / 50 / 100 por página).
- Controles: anterior, siguiente, total de páginas.
- Filtros activos se mantienen al cambiar de página.
- Ordenamiento por columna conservado dentro de la página o global (definir y documentar).
- URL opcional: `?page=2&pageSize=25` en detalle de proyecto (modo lista).

**Puntos:** 8  
**Prioridad:** P0 — Crítica  
**Asignado:** José  
**Depende de:** HU-03 (recomendado)

---

### HU-02 — Paginación en vista global de bugs

**Como** Tech Lead en triage  
**Quiero** paginar la tabla de `/dashboard/bugs`  
**Para** navegar listas largas sin lentitud  

**Criterios de aceptación:**
- Paginación server-side o client-side según volumen (preferir server-side si API lo soporta).
- Compatible con filtros URL existentes (`q`, `severity`, `status`, `project`, `assignee`).
- Selector de tamaño de página (25 / 50).
- Deep link `?bug=[id]` sigue abriendo el detalle correctamente.

**Puntos:** 5  
**Prioridad:** P1 — Alta  
**Asignado:** José

---

### HU-03 — API proyecto: carga paginada de tareas

**Como** equipo de desarrollo  
**Quiero** que la API de proyecto soporte paginación de tareas  
**Para** reducir payload y tiempo de respuesta  

**Criterios de aceptación:**
- `GET /api/dashboard/projects/[id]` acepta `tasks_page`, `tasks_page_size` (o endpoint dedicado `.../tasks`).
- Respuesta incluye `tasks`, `tasks_total`, `tasks_page`, `tasks_page_size`.
- Kanban del sprint activo puede pedir solo tareas del sprint filtrado.
- Retrocompatible: sin query params, comportamiento actual o límite razonable documentado.
- Índices DB revisados si hace falta (`project_id`, `sprint_id`, `status`).

**Puntos:** 8  
**Prioridad:** P1 — Alta  
**Asignado:** Rubén González

---

### HU-04 — Indicadores de carga y empty states

**Como** usuario  
**Quiero** ver skeletons y mensajes claros mientras cargan listas paginadas  
**Para** entender que el sistema responde  

**Criterios de aceptación:**
- Skeleton en lista de tareas y tabla de bugs durante fetch.
- Empty state distinto: «sin tareas» vs «sin resultados con estos filtros».
- Botón **Reintentar** en error de red.
- Coherente con glass/MUI del resto de la app.

**Puntos:** 3  
**Prioridad:** P1 — Alta  
**Asignado:** José  
**Depende de:** HU-01, HU-02

---

### HU-05 — Lazy load / límite inicial en Kanban

**Como** Developer  
**Quiero** que el Kanban cargue rápido aunque el proyecto tenga muchas tareas  
**Para** no esperar al abrir el tablero  

**Criterios de aceptación:**
- Kanban carga tareas del **sprint seleccionado** (ya filtrado); no todas las del proyecto si no es necesario.
- Si una columna supera N tarjetas (ej. 50), mostrar «Cargar más» o scroll virtualizado.
- Drag & drop sigue funcionando en el conjunto visible.
- Sin regresión en realtime/sync entre usuarios.

**Puntos:** 5  
**Prioridad:** P2 — Media  
**Asignado:** Sebastián  
**Depende de:** HU-03

---

### HU-06 — Tests de regresión flujos críticos

**Como** equipo  
**Quiero** tests que cubran Kanban, filtros y paginación  
**Para** detectar regresiones antes de producción  

**Criterios de aceptación:**
- Tests unitarios: helpers de paginación y construcción de query params.
- Tests existentes de dependencias, bugs abiertos y búsqueda siguen en verde.
- Checklist manual documentado en el sprint (mover tarea, filtrar, paginar, Cmd+K).
- CI o script local documentado para correr suite mínima.

**Puntos:** 5  
**Prioridad:** P1 — Alta  
**Asignado:** Sebastián  
**Depende de:** HU-01, HU-03

---

## Orden de ejecución recomendado

| Orden | HU | Responsable |
|-------|-----|-------------|
| 1 | HU-03 | Rubén González |
| 2 | HU-01 | José |
| 3 | HU-02 | José |
| 4 | HU-04 | José |
| 5 | HU-05 | Sebastián |
| 6 | HU-06 | Sebastián |

---

## Demo del sprint

1. Abrir proyecto con 100+ tareas → lista paginada, cambiar a página 2.
2. `/dashboard/bugs` con muchos registros → paginar sin perder filtros.
3. Kanban sprint activo carga en < 2s percibidos (proyecto de prueba documentado).
4. Suite de tests en verde.
