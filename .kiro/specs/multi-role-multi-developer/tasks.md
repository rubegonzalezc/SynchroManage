# Plan de Implementación: Multi-Rol y Multi-Desarrollador

## Visión General

Implementación incremental que comienza con las migraciones de base de datos (usando Supabase MCP), luego actualiza los tipos TypeScript, crea los nuevos componentes UI, modifica las rutas API y finalmente actualiza los componentes existentes para soportar multi-rol y multi-asignado.

## Tareas

- [x] 1. Migración de base de datos via Supabase MCP
  - [x] 1.1 Crear tabla `user_roles` con columnas (id, user_id, role_id, created_at), restricción UNIQUE(user_id, role_id) e índice en user_id. Usar Supabase MCP para ejecutar la migración SQL.
    - _Requisitos: 5.1, 1.1_
  - [x] 1.2 Crear tabla `task_assignees` con columnas (id, task_id, user_id, assigned_at), restricción UNIQUE(task_id, user_id) e índices en task_id y user_id. Usar Supabase MCP para ejecutar la migración SQL.
    - _Requisitos: 5.2, 3.1_
  - [x] 1.3 Poblar `user_roles` desde `profiles.role_id` existente y `task_assignees` desde `tasks.assignee_id` existente. Usar Supabase MCP para ejecutar la migración de datos.
    - _Requisitos: 5.3, 5.4_
  - [x] 1.4 Habilitar RLS en ambas tablas y crear políticas: lectura para usuarios autenticados en ambas tablas, escritura solo admins en `user_roles`, escritura para admin/pm/tech_lead en `task_assignees`. Usar Supabase MCP.
    - _Requisitos: 5.1, 5.2_

- [x] 2. Actualizar tipos TypeScript y funciones utilitarias
  - [x] 2.1 Agregar en `src/lib/types/roles.ts`: interfaces `UserRole`, `ProfileWithRoles`, `TaskAssignee`, constante `ROLE_HIERARCHY`, funciones `getPrimaryRole` y `hasRole`. Mantener las interfaces existentes sin modificar.
    - _Requisitos: 1.4, 1.5_
  - [x] 2.2 Escribir test de propiedad para `getPrimaryRole`
    - **Propiedad 2: El rol primario es el de mayor jerarquía**
    - Para cualquier conjunto no vacío de roles válidos, `getPrimaryRole` debe retornar el rol con el índice más bajo en la jerarquía.
    - **Valida: Requisito 1.4**
  - [x] 2.3 Escribir test de propiedad para filtrado multi-rol con `hasRole`
    - **Propiedad 5: Filtrado de usuarios por rol incluye multi-rol**
    - Para cualquier rol objetivo y conjunto de usuarios, filtrar por ese rol debe retornar exactamente los usuarios que tienen ese rol entre sus roles.
    - **Valida: Requisitos 2.1, 2.2, 2.3, 2.4**

- [x] 3. Checkpoint - Verificar migración y tipos
  - Asegurar que las tablas se crearon correctamente, los datos se migraron y los tipos compilan sin errores. Preguntar al usuario si hay dudas.

- [x] 4. Crear nuevos componentes UI
  - [x] 4.1 Crear componente `MultiSelectDeveloper` en `src/components/ui/multi-select-developer.tsx`
    - Props: members, selectedIds, onSelectionChange, placeholder, disabled
    - Campo de búsqueda por nombre (case-insensitive), badges con botón remover, excluir seleccionados del dropdown, mensaje "No se encontraron usuarios" cuando no hay coincidencias
    - _Requisitos: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6_
  - [x] 4.2 Escribir test de propiedad para búsqueda case-insensitive del MultiSelectDeveloper
    - **Propiedad 9: Búsqueda case-insensitive en selector**
    - Para cualquier lista de usuarios y cadena de búsqueda, el filtro debe retornar exactamente los usuarios cuyo full_name contiene la cadena sin distinguir mayúsculas.
    - **Valida: Requisito 4.2**
  - [x] 4.3 Escribir test de propiedad para exclusión de seleccionados
    - **Propiedad 10: Exclusión de seleccionados en dropdown**
    - Para cualquier lista de miembros y subconjunto de IDs seleccionados, las opciones disponibles deben ser exactamente los miembros cuyo ID no está seleccionado.
    - **Valida: Requisito 4.4**
  - [x] 4.4 Crear componente `AvatarStack` en `src/components/ui/avatar-stack.tsx`
    - Props: assignees, maxVisible (default 3)
    - Mostrar hasta maxVisible avatares con superposición (-ml-2), indicador "+N" si hay más
    - _Requisitos: 6.1, 6.2_
  - [x] 4.5 Escribir test de propiedad para AvatarStack
    - **Propiedad 11: AvatarStack muestra indicador de exceso**
    - Para cualquier lista de N asignados y maxVisible M, debe renderizar min(N, M) avatares y mostrar "+{N-M}" si N > M.
    - **Valida: Requisitos 6.1, 6.2**

- [x] 5. Actualizar rutas API
  - [x] 5.1 Modificar `GET /api/dashboard/users` (`src/app/api/dashboard/users/route.ts`) para hacer JOIN con `user_roles` y `roles`, retornando `roles: string[]` (array de todos los roles) además del `role` existente
    - _Requisitos: 1.3, 2.1, 2.2, 2.3, 2.4_
  - [x] 5.2 Modificar `POST /api/dashboard/tasks` (`src/app/api/dashboard/tasks/route.ts`) para aceptar `assignee_ids: string[]`, insertar registros en `task_assignees`, mantener `assignee_id` sincronizado con el primer asignado, y deduplicar IDs. Soportar compatibilidad hacia atrás si se recibe `assignee_id` como string.
    - _Requisitos: 3.1, 3.2, 3.4, 5.5_
  - [x] 5.3 Modificar `PUT /api/dashboard/tasks/[id]` (`src/app/api/dashboard/tasks/[id]/route.ts`) para aceptar `assignee_ids: string[]`, sincronizar `task_assignees` (eliminar removidos, insertar nuevos), enviar notificaciones a nuevos asignados, registrar actividad de desasignación
    - _Requisitos: 3.3, 3.5, 3.7, 3.8_
  - [x] 5.4 Modificar `GET /api/dashboard/tasks/[id]` para retornar `assignees: Profile[]` haciendo JOIN con `task_assignees` y `profiles`
    - _Requisitos: 3.6_
  - [x] 5.5 Modificar `PATCH /api/dashboard/tasks` (drag & drop) para retornar `assignees` en lugar de `assignee` en la respuesta
    - _Requisitos: 3.6_
  - [x] 5.6 Modificar `GET /api/dashboard/my-tasks` (`src/app/api/dashboard/my-tasks/route.ts`) para consultar `task_assignees` en lugar de filtrar por `tasks.assignee_id`
    - _Requisitos: 3.6_
  - [x] 5.7 Escribir test de propiedad para sincronización de asignados al actualizar
    - **Propiedad 7: Sincronización de asignados al actualizar**
    - Para conjuntos A (actuales) y B (nuevos), después de sincronizar, task_assignees debe contener exactamente B. A∩B permanecen, A\B se eliminan, B\A se insertan.
    - **Valida: Requisito 3.3**

- [x] 6. Checkpoint - Verificar APIs
  - Asegurar que todas las rutas API funcionan correctamente con los nuevos campos. Ejecutar tests existentes. Preguntar al usuario si hay dudas.

- [x] 7. Actualizar componentes existentes
  - [x] 7.1 Actualizar `KanbanBoard` (`src/components/dashboard/projects/KanbanBoard.tsx`): cambiar interface `Task` para usar `assignees: { id: string; full_name: string; avatar_url: string | null }[]` en lugar de `assignee`
    - _Requisitos: 6.1_
  - [x] 7.2 Actualizar `TaskCard` (`src/components/dashboard/projects/TaskCard.tsx`): reemplazar sección de asignado único por componente `AvatarStack`, usar `task.assignees` en lugar de `task.assignee`
    - _Requisitos: 6.1, 6.2_
  - [x] 7.3 Actualizar `CreateTaskDialog` (`src/components/dashboard/projects/CreateTaskDialog.tsx`): reemplazar `<Select>` de asignado único por `<MultiSelectDeveloper>`, cambiar `formData.assignee_id` a `formData.assignee_ids: string[]`, filtrar miembros usando `u.roles?.includes('developer')` en lugar de `u.role?.name === 'developer'`
    - _Requisitos: 2.5, 3.4, 4.5_
  - [x] 7.4 Actualizar `TaskDetailDialog` (`src/components/dashboard/projects/TaskDetailDialog.tsx`): reemplazar `<Select>` de asignado único por `<MultiSelectDeveloper>`, cambiar a `assignee_ids: string[]`, mostrar lista completa de asignados con nombre y avatar
    - _Requisitos: 2.5, 3.5, 4.5, 6.3_
  - [x] 7.5 Actualizar `CreateProjectDialog` (`src/components/dashboard/projects/CreateProjectDialog.tsx`) y `EditProjectDialog` (`src/components/dashboard/projects/EditProjectDialog.tsx`): cambiar filtrado de usuarios de `u.role?.name === 'developer'` a `u.roles?.includes('developer')` para todos los selectores de rol (PM, Tech Lead, Desarrolladores, Stakeholders)
    - _Requisitos: 2.5_

- [x] 8. Integración y verificación final
  - [x] 8.1 Verificar compatibilidad hacia atrás: asegurar que `profiles.role_id` sigue sincronizado como rol primario y que `tasks.assignee_id` se mantiene como campo deprecado con el primer asignado
    - _Requisitos: 1.2, 1.6, 5.5, 5.6_
  - [x] 8.2 Escribir test de propiedad para creación de tarea con asignados
    - **Propiedad 6: Creación de tarea inserta asignados correctamente**
    - Para cualquier tarea con N IDs de asignados distintos, task_assignees debe contener exactamente N registros.
    - **Valida: Requisitos 3.1, 3.2**
  - [x] 8.3 Escribir test de propiedad para notificaciones a nuevos asignados
    - **Propiedad 8: Notificaciones a nuevos asignados**
    - Para cualquier actualización donde B difiere de A, se envía exactamente una notificación a cada usuario en B\A y ninguna a A∩B.
    - **Valida: Requisito 3.7**

- [x] 9. Checkpoint final - Verificar integración completa
  - Asegurar que todos los tests pasan, que la migración de datos es correcta, y que los componentes funcionan end-to-end. Preguntar al usuario si hay dudas.

## Notas

- Las tareas marcadas con `*` son opcionales y pueden omitirse para un MVP más rápido
- Cada tarea referencia requisitos específicos para trazabilidad
- Los checkpoints aseguran validación incremental
- Las migraciones de base de datos deben ejecutarse usando el Supabase MCP disponible
- Los campos `assignee_id` y `role_id` se mantienen como deprecados durante la transición
