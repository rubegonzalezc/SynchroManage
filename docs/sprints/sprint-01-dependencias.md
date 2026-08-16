# Sprint 1 — Dependencias operativas

**Proyecto:** SynchroManage  
**Duración sugerida:** 2 semanas  
**Equipo:** 3 desarrolladores

| Desarrollador | Perfil | Rol en el sprint |
|---------------|--------|------------------|
| **Rubén González** | Senior | API, reglas de negocio, arquitectura, revisión |
| **José** | Frontend | UI/UX, Kanban, badges, mensajes |
| **Sebastián** | Fullstack | Integración API↔UI, Mis Tareas, pruebas |

## Objetivo del sprint

Hacer que las **dependencias entre tareas sean operativas**, no solo informativas: el sistema debe impedir avanzar tareas bloqueadas y mostrarlo claramente en Kanban, detalle de tarea y Mis Tareas.

**Épica:** *Dependencias operativas y visibilidad de bloqueos*

---

## Definition of Done (DoD)

- Código integrado sin errores de build (`npm run build`).
- Validación en **API y UI** (no solo en uno).
- Mensajes de error en **español** y claros para el usuario.
- Probado manualmente: crear tarea, editar dependencia, mover en Kanban, guardar desde detalle.
- Revisión de código por otro miembro del equipo.
- Sin regresiones en flujos existentes de tareas y sprints.

---

## Capacidad estimada

| Desarrollador | Puntos asignados |
|---------------|------------------|
| Rubén González | ~8 pts |
| José | ~10 pts |
| Sebastián | ~10 pts |
| **Total** | **~30 pts** |

---

## Escala de prioridades

| Prioridad | Significado | Criterio |
|-----------|-------------|----------|
| **P0 — Crítica** | Obligatoria | Sin esto el sprint no cumple su objetivo |
| **P1 — Alta** | Muy importante | Core del sprint; debe entrar sí o sí |
| **P2 — Media** | Importante | Aporta valor; se puede recortar si falta tiempo |
| **P3 — Baja** | Deseable | Stretch goal; solo si P0–P2 están listas |

### Resumen de prioridades

| HU | Título | Prioridad | Puntos | Asignado |
|----|--------|-----------|--------|----------|
| HU-01 | Bloqueo de cambio de estado en API | **P0** | 5 | Rubén González |
| HU-02 | Mensajes de error consistentes | **P1** | 2 | Sebastián |
| HU-03 | Bloqueo visual en Kanban (drag) | **P1** | 5 | José |
| HU-04 | Badge de bloqueo en TaskCard | **P1** | 3 | José |
| HU-05 | Bloqueo en selector de estado | **P2** | 3 | Sebastián |
| HU-06 | Indicador en Mis Tareas | **P2** | 5 | Sebastián |
| HU-07 | Pruebas automatizadas | **P1** | 3 | Rubén González |
| HU-08 | Documentación | **P2** | 2 | José |

> **Nota:** La agrupación de dependencias por sprint y numeración `HU-N` por sprint se planificará en un sprint aparte (cambio de mayor alcance).

---

## Historias de usuario

### HU-01 — Bloqueo de cambio de estado en API

**Como** Tech Lead o Developer  
**Quiero** que el sistema impida cambiar el estado de una tarea si su dependencia no está completada  
**Para** evitar avanzar trabajo que aún no debería iniciarse  

**Criterios de aceptación:**
- Si `depends_on_task_id` apunta a una tarea con `status !== 'done'`, no se permite cambiar a `in_progress`, `review` o `done`.
- Se permite mantener o mover a `backlog` / `todo`.
- `PUT /api/dashboard/tasks/[id]` y `PATCH /api/dashboard/tasks` (drag Kanban) devuelven **400** con mensaje claro.
- Si la dependencia está en `done`, el cambio de estado funciona con normalidad.
- Quitar la dependencia (`depends_on_task_id = null`) desbloquea la tarea.

**Puntos:** 5  
**Prioridad:** P0 — Crítica  
**Asignado:** Rubén González  
**Notas técnicas:** Reutilizar `validateTaskDependency` y crear `assertTaskNotBlockedByDependency`. Aplicar en PUT y PATCH.

---

### HU-02 — Mensajes de error consistentes al intentar avanzar

**Como** usuario del sistema  
**Quiero** ver un mensaje claro cuando una tarea está bloqueada por dependencia  
**Para** saber exactamente qué tarea debo completar primero  

**Criterios de aceptación:**
- El mensaje incluye `#número` y título de la tarea dependiente.
- Ejemplo: *"No puedes avanzar esta tarea hasta completar #56 Configurar impresora".*
- El mismo formato se usa en API (campo `error`) y en UI (toast/alert, toast tipo iPhone).
- Funciona al guardar desde el diálogo de detalle y al mover en Kanban.

**Puntos:** 2  
**Prioridad:** P1 — Alta  
**Asignado:** Sebastián  
**Depende de:** HU-01

---

### HU-03 — Bloqueo visual al arrastrar en Kanban

**Como** Developer  
**Quiero** que el Kanban no me deje soltar una tarea en columnas avanzadas si está bloqueada  
**Para** detectar el bloqueo antes de que falle el guardado  

**Criterios de aceptación:**
- Al arrastrar una tarea bloqueada, las columnas `En Progreso`, `En Revisión` y `Completado` se muestran como no válidas (estilo visual distinto).
- Al soltar en columna no permitida, la tarjeta vuelve a su posición original.
- Se muestra toast con el motivo del bloqueo.
- Si la dependencia está completada, el drag funciona igual que hoy.

**Puntos:** 5  
**Prioridad:** P1 — Alta  
**Asignado:** José  
**Depende de:** HU-01

---

### HU-04 — Badge de bloqueo en tarjeta de tarea (Kanban)

**Como** PM o Developer  
**Quiero** ver en la tarjeta del Kanban si una tarea está bloqueada por otra  
**Para** priorizar sin abrir cada tarea  

**Criterios de aceptación:**
- Badge visible en `TaskCard` cuando hay dependencia no completada.
- Texto tipo: `Bloqueada · #56` o icono + tooltip con título completo.
- No se muestra si no hay dependencia o si ya está `done`.
- Diseño coherente con el estilo actual (glass/MUI).

**Puntos:** 3  
**Prioridad:** P1 — Alta  
**Asignado:** José

---

### HU-05 — Aviso de bloqueo en selector de estado (detalle de tarea)

**Como** usuario que edita una tarea  
**Quiero** que el selector de estado deshabilite o advierta opciones no permitidas  
**Para** no intentar guardar un cambio inválido  

**Criterios de aceptación:**
- En `TaskDetailDialog` y `TaskDetailDialogStandalone`, si hay bloqueo:
  - Opciones `En Progreso`, `En Revisión`, `Completado` deshabilitadas con tooltip explicativo.
- El aviso amarillo existente se mantiene y es coherente con el selector.
- Al completar la tarea dependiente (o quitar dependencia), las opciones se habilitan sin recargar toda la página.

**Puntos:** 3  
**Prioridad:** P2 — Media  
**Asignado:** Sebastián  
**Depende de:** HU-01, HU-02

---

### HU-06 — Indicador de bloqueo en Mis Tareas

**Como** Developer  
**Quiero** ver en `/my-tasks` qué tareas mías están bloqueadas  
**Para** enfocarme en lo que sí puedo avanzar  

**Criterios de aceptación:**
- Lista de Mis Tareas muestra badge/indicador de bloqueo.
- Filtro opcional: **"Solo bloqueadas"** o **"Solo desbloqueadas"**.
- API `/api/dashboard/my-tasks` incluye `depends_on_task_id` y datos mínimos de dependencia.

**Puntos:** 5  
**Prioridad:** P2 — Media  
**Asignado:** Sebastián  
**Depende de:** HU-04 (reutilizar componente visual si es posible)

---

### HU-07 — Pruebas automatizadas de reglas de dependencia

**Como** equipo de desarrollo  
**Quiero** tests para las reglas de dependencia  
**Para** evitar regresiones en futuros sprints  

**Criterios de aceptación:**
- Tests en Vitest para:
  - `validateTaskDependency` (ciclos, mismo proyecto, auto-referencia).
  - Nueva función de bloqueo por estado (`canAdvanceTaskStatus` o equivalente).
  - `enrichTasksWithDependencies` / `resolveDependencyTask`.
- Casos: sin dependencia, dependencia pendiente, dependencia completada.

**Puntos:** 3  
**Prioridad:** P1 — Alta  
**Asignado:** Rubén González  
**Depende de:** HU-01

---

### HU-08 — Documentación del sprint y feature

**Como** nuevo desarrollador del equipo  
**Quiero** documentación actualizada de dependencias  
**Para** entender cómo funciona y qué restricciones aplica  

**Criterios de aceptación:**
- Sección en README: qué es dependencia, cómo configurarla, qué estados bloquea.
- Nota de API: campos `depends_on_task_id`, errores posibles.
- Descripción breve del badge y del comportamiento en Kanban.

**Puntos:** 2  
**Prioridad:** P2 — Media  
**Asignado:** José  
**Depende de:** HU-01 a HU-06 completadas

---

## Orden de ejecución recomendado

| Orden | HU | Prioridad | Responsable |
|-------|-----|-----------|-------------|
| 1 | HU-01 | **P0** | Rubén González |
| 2 | HU-04 | **P1** | José |
| 3 | HU-02 | **P1** | Sebastián |
| 4 | HU-07 | **P1** | Rubén González |
| 5 | HU-03 | **P1** | José |
| 6 | HU-05 | **P2** | Sebastián |
| 7 | HU-06 | **P2** | Sebastián |
| 8 | HU-08 | **P2** | José |

---

## Demo del sprint

1. Crear tarea **#56** "Configurar impresora" y **#57** "Mover comanda" con dependencia en #56.
2. Intentar mover #57 a **En Progreso** en Kanban → bloqueado + mensaje claro.
3. Completar #56 → #57 se desbloquea.
4. Ver badge en Kanban y filtro en Mis Tareas.

---

## Riesgos

| Riesgo | Mitigación |
|--------|------------|
| Optimistic update en Kanban | Revertir si API devuelve 400 (HU-03) |
| Mensajes de error no visibles en UI | Priorizar HU-02 tras HU-01 |
