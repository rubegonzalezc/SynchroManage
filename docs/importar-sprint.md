# Importar un sprint desde JSON

Sirve para crear un sprint y sus tareas de una vez, sin registrarlas a mano. El admin o el PM pega el JSON en el proyecto (**Importar plan**), revisa la vista previa y confirma.

La descripción se guarda como texto y se ve igual que en el detalle de la tarea: saltos de línea, **negrita** (`**texto**` o `__texto__`) y *cursiva* (`*texto*` o `_texto_`). Los títulos `#`, los enlaces y los bloques de código se muestran como texto literal.

## Cómo pedirle el JSON a una IA

Copia el bloque de abajo, completa el objetivo del sprint y pégalo en el chat. La respuesta debe ser solo el JSON, sin explicación alrededor, para poder pegarlo en SynchroManage.

```text
Genera un plan de sprint para SynchroManage en el JSON que te describo.
Responde únicamente con el JSON, sin markdown alrededor.

Reglas:
- Un solo sprint y sus tareas.
- Asigna solo personas de la lista. Usa el nombre completo. Si el nombre de pila se repite, no lo abrevies.
- No inventes campos. No uses "points": la complejidad es "complexity", un entero de 1 a 10.
- "key" identifica la tarea dentro del archivo (HU-01, HU-02). "sprint_order" es el número visible de la HU y debe coincidir con ese orden, sin repetirse.
- "depends_on" solo puede citar claves de este mismo JSON.
- "description" es texto con saltos de línea, **negrita** y *cursiva*. No uses HTML.
- "category": task, feature, hotfix, fix, improvement, refactor, docs, test, chore.
- "priority": low, medium, high, urgent.
- "status" de la tarea: backlog, todo, in_progress, review, done. En un sprint nuevo usa "todo" o "backlog".
- "status" del sprint: planning, salvo que te pidan otro.
- Fechas en YYYY-MM-DD. end_date posterior a start_date.
- "auto_branch": true en tareas de código. No inventes branch_name.
- No incluyas bugs, comentarios ni reuniones.
- No asignes trabajo real a "Ruben Prueba": es una cuenta de prueba.

Personas disponibles:
- Gustavo Verdugo, pm, maxyverdugo@gmail.com
- José Huerta, admin, josem.huertab@gmail.com
- Nicolás Vega, admin, cnicolasvegac@gmail.com
- Ruben Gonzalez, admin, ra.gonzalez.c@hotmail.com
- Sebastián Mardones, admin, sebas_m@outlook.cl
- Ruben Prueba, pm, r.gonzalez.ca85@gmail.com (solo pruebas)

Proyecto: SynchroManage
Objetivo del sprint: [escribe aquí qué hay que construir]
Fecha de inicio: [YYYY-MM-DD]
Fecha de fin: [YYYY-MM-DD]
```

La lista sale de `profiles` al 6 de noviembre de 2026. En la pantalla **Importar plan** se muestran las personas actuales del sistema. Si alguien nuevo entra al equipo, usa esos nombres y no esta lista fija.

## Dónde se usa

1. Abre el proyecto.
2. En la barra de sprints, pulsa **Importar plan** (solo admin o PM).
3. Pega el JSON. La descripción de la tarea seleccionada se previsualiza con negrita y cursiva.
4. **Vista previa** no escribe nada. Muestra si el sprint es nuevo o si ya existía, y qué tareas se crearían.
5. **Aplicar** crea el sprint y las tareas que no existan.

Si el sprint ya tiene el mismo nombre, se reutiliza. No se modifican sus fechas. Una tarea con el mismo título dentro de ese sprint se omite, para poder pegar el JSON otra vez sin duplicar.

La importación no envía correos de asignación.

## Formato

```json
{
  "project": "SynchroManage",
  "sprint": {
    "name": "Sprint 1 — Fundamentos",
    "goal": "Dejar el login funcionando",
    "start_date": "2026-11-09",
    "end_date": "2026-11-20",
    "status": "planning"
  },
  "tasks": []
}
```

| Campo del sprint | Obligatorio | Notas |
|---|---|---|
| `name` | sí | Si ya existe en el proyecto, se reutiliza |
| `start_date`, `end_date` | sí | `YYYY-MM-DD`, fin posterior al inicio |
| `goal` | no | Texto corto |
| `status` | no | `planning` (default), `active`, `completed` |

| Campo de la tarea | Obligatorio | Notas |
|---|---|---|
| `key` | sí | Única en el archivo. Ejemplo: `HU-01` |
| `title` | sí | |
| `description` | no | Texto con markdown inline. Se guarda tal cual |
| `category` | no | Default `task` |
| `priority` | no | Default `medium` |
| `status` | no | Default `backlog` |
| `complexity` | no | Entero de 1 a 10. No existe `points` |
| `sprint_order` | no | Entero positivo, único en el plan. Es el número de la HU. Si lo omites, se usa el siguiente libre |
| `assignees` | no | Lista de nombres completos o emails |
| `reviewer` | no | Un nombre completo o email |
| `due_date` | no | `YYYY-MM-DD` |
| `depends_on` | no | Lista de `key` del mismo JSON |
| `auto_branch` | no | `true` genera `{categoría}/{slug}-{número}` |
| `branch_name` | no | Si viene, no se autogenera la rama |

El sistema asigna `task_number`, la posición en el tablero y el orden del sprint entre los demás sprints. No los escribas en el JSON.

## Ejemplo

```json
{
  "project": "SynchroManage",
  "sprint": {
    "name": "Sprint 1 — Fundamentos",
    "goal": "Login y sesión listos para el equipo",
    "start_date": "2026-11-09",
    "end_date": "2026-11-20",
    "status": "planning"
  },
  "tasks": [
    {
      "key": "HU-01",
      "title": "Instalar Better Auth y tablas",
      "description": "**Objetivo**\nDejar Better Auth como única sesión.\n\n**Alcance**\n- Tablas `user`, `session` y `account`\n- Login con email y contraseña\n\n*Fuera de este paso:* invitaciones y GitHub.",
      "category": "feature",
      "priority": "high",
      "status": "todo",
      "complexity": 8,
      "sprint_order": 1,
      "assignees": ["Ruben Gonzalez"],
      "reviewer": "Sebastián Mardones",
      "due_date": "2026-11-13",
      "depends_on": [],
      "auto_branch": true
    },
    {
      "key": "HU-02",
      "title": "Migrar el middleware de sesión",
      "description": "**Objetivo**\nProteger las rutas del dashboard con la sesión nueva.\n\nDepende de que **HU-01** ya tenga las tablas.",
      "category": "feature",
      "priority": "high",
      "status": "todo",
      "complexity": 5,
      "sprint_order": 2,
      "assignees": ["José Huerta"],
      "reviewer": "Nicolás Vega",
      "due_date": "2026-11-18",
      "depends_on": ["HU-01"],
      "auto_branch": true
    }
  ]
}
```

En el detalle, la primera descripción se lee así:

**Objetivo**  
Dejar Better Auth como única sesión.

**Alcance**  
- Tablas `user`, `session` y `account`  
- Login con email y contraseña

*Fuera de este paso:* invitaciones y GitHub.

## API

`GET /api/dashboard/projects/{id}/import`  
Devuelve el nombre del proyecto, las personas actuales y una plantilla.

`POST /api/dashboard/projects/{id}/import`

```json
{ "plan": { }, "dry_run": true }
```

`dry_run` vale `true` si no se envía. Con `false` se escribe en la base. La respuesta trae `errors`, `warnings`, `people` y `preview`. Cada tarea del preview dice `create` o `skip`.

Errores habituales que la IA debe corregir antes de volver a pegar el JSON:

- Una persona que no está en la lista, o el nombre «Ruben» sin apellido.
- `points` en lugar de `complexity`.
- `depends_on` apuntando a una clave que no está en el archivo.
- Dos tareas con el mismo `sprint_order`.
- `end_date` anterior o igual a `start_date`.
