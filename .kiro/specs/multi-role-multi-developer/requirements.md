# Documento de Requisitos: Multi-Rol y Multi-Desarrollador

## Introducción

Esta funcionalidad extiende el sistema actual de gestión de proyectos para soportar dos cambios principales: (1) los usuarios pueden tener múltiples roles simultáneamente, donde el rol de mayor nivel jerárquico determina los permisos pero el usuario aparece en todos los selectores correspondientes a sus roles, y (2) las tareas pueden asignarse a múltiples desarrolladores en lugar de uno solo, con un selector que permite búsqueda por nombre.

## Glosario

- **Sistema**: La aplicación de gestión de proyectos construida con Next.js y Supabase.
- **Usuario**: Persona registrada en el sistema con un perfil en la tabla `profiles`.
- **Rol**: Función asignada a un usuario (admin, pm, tech_lead, developer, stakeholder).
- **Rol_Primario**: El rol de mayor nivel jerárquico entre los roles asignados a un usuario. La jerarquía es: admin > pm > tech_lead > developer > stakeholder.
- **Tabla_Roles_Usuario**: Tabla de unión `user_roles` que relaciona usuarios con múltiples roles.
- **Selector_De_Rol**: Componente de interfaz que lista usuarios filtrados por un rol específico (ej: selector de desarrolladores, selector de PMs).
- **Selector_Multi_Desarrollador**: Componente de selección múltiple con búsqueda para asignar desarrolladores a tareas.
- **Tabla_Asignados_Tarea**: Tabla de unión `task_assignees` que relaciona tareas con múltiples usuarios asignados.
- **Tarea**: Unidad de trabajo dentro de un proyecto, almacenada en la tabla `tasks`.
- **Miembro**: Usuario asignado a un proyecto a través de la tabla `project_members`.

## Requisitos

### Requisito 1: Soporte de múltiples roles por usuario

**Historia de Usuario:** Como administrador, quiero asignar múltiples roles a un usuario, para que un mismo usuario pueda actuar como PM, desarrollador u otros roles simultáneamente.

#### Criterios de Aceptación

1. THE Sistema SHALL almacenar la relación entre usuarios y roles en la Tabla_Roles_Usuario, permitiendo múltiples registros por usuario.
2. THE Sistema SHALL mantener compatibilidad con el campo `role_id` existente en `profiles`, utilizándolo como Rol_Primario del usuario.
3. WHEN se consultan los roles de un usuario, THE Sistema SHALL retornar todos los roles asignados en la Tabla_Roles_Usuario.
4. WHEN un usuario tiene múltiples roles, THE Sistema SHALL determinar el Rol_Primario como el rol de mayor nivel en la jerarquía (admin > pm > tech_lead > developer > stakeholder).
5. THE Sistema SHALL utilizar el Rol_Primario para evaluar los permisos del usuario en el objeto PERMISSIONS.
6. IF un usuario no tiene registros en la Tabla_Roles_Usuario, THEN THE Sistema SHALL utilizar el `role_id` de `profiles` como único rol del usuario.

### Requisito 2: Usuarios visibles en selectores según todos sus roles

**Historia de Usuario:** Como PM, quiero que al seleccionar un desarrollador para una tarea, aparezcan todos los usuarios que tengan el rol de desarrollador entre sus roles (incluso si también son admin o PM), para no perder opciones de asignación.

#### Criterios de Aceptación

1. WHEN el Selector_De_Rol filtra usuarios por el rol "developer", THE Sistema SHALL incluir a todos los usuarios que tengan "developer" entre sus roles en la Tabla_Roles_Usuario.
2. WHEN el Selector_De_Rol filtra usuarios por el rol "pm", THE Sistema SHALL incluir a todos los usuarios que tengan "pm" entre sus roles en la Tabla_Roles_Usuario.
3. WHEN el Selector_De_Rol filtra usuarios por el rol "tech_lead", THE Sistema SHALL incluir a todos los usuarios que tengan "tech_lead" entre sus roles en la Tabla_Roles_Usuario.
4. WHEN el Selector_De_Rol filtra usuarios por el rol "stakeholder", THE Sistema SHALL incluir a todos los usuarios que tengan "stakeholder" entre sus roles en la Tabla_Roles_Usuario.
5. THE Sistema SHALL aplicar esta lógica de filtrado multi-rol en todos los selectores existentes: CreateProjectDialog (PM, Tech Lead, Desarrolladores, Stakeholders), CreateTaskDialog (Asignado) y TaskDetailDialog (Asignado).

### Requisito 3: Asignación múltiple de desarrolladores a tareas

**Historia de Usuario:** Como PM, quiero asignar múltiples desarrolladores a una misma tarea, para reflejar que varias personas colaboran en una tarea.

#### Criterios de Aceptación

1. THE Sistema SHALL almacenar las asignaciones de tareas en la Tabla_Asignados_Tarea, permitiendo múltiples usuarios por tarea.
2. WHEN se crea una tarea con múltiples asignados, THE Sistema SHALL insertar un registro en la Tabla_Asignados_Tarea por cada usuario asignado.
3. WHEN se actualiza la lista de asignados de una tarea, THE Sistema SHALL sincronizar la Tabla_Asignados_Tarea eliminando los registros removidos e insertando los nuevos.
4. THE API de creación de tareas (POST /api/dashboard/tasks) SHALL aceptar un arreglo de IDs de usuarios en lugar de un único `assignee_id`.
5. THE API de actualización de tareas (PUT /api/dashboard/tasks/[id]) SHALL aceptar un arreglo de IDs de usuarios para actualizar los asignados.
6. THE API de consulta de tareas (GET /api/dashboard/tasks/[id]) SHALL retornar la lista completa de asignados con sus datos de perfil (id, full_name, avatar_url).
7. WHEN se asignan nuevos desarrolladores a una tarea, THE Sistema SHALL enviar una notificación a cada nuevo asignado informando de la asignación.
8. WHEN se remueve un asignado de una tarea, THE Sistema SHALL registrar la actividad de desasignación en el log de actividad.

### Requisito 4: Selector multi-desarrollador con búsqueda

**Historia de Usuario:** Como PM, quiero buscar desarrolladores por nombre en el selector de asignación de tareas, para encontrar rápidamente al desarrollador que necesito cuando hay muchos usuarios.

#### Criterios de Aceptación

1. THE Selector_Multi_Desarrollador SHALL mostrar un campo de texto para filtrar usuarios por nombre.
2. WHEN el usuario escribe en el campo de búsqueda, THE Selector_Multi_Desarrollador SHALL filtrar la lista de usuarios mostrando solo aquellos cuyo nombre contenga el texto ingresado, sin distinguir mayúsculas de minúsculas.
3. THE Selector_Multi_Desarrollador SHALL permitir seleccionar múltiples usuarios mostrando cada selección como una etiqueta (badge) con opción de remover.
4. THE Selector_Multi_Desarrollador SHALL excluir de la lista desplegable a los usuarios que ya están seleccionados.
5. THE Selector_Multi_Desarrollador SHALL utilizarse en CreateTaskDialog y TaskDetailDialog para el campo de asignados.
6. WHEN no hay resultados que coincidan con la búsqueda, THE Selector_Multi_Desarrollador SHALL mostrar un mensaje indicando que no se encontraron usuarios.

### Requisito 5: Migración de datos existentes

**Historia de Usuario:** Como administrador, quiero que los datos existentes de roles y asignaciones se migren correctamente al nuevo esquema, para no perder información.

#### Criterios de Aceptación

1. WHEN se ejecuta la migración, THE Sistema SHALL crear la Tabla_Roles_Usuario con las columnas user_id (FK a profiles), role_id (FK a roles) y una restricción de unicidad en (user_id, role_id).
2. WHEN se ejecuta la migración, THE Sistema SHALL crear la Tabla_Asignados_Tarea con las columnas task_id (FK a tasks), user_id (FK a profiles) y una restricción de unicidad en (task_id, user_id).
3. WHEN se ejecuta la migración, THE Sistema SHALL poblar la Tabla_Roles_Usuario con un registro por cada usuario existente usando su `role_id` actual de `profiles`.
4. WHEN se ejecuta la migración, THE Sistema SHALL poblar la Tabla_Asignados_Tarea con un registro por cada tarea que tenga `assignee_id` no nulo.
5. THE Sistema SHALL mantener el campo `assignee_id` en la tabla `tasks` como deprecado durante un período de transición, sin eliminar la columna.
6. THE Sistema SHALL mantener el campo `role_id` en la tabla `profiles` sincronizado con el Rol_Primario del usuario.

### Requisito 6: Visualización de asignados múltiples en la interfaz

**Historia de Usuario:** Como miembro del equipo, quiero ver todos los desarrolladores asignados a una tarea en las vistas de tablero y lista, para saber quiénes están trabajando en cada tarea.

#### Criterios de Aceptación

1. THE Sistema SHALL mostrar los avatares de todos los asignados en las tarjetas de tarea del tablero Kanban, apilados con superposición cuando hay más de un asignado.
2. WHEN una tarea tiene más de 3 asignados, THE Sistema SHALL mostrar los primeros 3 avatares y un indicador numérico con la cantidad restante (ej: "+2").
3. THE Sistema SHALL mostrar la lista completa de asignados con nombre y avatar en el TaskDetailDialog.
