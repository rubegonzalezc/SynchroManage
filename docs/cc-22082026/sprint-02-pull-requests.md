# Sprint 2 — Pull requests en la tarea

**Control de cambios:** CC-22082026  
**Proyecto:** SynchroManage  
**Duración sugerida:** 2 semanas  
**Equipo:** 3 desarrolladores  
**Depende de:** Sprint 1 de CC-22082026 (botón Crear rama y ramas en GitHub)

| Desarrollador | Perfil | Rol en el sprint |
|---------------|--------|------------------|
| **Rubén González** | Senior | Webhook GitHub, API sync PR, revisión |
| **José** | Frontend | Campo PR en UI (detalle, lista, Kanban) |
| **Sebastián** | Fullstack | Polling respaldo, pruebas e2e manual |

## Objetivo del sprint

Mostrar en cada tarea si existe un **PR activo o mergeado** para su rama, con enlace y estado, sin crear el PR desde SynchroManage.

**Épica:** *Conectar con Git*

---

## Capacidad estimada

| Desarrollador | Puntos asignados |
|---------------|------------------|
| Rubén González | ~11 pts |
| José | ~8 pts |
| Sebastián | ~5 pts |
| **Total** | **~24 pts** |

---

### Resumen de prioridades

| HU | Título | Prioridad | Puntos | Asignado |
|----|--------|-----------|--------|----------|
| HU-01 | Webhook GitHub `pull_request` | **P0** | 8 | Rubén González |
| HU-02 | Sincronizar PR → tarea por `head.ref` | **P0** | 5 | Rubén González |
| HU-03 | Campo PR en detalle de tarea | **P1** | 5 | José |
| HU-04 | Campo PR en TaskCard y vista lista (compacto) | **P1** | 3 | José |
| HU-05 | Polling al abrir tarea (respaldo webhook) | **P2** | 3 | Sebastián |
| HU-06 | Pruebas y documentación PR | **P2** | 2 | Sebastián |

---

## Historias de usuario

### HU-01 — Webhook GitHub `pull_request`

**Como** equipo de desarrollo  
**Quiero** recibir eventos de PR desde GitHub  
**Para** actualizar tareas sin polling constante  

**Criterios de aceptación:**
- `POST /api/webhooks/github` (ruta pública con validación de firma).
- Eventos: `pull_request` (opened, closed, reopened, synchronize, edited).
- Validar `X-Hub-Signature-256` con `GITHUB_WEBHOOK_SECRET`.
- Ignorar repos no registrados en ningún proyecto.
- Responder 200 rápido; procesamiento idempotente.
- Documentar URL del webhook para configurar en GitHub (Settings → Webhooks).

**Puntos:** 8  
**Prioridad:** P0 — Crítica  
**Asignado:** Rubén González

---

### HU-02 — Sincronizar PR → tarea por `head.ref`

**Como** sistema  
**Quiero** asociar un PR a la tarea cuya `branch_name` coincide con `pull_request.head.ref`  
**Para** mostrar estado correcto  

**Criterios de aceptación:**
- Buscar tarea: `branch_name = head.ref` y proyecto con mismo `owner/repo`.
- Actualizar: `pr_number`, `pr_url`, `pr_state`, `pr_updated_at`.
- Estados UI:
  - `open` → Abierto
  - `merged` → Merged (`pull_request.merged === true`)
  - `closed` sin merge → Cerrado
- Si PR se cierra y no hay otro: mantener último estado merged/closed (no borrar historial).
- Si no hay match de tarea: no-op (log debug).

**Puntos:** 5  
**Prioridad:** P0 — Crítica  
**Asignado:** Rubén González  
**Depende de:** HU-01

---

### HU-03 — Campo PR en detalle de tarea

**Como** Developer  
**Quiero** ver el PR de mi rama en el detalle de la tarea  
**Para** saber si está en review o ya mergeado  

**Criterios de aceptación:**
- Fila **PR** junto a **Rama** en detalle (dialog y standalone).
- **Sin PR:** no mostrar fila ni badge (no texto «Sin PR»).
- **Con PR:** `PR #N · {Estado}` como enlace a `pr_url`.
- Colores: Abierto (azul), Merged (verde), Cerrado (gris).
- Actualización tras webhook sin recargar página (mutate SWR o realtime opcional).

**Puntos:** 5  
**Prioridad:** P1 — Alta  
**Asignado:** José  
**Depende de:** HU-02

---

### HU-04 — Campo PR en TaskCard y vista lista (compacto)

**Como** PM  
**Quiero** ver de un vistazo qué tareas tienen PR abierto  
**Para** seguir el flujo de review en el tablero  

**Criterios de aceptación:**
- Badge compacto en `TaskCard`: solo si `pr_state` existe (ej. `PR · Abierto`).
- Columna opcional en `TaskListView` (solo si hay al menos un PR visible en el sprint).
- No aumentar ruido visual: máximo un badge pequeño.
- Clic en badge → abre PR en GitHub.

**Puntos:** 3  
**Prioridad:** P1 — Alta  
**Asignado:** José  
**Depende de:** HU-03

---

### HU-05 — Polling al abrir tarea (respaldo webhook)

**Como** equipo  
**Quiero** refrescar el estado del PR al abrir una tarea  
**Para** cubrir retrasos del webhook o entornos sin webhook  

**Criterios de aceptación:**
- `GET /api/dashboard/tasks/[id]/git-status` consulta GitHub `pulls?head={owner}:{branch}`.
- Se llama al abrir `TaskDetailDialog` (debounce, máx. 1 cada 60s por tarea).
- Actualiza campos PR en DB si cambió.
- No llamar si proyecto sin Git o sin `branch_name`.

**Puntos:** 3  
**Prioridad:** P2 — Media  
**Asignado:** Sebastián  
**Depende de:** HU-02

---

### HU-06 — Pruebas y documentación PR

**Como** equipo  
**Quiero** checklist y tests del flujo PR  
**Para** evitar regresiones  

**Criterios de aceptación:**
- Tests unitarios: mapeo `pull_request` payload → `pr_state`.
- Checklist manual: abrir PR → merged → UI en tarea.
- Actualizar [modelo-git.md](./modelo-git.md) sección PR.
- Instrucciones configurar webhook en repo GitHub.

**Puntos:** 2  
**Prioridad:** P2 — Media  
**Asignado:** Sebastián  
**Depende de:** HU-01, HU-03

---

## Orden de ejecución

| Orden | HU | Responsable |
|-------|-----|-------------|
| 1 | HU-01 | Rubén González |
| 2 | HU-02 | Rubén González |
| 3 | HU-03 | José |
| 4 | HU-04 | José |
| 5 | HU-05 | Sebastián |
| 6 | HU-06 | Sebastián |

## Demo del sprint

1. Tarea con rama → crear PR en GitHub hacia `develop`.
2. En SynchroManage: **PR #X · Abierto** con enlace.
3. Merge en GitHub → **PR #X · Merged**.
4. Tarea sin PR → sin fila PR en detalle.
