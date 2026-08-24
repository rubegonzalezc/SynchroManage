# CC-22082026 — Conectar con Git

**Proyecto:** SynchroManage  
**Control de cambios:** CC-22082026  
**Fecha de apertura:** 22/08/2026  
**Versión objetivo del producto:** `0.3.0`  
**Equipo:** Rubén González, José, Sebastián  
**Estado:** Planificado (documentación actualizada)

## Épica

**Conectar con Git** — El dev crea la rama en GitHub con un botón desde la tarea; ve enlace, copia y estado del PR sin salir de SynchroManage.

## Contexto

- **GitHub Free** (sin coste adicional).
- **Token por usuario** (PAT u OAuth en perfil): la rama se crea con la identidad de quien pulsa **Crear rama**.
- **Config por proyecto**: repositorio + rama de desarrollo + rama de producción.
- Las ramas de tarea se bifurcan desde la **rama de desarrollo**, no desde producción.
- **No** se crea rama automáticamente al crear la tarea: solo nombre sugerido + botón manual.

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

1. Se genera o muestra `branch_name` (convención existente: `{categoría}/{slug}-{task_number}`).
2. **No** se llama a GitHub.
3. En el detalle aparece el nombre de rama + botón **Crear rama** (si aún no existe en remoto).

### Al pulsar «Crear rama»

1. El usuario debe tener **GitHub conectado** en su perfil (PAT).
2. El proyecto debe tener **integración Git** activa (repo + ramas).
3. La API crea `refs/heads/{branch_name}` en GitHub desde `git_development_branch` usando el **token del usuario**.
4. Se guarda `git_branch_url`, SHA y timestamp; el botón pasa a enlace **Abrir en GitHub**.

### En la UI de la tarea

| Estado | Qué se ve |
|--------|-----------|
| Rama sin crear en GitHub | `branch_name` + **Copiar** + botón **Crear rama** |
| Rama creada | `branch_name` clicable + **Copiar** + enlace GitHub |
| Sin Git en proyecto | Solo `branch_name` + **Copiar** (como hoy) |
| **PR** | Solo si hay PR de esa rama: **Abierto** / **Merged** |

### Configuración

| Dónde | Qué |
|-------|-----|
| **Proyecto** | Owner, repo, rama desarrollo, rama producción, activar integración |
| **Perfil usuario** | PAT de GitHub (cifrado), @username, conectar / desconectar |

Ver [modelo-git.md](./modelo-git.md).

---

## Flujo del desarrollador

```text
1. En Perfil → Conectar GitHub (PAT).
2. PM configura repo + develop + main en el proyecto.
3. Crear tarea → ver nombre de rama sugerido (ej. feature/login-58).
4. Abrir detalle → clic en «Crear rama».
5. En local:
     git fetch origin
     git checkout feature/login-58
6. Commits, push y PR hacia develop.
7. SynchroManage muestra PR · Abierto / Merged en la tarea.
```

---

## Alcance del CC

| Incluye | Excluye |
|---------|---------|
| Config Git por proyecto | Creación automática al crear tarea |
| Token GitHub por usuario (perfil) | Multi-organización GitHub |
| Botón **Crear rama** en detalle de tarea | GitLab / Bitbucket |
| Enlace + copiar rama | Crear PR desde SynchroManage |
| Campo PR (abierto / merged) | Auto-merge |
| Webhook PR (token sistema opcional) | |

**Coste:** $0.

---

## Sprints

| Sprint | Tema | Documento | Puntos |
|--------|------|-----------|--------|
| **1** | Repo, perfil GitHub y botón Crear rama | [sprint-01-ramas-y-repositorio.md](./sprint-01-ramas-y-repositorio.md) | ~32 pts |
| **2** | PR en tarea y sincronización | [sprint-02-pull-requests.md](./sprint-02-pull-requests.md) | ~24 pts |

**Total:** ~56 pts · **2 sprints**.

---

## Variables de entorno

```env
# Cifrado de PAT por usuario en DB
ENCRYPTION_KEY=...

# Solo Sprint 2 — webhook PR (no crea ramas)
GITHUB_WEBHOOK_SECRET=...
```

---

## Demo de cierre

1. Usuario conecta GitHub en perfil.
2. Proyecto con repo + `develop` + `main`.
3. Crear tarea → **Crear rama** → rama visible en GitHub.
4. PR abierto → **PR · Abierto** en tarea.
5. Merge → **PR · Merged**.

## Documentación relacionada

- [Modelo Git y ramas](./modelo-git.md)
- [Ramas por `#global`](../sprints/modelo-de-numeracion.md#ramas-git)
