# Modelo de numeración: `#global` vs `HU-N`

Guía para desarrolladores de **SynchroManage**. Resume qué identificador usar en bugs, ramas Git, dependencias y conversación con el equipo.

---

## Resumen en 30 segundos

| Concepto | Qué es | Cuándo usarlo |
|----------|--------|---------------|
| **`#global`** | Número único del proyecto (`task_number`) | Bugs, ramas Git, referencias permanentes, tickets externos |
| **`HU-N`** | Orden local dentro de un sprint (`sprint_order`) | Daily, planificación del sprint, prioridad relativa |
| **`Sprint X · HU-N`** | Etiqueta compuesta en UI | Hablar de una historia sin ambigüedad entre sprints |

> **Regla de oro:** nunca uses solo `HU-3` sin el sprint — en otro sprint también puede existir un `HU-3`.

---

## `#global` (`task_number`)

- Entero **único por proyecto**, asignado al crear la tarea (1, 2, 3…).
- **No cambia** al mover la tarea entre sprints, reordenar `HU-N` ni hacer carry-over.
- En UI se muestra como `#58`, `#12`, etc.
- En API y base de datos: columna `tasks.task_number`.

**Usar `#global` para:**

- Título de bugs vinculados a una tarea.
- Ramas Git autogeneradas: `{categoria}/{slug}-{task_number}` (ej. `feature/login-oauth-58`).
- Comentarios en PR, Slack o Jira que deben seguir siendo válidos después del sprint.
- Dependencias cuando necesitas un identificador estable (la API guarda UUIDs; en UI se muestra `#global` + título).

---

## `HU-N` (`sprint_order`)

- Entero **local al sprint** (1, 2, 3…). Mismo número puede repetirse en **otro** sprint.
- Solo tiene valor si la tarea tiene `sprint_id` asignado. Sin sprint → `sprint_order = null`.
- Se autoasigna al crear o mover una tarea a un sprint (`MAX + 1` en ese sprint).
- Se puede reordenar en la vista lista (HU-07) sin tocar `#global`.
- En UI la etiqueta es `HU-N` (ej. `HU-3` = tercera historia del sprint).
- En API y base de datos: columna `tasks.sprint_order`.

**Usar `HU-N` para:**

- Orden de prioridad dentro del sprint actual.
- Daily standup: *"Hoy cierro la HU-2 del Sprint 4"*.
- Filtros del selector de dependencias (buscar por `HU-3` **después** de elegir sprint).

**No usar `HU-N` para:**

- Nombre de rama (usa `#global`).
- Referencias que deban sobrevivir al cierre del sprint.

### Etiqueta en pantalla

La UI compone:

```text
Sprint 4 · HU-3
#58  Implementar login OAuth
```

- `Sprint 4` viene del `order_index` del sprint (+1), no del nombre descriptivo en BD.
- Si hay carry-over, puede aparecer además `Sprint anterior HU-2` (`carry_over_sprint_order`).

---

## Tabla de campos y tablas

| Campo / tabla | Tipo | Alcance | Nullable | Relación | Migración / notas |
|---------------|------|---------|----------|----------|-------------------|
| **`task_number`** | `INTEGER` | Proyecto (global) | Sí* | Columna en `tasks` | Existente desde el inicio del producto. Identificador estable `#N`. |
| **`sprint_order`** | `INTEGER` | Sprint (local) | Sí | Columna en `tasks` | Migración `008_add_sprint_order_to_tasks.sql`. Null si `sprint_id` es null. Índice único parcial `(sprint_id, sprint_order)` cuando ambos no son null. |
| **`sprint_id`** | `UUID` | Sprint asignado | Sí | FK → `sprints.id` | Sin sprint = backlog. Trigger `sync_task_sprint_order`: si `sprint_id` pasa a null, `sprint_order` pasa a null. |
| **`carry_over_sprint_order`** | `INTEGER` | Solo informativo | Sí | Columna en `tasks` | Migración `009_carry_over_sprint_order.sql`. Guarda la HU del sprint de origen al arrastrar tarea incompleta. |
| **`depends_on_task_id`** | `UUID` | Una dependencia (legacy) | Sí | FK → `tasks.id` | Migración `006_add_depends_on_to_tasks.sql`. **Compatibilidad:** sigue existiendo; se sincroniza con la primera fila de `task_dependencies`. Preferir `depends_on_task_ids` en API nueva. |
| **`task_dependencies`** | Tabla N:M | Varias dependencias | — | `(task_id, depends_on_task_id)` | Migración `007_task_dependencies.sql`. PK compuesta. Copia automática de `depends_on_task_id` existente. Trigger mantiene `depends_on_task_id` = primera dependencia por `created_at`. |

\*En la práctica casi todas las tareas tienen `task_number`; puede ser null en datos antiguos o errores de migración.

### Convención API (snake_case)

| JSON / API | Columna BD |
|------------|------------|
| `task_number` | `tasks.task_number` |
| `sprint_order` | `tasks.sprint_order` |
| `sprint_id` | `tasks.sprint_id` |
| `depends_on_task_id` | `tasks.depends_on_task_id` (una sola; legacy) |
| `depends_on_task_ids` | Array de UUIDs → filas en `task_dependencies` |
| `dependencies` | Objetos enriquecidos en GET (`id`, `task_number`, `title`, `status`, …) |

---

## Dependencias entre tareas

### Modelo actual (Sprint 1 + Sprint 2)

1. **`task_dependencies`** — fuente de verdad para **varias** dependencias por tarea.
2. **`depends_on_task_id`** — columna legacy; la API la actualiza para no romper clientes antiguos. Contiene el UUID de la **primera** dependencia (orden `created_at`).

### Reglas de bloqueo

Una tarea **no puede** pasar a `in_progress`, `review` o `done` si **alguna** dependencia tiene `status !== 'done'`.

- Aplica en `PUT /api/dashboard/tasks/[id]` y `PATCH /api/dashboard/tasks` (Kanban).
- Mensaje típico: *"No puedes avanzar esta tarea hasta completar #56 Login API y #57 Validación email"*.

### Cómo referenciar dependencias

| Contexto | Recomendado | Evitar |
|----------|-------------|--------|
| Selector al crear/editar | Filtrar sprint → elegir tarea (`Sprint 1 · HU-3 · Título`) | Escribir solo `HU-3` |
| Bug / PR / commit | `#58` + título | Solo `HU-3` |
| Código / API | UUID en `depends_on_task_ids` | `sprint_order` numérico (no es FK) |

---

## Ejemplos

### Ejemplo 1 — Misma sprint, orden local

Proyecto **Portal**, Sprint 2 (`order_index = 1` → se muestra como **Sprint 2**):

| `#global` | `sprint_order` | Título |
|-----------|----------------|--------|
| #56 | 1 (HU-1) | Modelo de datos |
| #57 | 2 (HU-2) | API login |
| #58 | 3 (HU-3) | Pantalla login |

- Reordenar HU-2 y HU-3 en la vista lista solo intercambia `sprint_order` (2 ↔ 3). Los `#56`, `#57`, `#58` **no cambian**.

---

### Ejemplo 2 — Dependencia cross-sprint

La tarea **#58** (Sprint 2 · HU-3) depende de **#42** (Sprint 1 · HU-5):

```json
{
  "id": "uuid-58",
  "task_number": 58,
  "sprint_id": "uuid-sprint-2",
  "sprint_order": 3,
  "depends_on_task_ids": ["uuid-42"],
  "dependencies": [
    {
      "id": "uuid-42",
      "task_number": 42,
      "title": "Migración usuarios",
      "status": "done"
    }
  ]
}
```

- Es válido: las dependencias pueden cruzar sprints (mismo proyecto).
- En el selector: filtro **Sprint 1** → buscar `#42` o `HU-5` → seleccionar.
- Bloqueo: si #42 no está `done`, #58 no avanza de `todo` a `in_progress`.

**Cómo hablarlo en el equipo:**

- ✅ *"#58 bloqueada por #42 (Sprint 1 · HU-5)"*
- ❌ *"HU-3 depende de HU-5"* (ambiguo entre sprints)

---

### Ejemplo 3 — Múltiples dependencias

**#60** (Sprint 3 · HU-1) requiere **#56** y **#57** completadas:

```json
{
  "depends_on_task_ids": ["uuid-56", "uuid-57"],
  "dependencies": [
    { "id": "uuid-56", "task_number": 56, "title": "Modelo de datos", "status": "done" },
    { "id": "uuid-57", "task_number": 57, "title": "API login", "status": "in_progress" }
  ]
}
```

- POST/PUT envían el array completo; la API reemplaza las filas en `task_dependencies`.
- Bloqueo: mientras #57 no esté `done`, #60 no avanza (aunque #56 ya esté hecha).
- Badge Kanban: *"Bloqueada · 2 tareas"* o lista de pendientes en tooltip.

**Migración desde una sola dependencia:**

Antes (solo columna legacy):

```sql
-- tasks.depends_on_task_id = uuid-56
```

Después (migración 007):

```sql
INSERT INTO task_dependencies (task_id, depends_on_task_id)
VALUES ('uuid-60', 'uuid-56');

-- tasks.depends_on_task_id sigue = uuid-56 (primera dependencia)
```

Al añadir #57 vía API:

```json
{ "depends_on_task_ids": ["uuid-56", "uuid-57"] }
```

→ dos filas en `task_dependencies`; `depends_on_task_id` = `uuid-56` (la más antigua).

---

## Ramas Git

Las ramas autogeneradas usan **`task_number`**, no `sprint_order`:

```text
feature/login-oauth-58
       ↑ categoría/slug-#global
```

Si renumeras HU-N dentro del sprint, **no renombres** la rama: sigue ligada al `#58`.

---

## Archivos de referencia

| Tema | Ubicación |
|------|-----------|
| Migración `sprint_order` | `supabase/migrations/008_add_sprint_order_to_tasks.sql` |
| Carry-over | `supabase/migrations/009_carry_over_sprint_order.sql` |
| Dependencia simple | `supabase/migrations/006_add_depends_on_to_tasks.sql` |
| Dependencias múltiples | `supabase/migrations/007_task_dependencies.sql` |
| Etiquetas `Sprint · HU-N` | `src/lib/utils/task-sprint-order.ts` |
| Selector sprint → tarea | `src/lib/utils/sprint-task-select.ts` |
| Validación / bloqueo | `src/lib/utils/task-dependency.ts` |
| Planificación sprint 2 | [sprint-02-organizacion-por-sprint.md](./sprint-02-organizacion-por-sprint.md) |

---

## Checklist para nuevos desarrolladores

- [ ] En bugs y PRs cito `#global`, no solo `HU-N`.
- [ ] En daily uso `Sprint X · HU-N` cuando hable del orden local.
- [ ] Al configurar dependencias, filtro por sprint antes de buscar `HU-N`.
- [ ] Envío `depends_on_task_ids` (array), no asumo que basta `depends_on_task_id`.
- [ ] Sé que reordenar en vista lista cambia `sprint_order`, no `task_number`.
