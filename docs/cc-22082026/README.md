# CC-22082026 — Conectar con Git

**Proyecto:** SynchroManage  
**Control de cambios:** CC-22082026  
**Fecha de apertura:** 22/08/2026  
**Versión objetivo del producto:** `0.3.0`  
**Equipo:** Rubén González, José, Sebastián  
**Estado:** Planificado (solo documentación)

## Épica

**Conectar con Git** — Al crear una tarea, la rama existe en GitHub; el equipo ve enlace, copia y estado del PR sin salir de SynchroManage.

## Contexto

- Una sola cuenta/organización de **GitHub Free** (sin coste adicional).
- Token o GitHub App a nivel **sistema** (variables de entorno), no por usuario.
- Cada **proyecto** de SynchroManage se enlaza a **un repositorio** y define ramas de desarrollo y producción.
- Las ramas de tarea se crean desde la **rama de desarrollo**, no desde producción.

## Relación con otros CC

| CC | Épica | Versión | Orden |
|----|-------|---------|-------|
| [CC-21082026](../cc-21082026/) | Operar sin fricción | `0.2.0` | En paralelo |
| [CC-23082026](../cc-23082026/) | Migrar a Better Auth | `0.2.5` | **Obligatorio antes de este CC** |
| **CC-22082026** | Conectar con Git | `0.3.0` | Después de CC-23082026 |

**Dependencia bloqueante:** [CC-23082026](../cc-23082026/) debe cerrarse antes de iniciar CC-22082026. La autenticación GitHub por usuario (OAuth o PAT) se implementa sobre Better Auth, no sobre Supabase Auth.

**Dependencia recomendada:** CC-21082026 Sprint 1 estable (flujo de crear tarea sin regresiones).

---

## Visión funcional

### Al crear una tarea

1. Se genera `branch_name` (convención existente: `{categoría}/{slug}-{task_number}`).
2. Si el proyecto tiene Git configurado, la API crea la rama en GitHub **desde `git_development_branch`**.
3. Se guarda en la tarea: `branch_name`, URL de la rama, SHA opcional, timestamp.
4. Si Git falla: la tarea **sí se crea**; se muestra aviso y opción de reintentar.

### En la UI de la tarea

| Elemento | Comportamiento |
|----------|----------------|
| **Rama** | Texto clicable → abre la rama en GitHub. Botón copiar (ya existe, se mantiene). |
| **PR** | Solo visible si hay PR asociado a esa rama. Muestra estado: **Abierto** / **Merged** (y **Cerrado** sin merge si aplica). Si no hay PR, no se muestra la fila. |

### Configuración por proyecto

> **No en la descripción libre del proyecto.** Campos dedicados en editar proyecto (o sección «Integración Git»), para validación, API y permisos.

| Campo | Ejemplo | Uso |
|-------|---------|-----|
| `git_repo_owner` | `rubegonzalezc` | Owner del repo |
| `git_repo_name` | `SynchroManage` | Nombre del repo |
| `git_development_branch` | `develop` | Base al **crear** ramas de tarea |
| `git_production_branch` | `main` | Referencia documental / futuros flujos de release |
| `git_integration_enabled` | `true` | Activar creación automática de ramas |

URL derivada: `https://github.com/{owner}/{repo}/tree/{branch_name}`

Ver detalle en [modelo-git.md](./modelo-git.md).

---

## Flujo del desarrollador (clone y trabajo)

```text
1. Clonar el repo una vez (desde GitHub).
2. Checkout local de la rama de desarrollo:
     git fetch origin
     git checkout develop && git pull
3. Al crear la tarea en SynchroManage → la rama feature/... ya existe en origin.
4. En local:
     git fetch origin
     git checkout feature/mi-tarea-58
5. Commits, push y PR hacia develop (convención del equipo en GitHub).
6. SynchroManage muestra el PR y su estado en la tarea.
```

Las ramas de tarea **nunca** se ramifican desde `main`/`production`; siempre desde **desarrollo**.

---

## Alcance del CC

| Incluye | Excluye |
|---------|---------|
| Config Git por proyecto (repo + ramas dev/prod) | Multi-cuenta GitHub |
| Creación automática de rama al crear tarea | GitLab / Bitbucket (fase 2) |
| Enlace clicable + copiar rama | Crear el PR desde SynchroManage |
| Campo PR con estado (abierto / merged) | Auto-merge |
| Webhook GitHub `pull_request` | GitHub Enterprise de pago |
| Reintento manual si falla la creación de rama | Ramas en múltiples repos por tarea |

**Coste:** $0 (GitHub Free + API + webhook).

---

## Sprints

| Sprint | Tema | Documento | Puntos |
|--------|------|-----------|--------|
| **1** | Repo, ramas automáticas y enlaces | [sprint-01-ramas-y-repositorio.md](./sprint-01-ramas-y-repositorio.md) | ~29 pts |
| **2** | PR en tarea y sincronización | [sprint-02-pull-requests.md](./sprint-02-pull-requests.md) | ~24 pts |

**Total estimado:** ~53 pts · **2 sprints**.

---

## Variables de entorno (sistema)

```env
# Cuenta única GitHub (PAT fine-grained o classic)
GITHUB_TOKEN=ghp_...
# Opcional: secret para validar webhooks
GITHUB_WEBHOOK_SECRET=...
```

Permisos mínimos del token: `contents:read/write`, `pull_requests:read` (repo scope).

---

## Definition of Done (global)

- Probado con repo real de SynchroManage en GitHub Free.
- Proyecto sin Git configurado: crear tarea funciona sin rama remota (degradación elegante).
- Mensajes en español.
- Documentación en README y [modelo-git.md](./modelo-git.md).
- Sin exponer `GITHUB_TOKEN` al cliente.

---

## Demo de cierre (CC completo)

1. Configurar proyecto con repo + `develop` + `main`.
2. Crear tarea → ver rama en GitHub y enlace en detalle.
3. Abrir PR en GitHub desde esa rama → en SynchroManage aparece **PR · Abierto**.
4. Merge del PR → estado **Merged** en la tarea.
5. Tarea sin PR → columna PR vacía / oculta.

## Documentación relacionada

- [Modelo Git y ramas](./modelo-git.md)
- [Ramas por `#global`](../sprints/modelo-de-numeracion.md#ramas-git) (convención de nombres existente)
