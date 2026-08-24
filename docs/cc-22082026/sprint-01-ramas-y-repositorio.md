# Sprint 1 — Repositorio, perfil GitHub y botón Crear rama

**Control de cambios:** CC-22082026  
**Proyecto:** SynchroManage  
**Duración sugerida:** 2 semanas  
**Equipo:** 3 desarrolladores  
**Depende de:** Ningún sprint de CC-22082026

| Desarrollador | Perfil | Rol en el sprint |
|---------------|--------|------------------|
| **Rubén González** | Senior | Migración, cliente GitHub, API crear rama, cifrado PAT |
| **José** | Frontend | UI proyecto, perfil, botón Crear rama y enlaces |
| **Sebastián** | Fullstack | Pruebas, documentación, degradación |

## Objetivo del sprint

Que el dev **conecte su GitHub**, vea el nombre de rama en la tarea y la cree en remoto con **Crear rama** (desde `develop`), con enlace y copiar.

**Épica:** *Conectar con Git*

> **Importante:** la rama **no** se crea al crear la tarea. Solo al pulsar el botón.

---

## Capacidad estimada

| Desarrollador | Puntos asignados |
|---------------|------------------|
| Rubén González | ~15 pts |
| José | ~12 pts |
| Sebastián | ~5 pts |
| **Total** | **~32 pts** |

---

### Resumen de prioridades

| HU | Título | Prioridad | Puntos | Asignado |
|----|--------|-----------|--------|----------|
| HU-01 | Migración: Git en `projects`, `tasks` y `profiles` | **P0** | 5 | Rubén González |
| HU-02 | Conectar GitHub en perfil (PAT cifrado) | **P0** | 5 | Rubén González |
| HU-03 | Cliente GitHub con token del usuario | **P0** | 3 | Rubén González |
| HU-04 | `POST /api/dashboard/tasks/[id]/git-branch` | **P0** | 8 | Rubén González |
| HU-05 | UI: Integración Git en editar proyecto | **P1** | 5 | José |
| HU-06 | UI: botón **Crear rama**, copiar y abrir en GitHub | **P1** | 8 | José |
| HU-07 | Documentación y checklist onboarding Git | **P2** | 2 | Sebastián |

---

## Historias de usuario

### HU-01 — Migración: Git en `projects`, `tasks` y `profiles`

**Como** equipo de desarrollo  
**Quiero** columnas para config de repo, estado de rama y PAT de usuario  
**Para** soportar creación manual de ramas  

**Criterios de aceptación:**
- Migración `010_git_integration.sql` según [modelo-git.md](./modelo-git.md).
- `git_branch_created_by` en tasks (quién creó la rama).
- `branch_name` existente intacto.
- APIs de proyecto y perfil preparadas para nuevos campos.

**Puntos:** 5 · **P0** · Rubén González

---

### HU-02 — Conectar GitHub en perfil (PAT cifrado)

**Como** Developer  
**Quiero** guardar mi token de GitHub en mi perfil  
**Para** que al crear ramas queden a mi nombre en GitHub  

**Criterios de aceptación:**
- Sección **Integración GitHub** en `/profile`.
- Campos: PAT (password), opcional @username (o fetch vía API).
- `PUT /api/dashboard/me/github` guarda token cifrado; `DELETE` desconecta.
- Nunca devolver el token en GET; solo `github_connected: true` y `github_username`.
- Validar token con llamada ligera a GitHub (`GET /user`).
- Mensajes en español si token inválido o sin permisos en el repo.

**Puntos:** 5 · **P0** · Rubén González  
**Depende de:** HU-01

---

### HU-03 — Cliente GitHub con token del usuario

**Como** equipo de desarrollo  
**Quiero** un cliente que reciba el PAT desencriptado del usuario  
**Para** crear ramas con su identidad  

**Criterios de aceptación:**
- `src/lib/github/client.ts`: `createBranch({ token, owner, repo, branch, fromRef })`.
- Errores mapeados: 401 → reconectar perfil, 404 → repo/rama base, 409 → rama existe.
- Tests con mocks.

**Puntos:** 3 · **P0** · Rubén González  
**Depende de:** HU-02

---

### HU-04 — `POST /api/dashboard/tasks/[id]/git-branch`

**Como** Developer  
**Quiero** crear la rama en GitHub desde la tarea  
**Para** empezar a codear sin usar la terminal para `git branch`  

**Criterios de aceptación:**
- `POST /api/dashboard/tasks/[id]/git-branch` (idempotente si ya existe URL).
- Requisitos: usuario con PAT, proyecto con `git_integration_enabled`, `branch_name` definido.
- Crea ref desde `git_development_branch` con token del **usuario autenticado**.
- Guarda `git_branch_url`, `git_branch_sha`, `git_branch_created_at`, `git_branch_created_by`.
- Si 409 (rama existe): guardar URL y no fallar.
- Permisos: mismos que crear/editar tarea en el proyecto.
- **No** modificar `POST /api/dashboard/tasks` (sin creación automática).

**Puntos:** 8 · **P0** · Rubén González  
**Depende de:** HU-03

---

### HU-05 — UI: Integración Git en editar proyecto

**Como** PM  
**Quiero** configurar repo y ramas develop/main  
**Para** habilitar el botón Crear rama en las tareas del proyecto  

**Criterios de aceptación:**
- Sección en `EditProjectDialog`: activar, owner, repo, develop, main.
- Ayuda: «El dev crea la rama con el botón en cada tarea».
- Solo Admin/PM editan.

**Puntos:** 5 · **P1** · José  
**Depende de:** HU-01

---

### HU-06 — UI: botón **Crear rama**, copiar y abrir en GitHub

**Como** Developer  
**Quiero** ver el nombre de rama y un botón Crear rama en el detalle  
**Para** crear la rama cuando empiece a trabajar  

**Criterios de aceptación:**
- En `TaskDetailDialog` y `TaskDetailDialogStandalone`, junto a `branch_name`:
  - **Copiar** (existente).
  - **Crear rama** si no hay `git_branch_url` y proyecto con Git activo.
  - **Abrir en GitHub** si ya existe `git_branch_url`.
- Sin PAT: botón deshabilitado + link a Perfil.
- Loading y toast éxito/error.
- Tras éxito, actualizar UI sin recargar página.
- Opcional compacto en `TaskCard`: icono rama si ya creada.

**Puntos:** 8 · **P1** · José  
**Depende de:** HU-04, HU-05

---

### HU-07 — Documentación y checklist onboarding Git

**Como** equipo  
**Quiero** docs del flujo perfil → Crear rama → clone  
**Para** onboarding  

**Criterios de aceptación:**
- README CC y [modelo-git.md](./modelo-git.md) al día.
- README raíz: sección Integración Git (sin creación automática).

**Puntos:** 2 · **P2** · Sebastián

---

## Orden de ejecución

| Orden | HU | Responsable |
|-------|-----|-------------|
| 1 | HU-01 | Rubén González |
| 2 | HU-02 | Rubén González |
| 3 | HU-03 | Rubén González |
| 4 | HU-04 | Rubén González |
| 5 | HU-05 | José |
| 6 | HU-06 | José |
| 7 | HU-07 | Sebastián |

## Demo del sprint

1. Conectar GitHub en perfil.
2. Configurar proyecto → repo + `develop`.
3. Crear tarea → **no** hay rama en GitHub aún.
4. Detalle → **Crear rama** → rama en GitHub + enlace.
5. Usuario sin PAT → mensaje claro, tarea OK.
