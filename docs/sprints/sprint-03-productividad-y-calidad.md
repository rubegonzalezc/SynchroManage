# Sprint 3 — Productividad y calidad

**Proyecto:** SynchroManage  
**Duración sugerida:** 2 semanas  
**Equipo:** 3 desarrolladores  
**Depende de:** Sprint 1 recomendado; Sprint 2 opcional (sin bloqueo fuerte)

| Desarrollador | Perfil | Rol en el sprint |
|---------------|--------|------------------|
| **Rubén González** | Senior | API búsqueda, reglas de negocio, revisión |
| **José** | Frontend | Command palette, vista bugs, UI |
| **Sebastián** | Fullstack | Historial tarea, integración, pruebas |

## Objetivo del sprint

Mejorar la **velocidad de navegación** (búsqueda global, triage de bugs) y la **calidad del flujo de cierre** (historial por tarea, reglas al completar).

**Épica:** *Encontrar rápido y cerrar con criterio*

---

## Definition of Done (DoD)

- Funcionalidades probadas en roles PM, Developer y Tech Lead.
- Mensajes y etiquetas en español.
- APIs con validación server-side donde aplique reglas de negocio.
- Build sin errores; sin regresiones en Kanban, tareas y bugs existentes.
- Revisión de código entre pares.

---

## Capacidad estimada

| Desarrollador | Puntos asignados |
|---------------|------------------|
| Rubén González | ~10 pts |
| José | ~12 pts |
| Sebastián | ~11 pts |
| **Total** | **~33 pts** |

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
| HU-01 | Búsqueda global (Cmd+K) | **P0** | 8 | José |
| HU-02 | API de búsqueda unificada | **P1** | 5 | Rubén González |
| HU-03 | Vista global de bugs (`/dashboard/bugs`) | **P1** | 8 | José |
| HU-04 | Historial de cambios por tarea | **P1** | 5 | Sebastián |
| HU-05 | Regla: no cerrar tarea con bugs abiertos | **P1** | 5 | Rubén González |
| HU-06 | Filtros y acciones rápidas en vista bugs | **P2** | 3 | Sebastián |
| HU-07 | Enlace búsqueda → detalle (tarea/proyecto/bug) | **P2** | 2 | José |
| HU-08 | Documentación y actualización README | **P2** | 2 | Sebastián |

---

## Historias de usuario

### HU-01 — Búsqueda global (Cmd+K)

**Como** usuario del sistema  
**Quiero** abrir una búsqueda rápida con teclado  
**Para** saltar a tareas, proyectos, bugs o usuarios sin navegar menús  

**Criterios de aceptación:**
- Atajo `Ctrl+K` / `Cmd+K` abre command palette.
- Busca por: título, `#número de tarea`, nombre de proyecto, bug, usuario.
- Resultados agrupados: Tareas, Proyectos, Bugs, Usuarios.
- Al seleccionar: navega al detalle (proyecto+tarea, bug, perfil).
- Debounce ~300ms; mínimo 2 caracteres.
- Accesible desde layout del dashboard.

**Puntos:** 8  
**Prioridad:** P0 — Crítica  
**Asignado:** José  
**Depende de:** HU-02

---

### HU-02 — API de búsqueda unificada

**Como** equipo de desarrollo  
**Quiero** un endpoint de búsqueda centralizado  
**Para** alimentar la command palette y futuras integraciones  

**Criterios de aceptación:**
- `GET /api/dashboard/search?q=...` con límite por tipo (ej. 5 cada uno).
- Respeta permisos/RLS: solo entidades visibles para el usuario.
- Búsqueda `ilike` en título/nombre; tareas también por `task_number`.
- Respuesta tipada: `{ tasks, projects, bugs, users }`.

**Puntos:** 5  
**Prioridad:** P1 — Alta  
**Asignado:** Rubén González

---

### HU-03 — Vista global de bugs

**Como** PM o Admin  
**Quiero** una pantalla de triage de bugs cross-proyecto  
**Para** priorizar incidencias sin entrar proyecto por proyecto  

**Criterios de aceptación:**
- Ruta `/dashboard/bugs` (o equivalente en nav para PM/Admin/Tech Lead).
- Tabla/lista: severidad, estado, proyecto, tarea vinculada, asignado, fecha.
- Filtros: severidad, estado, proyecto, asignado.
- Clic abre `BugDetailDialog` o navega al proyecto.
- Entrada en sidebar para roles autorizados.

**Puntos:** 8  
**Prioridad:** P1 — Alta  
**Asignado:** José  
**Depende de:** API bugs existente

---

### HU-04 — Historial de cambios por tarea

**Como** usuario que revisa una tarea  
**Quiero** ver un timeline de lo que cambió  
**Para** entender quién movió estado, asignó o cambió dependencia  

**Criterios de aceptación:**
- Panel **Historial** en `TaskDetailDialog` (y standalone si aplica).
- Datos desde `activity_log` filtrado por `entity_id` = tarea.
- Eventos: creación, cambio estado, asignación, dependencia, sprint, revisor.
- Formato legible en español con usuario y fecha relativa.
- Paginación o límite (últimos 50 eventos).

**Puntos:** 5  
**Prioridad:** P1 — Alta  
**Asignado:** Sebastián

---

### HU-05 — Regla: no cerrar tarea con bugs abiertos

**Como** Tech Lead o PM  
**Quiero** que el sistema impida marcar una tarea como completada si tiene bugs abiertos  
**Para** evitar cerrar trabajo con deuda de calidad visible  

**Criterios de aceptación:**
- Si la tarea tiene bugs vinculados en estado `open` o `in_progress`, no permitir `done`.
- Validación en PUT/PATCH (mismo patrón que dependencias Sprint 1).
- Mensaje claro: lista de bugs bloqueantes con enlace.
- UI: aviso en detalle y bloqueo en Kanban al soltar en Completado.
- Permitir `done` si bugs están `resolved` o `closed`.

**Puntos:** 5  
**Prioridad:** P1 — Alta  
**Asignado:** Rubén González

---

### HU-06 — Filtros y acciones rápidas en vista bugs

**Como** PM  
**Quiero** filtrar y actuar rápido sobre bugs desde la vista global  
**Para** reducir tiempo de triage  

**Criterios de aceptación:**
- Filtros persistentes en URL (query params).
- Acción rápida: cambiar asignado o severidad sin abrir detalle completo (inline o menú).
- Contador por severidad en cabecera de la vista.

**Puntos:** 3  
**Prioridad:** P2 — Media  
**Asignado:** Sebastián  
**Depende de:** HU-03

---

### HU-07 — Enlaces desde búsqueda a detalle

**Como** usuario  
**Quiero** que cada resultado de búsqueda me lleve al lugar correcto  
**Para** no perder contexto al usar Cmd+K  

**Criterios de aceptación:**
- Tarea → `/projects/[id]?task=[taskId]` o abrir diálogo.
- Proyecto → `/projects/[id]`.
- Bug → proyecto + bug o vista global con detalle.
- Usuario → `/dashboard/users` o perfil si existe.

**Puntos:** 2  
**Prioridad:** P2 — Media  
**Asignado:** José  
**Depende de:** HU-01

---

### HU-08 — Documentación

**Como** equipo  
**Quiero** documentar búsqueda, vista bugs y reglas de cierre  
**Para** onboarding y soporte  

**Criterios de aceptación:**
- README: búsqueda global, vista bugs, regla bugs abiertos.
- Atajos de teclado documentados.

**Puntos:** 2  
**Prioridad:** P2 — Media  
**Asignado:** Sebastián  
**Depende de:** HU-01, HU-03, HU-05

---

## Orden de ejecución recomendado

| Orden | HU | Prioridad | Responsable |
|-------|-----|-----------|-------------|
| 1 | HU-02 | **P1** | Rubén González |
| 2 | HU-01 | **P0** | José |
| 3 | HU-03 | **P1** | José |
| 4 | HU-04 | **P1** | Sebastián |
| 5 | HU-05 | **P1** | Rubén González |
| 6 | HU-07 | **P2** | José |
| 7 | HU-06 | **P2** | Sebastián |
| 8 | HU-08 | **P2** | Sebastián |

---

## Demo del sprint

1. `Cmd+K` → buscar `#56` → abrir tarea directamente.
2. Ir a **Bugs** global → filtrar críticos sin asignar → abrir uno.
3. Abrir tarea → pestaña **Historial** → ver cambio de estado y asignación.
4. Intentar mover tarea con bug abierto a **Completado** → bloqueado con mensaje.
5. Resolver bug → tarea se puede completar.

---

## Riesgos

| Riesgo | Mitigación |
|--------|------------|
| Búsqueda lenta con muchos datos | Límite por tipo + índices DB si hace falta |
| Vista bugs duplica lógica del proyecto | Reutilizar `BugDetailDialog` y APIs existentes |
| Regla bugs muy estricta | Permitir override solo Admin (opcional, P3) |
| `activity_log` incompleto | Registrar eventos faltantes en HU-05 si gaps |
