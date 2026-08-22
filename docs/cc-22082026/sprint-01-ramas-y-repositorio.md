# Sprint 1 — Repositorio, ramas automáticas y enlaces

**Control de cambios:** CC-22082026  
**Proyecto:** SynchroManage  
**Duración sugerida:** 2 semanas  
**Equipo:** 3 desarrolladores  
**Depende de:** Ningún sprint de CC-22082026; conviene CC-21082026 estable en crear tarea

| Desarrollador | Perfil | Rol en el sprint |
|---------------|--------|------------------|
| **Rubén González** | Senior | Migración, cliente GitHub, API crear rama, revisión |
| **José** | Frontend | UI config proyecto, enlaces rama en tarea/Kanban |
| **Sebastián** | Fullstack | Variables entorno, reintento, pruebas, documentación |

## Objetivo del sprint

Que **cada tarea nueva** tenga su rama en GitHub (desde la rama de desarrollo del proyecto) y que el equipo pueda **abrir y copiar** esa rama desde SynchroManage.

**Épica:** *Conectar con Git*

---

## Capacidad estimada

| Desarrollador | Puntos asignados |
|---------------|------------------|
| Rubén González | ~13 pts |
| José | ~10 pts |
| Sebastián | ~6 pts |
| **Total** | **~29 pts** |

---

### Resumen de prioridades

| HU | Título | Prioridad | Puntos | Asignado |
|----|--------|-----------|--------|----------|
| HU-01 | Migración: config Git en `projects` y campos rama en `tasks` | **P0** | 5 | Rubén González |
| HU-02 | Cliente GitHub server-side (`GITHUB_TOKEN`) | **P0** | 5 | Rubén González |
| HU-03 | Crear rama automática al crear tarea | **P0** | 8 | Rubén González |
| HU-04 | UI: sección Integración Git en editar proyecto | **P1** | 5 | José |
| HU-05 | UI: enlace clicable y copiar rama en detalle y tarjeta | **P1** | 5 | José |
| HU-06 | Reintentar creación de rama y degradación sin Git | **P2** | 3 | Sebastián |
| HU-07 | Documentación modelo Git y variables de entorno | **P2** | 2 | Sebastián |

---

## Historias de usuario

### HU-01 — Migración: config Git en `projects` y campos rama en `tasks`

**Como** equipo de desarrollo  
**Quiero** persistir la configuración Git por proyecto y el estado de la rama en cada tarea  
**Para** enlazar SynchroManage con un repositorio concreto  

**Criterios de aceptación:**
- Migración `supabase/migrations/010_git_integration.sql` con columnas definidas en [modelo-git.md](./modelo-git.md).
- Defaults: `git_development_branch = 'develop'`, `git_production_branch = 'main'`, `git_integration_enabled = false`.
- `GET/PUT /api/dashboard/projects/[id]` expone y actualiza campos Git (solo Admin/PM).
- `branch_name` existente no se rompe.

**Puntos:** 5  
**Prioridad:** P0 — Crítica  
**Asignado:** Rubén González

---

### HU-02 — Cliente GitHub server-side (`GITHUB_TOKEN`)

**Como** equipo de desarrollo  
**Quiero** un módulo interno para llamar a la API de GitHub  
**Para** centralizar autenticación y errores  

**Criterios de aceptación:**
- `src/lib/github/client.ts` (o similar) con funciones: `getBranchRef`, `createBranch`, `getRepo`.
- Lee `GITHUB_TOKEN` de entorno; nunca se expone al cliente.
- Manejo de errores: 401, 404, 409 (rama existe), 422.
- Tests unitarios con mocks de respuestas GitHub.

**Puntos:** 5  
**Prioridad:** P0 — Crítica  
**Asignado:** Rubén González  
**Depende de:** HU-01

---

### HU-03 — Crear rama automática al crear tarea

**Como** Developer  
**Quiero** que al crear una tarea se cree la rama en GitHub desde la rama de desarrollo  
**Para** no crear ramas a mano ni olvidar el nombre  

**Criterios de aceptación:**
- Tras `POST /api/dashboard/tasks` exitoso, si `project.git_integration_enabled`:
  1. Generar `branch_name` (lógica actual + `task_number`).
  2. Obtener SHA de `project.git_development_branch`.
  3. Crear `refs/heads/{branch_name}` en GitHub.
  4. Guardar `git_branch_url`, `git_branch_sha`, `git_branch_created_at`.
- Rama base = **`git_development_branch`**, nunca `git_production_branch`.
- Si integración desactivada: solo `branch_name` (comportamiento actual mejorado).
- Si GitHub falla: tarea creada igual; `git_branch_error` poblado.
- Si rama ya existe (409): enlazar URL existente sin error fatal.

**Puntos:** 8  
**Prioridad:** P0 — Crítica  
**Asignado:** Rubén González  
**Depende de:** HU-02

---

### HU-04 — UI: sección Integración Git en editar proyecto

**Como** PM  
**Quiero** configurar repo y ramas de desarrollo/producción en el proyecto  
**Para** que las tareas se enlacen al repositorio correcto  

**Criterios de aceptación:**
- Sección **Integración Git** en `EditProjectDialog` (y crear proyecto si aplica).
- Campos: activar integración, owner, repo, rama desarrollo, rama producción.
- Validación: owner/repo requeridos si integración activa.
- Texto de ayuda: «Las ramas de tarea se crean desde la rama de desarrollo».
- Preview URL: `github.com/{owner}/{repo}`.
- Solo Admin y PM pueden editar.

**Puntos:** 5  
**Prioridad:** P1 — Alta  
**Asignado:** José  
**Depende de:** HU-01

---

### HU-05 — UI: enlace clicable y copiar rama en detalle y tarjeta

**Como** Developer  
**Quiero** abrir la rama en GitHub con un clic y seguir pudiendo copiarla  
**Para** ir directo al código remoto  

**Criterios de aceptación:**
- En `TaskDetailDialog`, `TaskDetailDialogStandalone` y `TaskCard` (opcional compacto):
  - Si `git_branch_url`: enlace externo «Abrir en GitHub» + icono.
  - `CopyButton` mantiene copiar `branch_name`.
- Enlace abre nueva pestaña con `rel="noopener noreferrer"`.
- Si solo hay `branch_name` sin URL (sin Git): solo copiar, sin enlace roto.
- Estado visual si `git_branch_error`: tooltip con error.

**Puntos:** 5  
**Prioridad:** P1 — Alta  
**Asignado:** José  
**Depende de:** HU-03

---

### HU-06 — Reintentar creación de rama y degradación sin Git

**Como** PM  
**Quiero** reintentar crear la rama si falló y que proyectos sin Git sigan funcionando  
**Para** no bloquear la gestión de tareas  

**Criterios de aceptación:**
- `POST /api/dashboard/tasks/[id]/git-branch/retry` (solo si no hay `git_branch_url` o hay error).
- Botón **Crear rama en GitHub** / **Reintentar** en detalle de tarea.
- Proyecto sin config Git: sin botones de Git; flujo actual intacto.
- Logs server-side sin filtrar token.

**Puntos:** 3  
**Prioridad:** P2 — Media  
**Asignado:** Sebastián  
**Depende de:** HU-03

---

### HU-07 — Documentación modelo Git y variables de entorno

**Como** equipo  
**Quiero** documentar configuración y flujo de clone  
**Para** onboarding sin preguntar en Slack  

**Criterios de aceptación:**
- [modelo-git.md](./modelo-git.md) y README del CC al día.
- README raíz: sección breve «Integración Git» + variables `GITHUB_TOKEN`.
- Flujo: clonar → `develop` → fetch → checkout rama de tarea.

**Puntos:** 2  
**Prioridad:** P2 — Media  
**Asignado:** Sebastián  
**Depende de:** HU-04, HU-05

---

## Orden de ejecución

| Orden | HU | Responsable |
|-------|-----|-------------|
| 1 | HU-01 | Rubén González |
| 2 | HU-02 | Rubén González |
| 3 | HU-03 | Rubén González |
| 4 | HU-04 | José |
| 5 | HU-05 | José |
| 6 | HU-06 | Sebastián |
| 7 | HU-07 | Sebastián |

## Demo del sprint

1. Configurar proyecto SynchroManage → repo + `develop` + `main`.
2. Crear tarea → ver rama en GitHub creada desde `develop`.
3. Clic en rama en detalle → abre GitHub.
4. Proyecto sin Git → crear tarea sin error.
