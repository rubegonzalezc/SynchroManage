# Sprint 1 — Seguridad y plan de ida y vuelta

**Control de cambios:** CC-07112026  
**Proyecto:** SynchroManage  
**Duración sugerida:** 2 semanas  
**Equipo:** 3 desarrolladores  
**Depende de:** el importador de sprint ya en `main` ([importar-sprint.md](../importar-sprint.md))

| Desarrollador | Perfil | Rol en el sprint |
|---------------|--------|------------------|
| **Rubén González** | Senior | Funciones sensibles, reimportación que actualiza, revisión |
| **José** | Frontend | Descargar el plan, vista previa de lo que va a cambiar |
| **Sebastián** | Fullstack | RLS de categorías, políticas abiertas, pruebas de roles |

## Objetivo del sprint

Dejar la base cerrada en los puntos que el asesor de Supabase ya marcó, y que el JSON del sprint sirva para corregir un plan, no solo para crearlo la primera vez.

**Épica:** *Base sólida*

---

## Definition of Done (DoD)

- Los cambios de SQL se probaron con los roles `anon`, `authenticated` (developer) y un admin o PM.
- Las pantallas de proyecto, Kanban y Mis Tareas siguen cargando.
- Mensajes en español.
- `tsc` sin errores y los tests del importador en verde.
- Revisión de código entre pares.

---

## Capacidad estimada

| Desarrollador | Puntos asignados |
|---------------|------------------|
| Rubén González | ~13 pts |
| José | ~8 pts |
| Sebastián | ~8 pts |
| **Total** | **~29 pts** |

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
| HU-01 | RLS en `task_categories` | **P0** | 3 | Sebastián |
| HU-02 | Quitar ejecución pública de funciones sensibles | **P0** | 5 | Rubén González |
| HU-03 | Cerrar políticas abiertas de sprints, bugs y perfiles | **P1** | 5 | Sebastián |
| HU-04 | Descargar el sprint como JSON | **P0** | 5 | José |
| HU-05 | Reimportar actualiza la tarea, no la duplica | **P0** | 8 | Rubén González |
| HU-06 | Bugs dentro del mismo JSON | **P3** | 5 | José |

El núcleo del sprint son HU-01 a HU-05 (~29 pts). HU-06 solo entra si el núcleo ya está cerrado.

---

## Historias de usuario

### HU-01 — RLS en `task_categories`

**Como** responsable del producto  
**Quiero** que las categorías de tarea no estén abiertas en la API pública  
**Para** que nadie con la anon key las borre o las cambie  

**Criterios de aceptación:**

- `ALTER TABLE public.task_categories ENABLE ROW LEVEL SECURITY`.
- `authenticated` puede hacer `SELECT`.
- Solo un admin puede insertar, actualizar o borrar. El resto de la app sigue leyendo categorías por la API con `service_role`.
- Un cliente con la anon key, sin sesión, no recibe filas.
- La migración está en `supabase/migrations/` y aplicada al proyecto `njkweyaifgqyyosungju`.

**Hecho cuando:** el aviso `rls_disabled_in_public` de `task_categories` desaparece y el selector de categoría del formulario de tarea sigue funcionando.

---

### HU-02 — Quitar ejecución pública de funciones sensibles

**Como** responsable del producto  
**Quiero** que `anon` no pueda ejecutar funciones de autorización  
**Para** que no se consulten por `/rest/v1/rpc` sin sesión  

**Criterios de aceptación:**

- `REVOKE EXECUTE` a `anon` y `PUBLIC` sobre `public.is_admin()`, `public.get_user_role()` y `public.handle_new_user()`.
- `is_admin()` y `get_user_role()` siguen ejecutables por `authenticated`, porque las políticas RLS las llaman. Si una política deja de funcionar, se documenta y se corrige en la misma HU.
- `handle_new_user()` solo la dispara el trigger. No queda llamable por `anon` ni por `authenticated`.
- Se fija `search_path` en esas tres funciones.
- Se anota en el PR el aviso de contraseñas filtradas de Supabase Auth: el login ya es Better Auth. No se reactiva Supabase Auth para “cumplir” ese aviso.

**Hecho cuando:** `GET /rest/v1/rpc/is_admin` sin JWT responde 401 o permiso denegado, y un PM autenticado sigue pasando las políticas que usan `is_admin()`.

---

### HU-03 — Cerrar políticas abiertas de sprints, bugs y perfiles

**Como** PM  
**Quiero** que el acceso directo a la base respete el mismo criterio que la aplicación  
**Para** que un usuario autenticado no lea ni borre sprints y bugs de proyectos ajenos  

**Criterios de aceptación:**

- Sprints: el `SELECT` deja de ser `true` para todos. Un miembro del proyecto, su PM, su tech lead o un admin puede verlos. Insertar, editar y borrar queda en admin y PM del proyecto.
- Bugs: se quita el `ALL` con `true` para cualquier `authenticated`. Misma idea de membresía que las tareas.
- `profiles`: se elimina la política pública «Allow rut lookup for login». El login ya no busca por RUT.
- Las rutas API que usan `service_role` no cambian de comportamiento.
- Prueba manual mínima: developer ve el sprint de su proyecto y no el de otro; stakeholder no administra sprints.

**Hecho cuando:** esas tres políticas ya no autorizan “cualquier fila” y el recorrido de proyecto no regresiona.

---

### HU-04 — Descargar el sprint como JSON

**Como** PM  
**Quiero** bajar el sprint al mismo JSON que uso para importar  
**Para** corregirlo con una IA y volver a pegarlo  

**Criterios de aceptación:**

- `GET /api/dashboard/projects/{id}/sprints/{sprintId}/plan` devuelve el objeto descrito en [importar-sprint.md](../importar-sprint.md).
- Incluye `description` tal como está guardada, con saltos de línea, `**negrita**` y `*cursiva*`.
- Asignados y revisor salen con `full_name`.
- `depends_on` usa la `key` del plan. Si la tarea todavía no tiene clave, se genera `HU-{sprint_order}` o `T-{task_number}`.
- En la barra del sprint hay **Descargar plan**. El archivo se llama con el nombre del sprint.
- Solo admin o PM. La respuesta no incluye tokens ni correos si no hacen falta para reimportar; el email puede ir solo cuando dos personas comparten nombre de pila.

**Hecho cuando:** el JSON descargado pasa `prepareSprintPlan` sin errores usando las personas del proyecto.

---

### HU-05 — Reimportar actualiza la tarea, no la duplica

**Como** PM  
**Quiero** que al pegar de nuevo el plan se actualicen las tareas que ya cargué  
**Para** corregir descripción, asignados y orden sin borrar el sprint a mano  

**Criterios de aceptación:**

- Migración: `tasks.plan_key` (texto, único por sprint, nullable en tareas viejas).
- La primera importación guarda `plan_key` con la `key` del JSON.
- Al reimportar, la tarea se reconoce por `plan_key` dentro del sprint. El título deja de ser la clave.
- Si la tarea existe, se actualizan: título, descripción, categoría, prioridad, estado, complejidad, orden, fecha límite, asignados, revisor, dependencias y rama solo si venía vacía.
- No se tocan comentarios, bugs, adjuntos ni `task_number`.
- La vista previa dice **actualizar** o **crear**, y muestra el título nuevo si cambió.
- No se envían correos en la reimportación.
- Dos tareas del mismo sprint no pueden quedar con el mismo `sprint_order`. Si el JSON lo pide, la vista previa lo rechaza.

**Hecho cuando:** cambiar la descripción en el JSON, volver a importar y abrir la tarea muestra el markdown nuevo, y el conteo de tareas del sprint no sube.

---

### HU-06 — Bugs dentro del mismo JSON (stretch)

**Como** PM  
**Quiero** cargar también los bugs del sprint en el mismo archivo  
**Para** no registrarlos uno a uno después del plan  

**Criterios de aceptación:**

- El JSON acepta `bugs[]` opcional: `key`, `title`, `description`, `steps_to_reproduce`, `severity` (`low`, `medium`, `high`, `critical`), `task` (clave de la tarea), `assignee`.
- Sin `bugs`, el importador actual sigue igual.
- Reimportar un bug con la misma `key` lo actualiza.
- Queda fuera de este sprint si HU-04 o HU-05 no están cerradas.

---

## Orden de trabajo

1. HU-01 y HU-02 primero. Son chicas y no dependen de la UI.
2. HU-04 en paralelo: descargar no cambia datos.
3. HU-05 cuando HU-04 ya devuelve `plan_key`, para que el archivo de ida y el de vuelta coincidan.
4. HU-03 con prueba de roles al final del sprint, cuando el SQL de seguridad ya está junto.
5. HU-06 solo si sobra el sprint.

## Riesgos

| Riesgo | Qué hacer |
|--------|-----------|
| Revocar `EXECUTE` rompe una política | Probar un `SELECT` de tareas como developer antes de dar la HU por cerrada |
| RLS de bugs esconde bugs que la pantalla leía con el cliente | La pantalla usa la API con `service_role`; verificar igual el detalle de un bug |
| Tareas ya importadas no tienen `plan_key` | La primera descarga les asigna `HU-{sprint_order}` y la siguiente importación las graba |

## Demo del sprint

1. Mostrar que sin sesión no se listan categorías ni se llama `is_admin()`.
2. Entrar como developer y abrir un proyecto propio.
3. Descargar el sprint, cambiar una descripción con `**negrita**` y volver a importar.
4. Abrir la tarea y ver el texto actualizado, una sola vez.
