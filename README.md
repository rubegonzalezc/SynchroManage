# SynchroManage

Gestor de proyectos informáticos construido con Next.js y Supabase.

## Tecnologías

- **Next.js 16** - Framework React con App Router
- **React 19** - Biblioteca de UI
- **TypeScript** - Tipado estático
- **Tailwind CSS 4** - Estilos utilitarios
- **shadcn/ui** - Componentes de UI
- **Supabase** - Backend as a Service (Auth, Database, RLS, Realtime, Edge Functions)
- **dnd-kit** - Drag and drop para tablero Kanban
- **Lucide React** - Iconos
- **date-fns** - Manejo de fechas con locale español

## Características

### Autenticación y Usuarios

- Autenticación con Supabase Auth
- Sistema de invitación de usuarios por email
- Redirección automática según rol
- 5 roles con permisos diferenciados
- Animación de carga en fotos de perfil

### Sistema de Roles

| Rol | Acceso | Permisos |
| --- | --- | --- |
| **Admin** | Todo el sistema | Control total, gestión de usuarios, empresas, configuración |
| **PM** | Dashboard, Proyectos, Usuarios, Empresas | Crear/editar proyectos, asignar tareas, gestionar equipos |
| **Tech Lead** | Dashboard, Proyectos asignados | Editar proyectos, crear tareas, mover tareas en Kanban |
| **Developer** | Dashboard, Proyectos asignados, Mis Tareas | Ver proyectos, mover tareas propias, comentar |
| **Stakeholder** | Dashboard, Proyectos asignados | Vista simplificada de progreso, comunicación con PM |

### Dashboard por Rol

- **Admin/PM**: Proyectos activos, tareas pendientes, tareas urgentes, actividad reciente, reuniones próximas
- **Tech Lead**: Proyectos asignados, tareas en revisión, tareas completadas, reuniones próximas
- **Developer**: Mis tareas pendientes, mis tareas completadas, mis proyectos, reuniones próximas
- **Stakeholder**: Mis proyectos, progreso promedio (%)

### Gestión de Proyectos

- Tablero Kanban con drag & drop
- Sincronización en tiempo real entre usuarios
- 5 columnas: Backlog, Por Hacer, En Progreso, En Revisión, Completado
- Numeración automática de tareas (#1, #2, etc.)
- Asignación de PM, Tech Lead, Developers y Stakeholders
- Prioridades: Baja, Media, Alta, Urgente
- Fechas límite con indicador de vencimiento
- Notificaciones automáticas al asignar miembros
- DatePicker con calendario en español

### Categorización de Tareas

Las tareas pueden categorizarse para mejor organización:

| Categoría | Icono | Color | Uso |
| --- | --- | --- | --- |
| Tarea | 📋 | Gris | Tareas generales |
| Bug | 🐛 | Rojo | Errores a corregir |
| Feature | ✨ | Púrpura | Nuevas funcionalidades |
| Hotfix | 🔥 | Naranja | Correcciones urgentes |
| Fix | 🔧 | Amarillo | Correcciones menores |
| Mejora | 📈 | Cyan | Mejoras de código existente |
| Refactor | ♻️ | Teal | Refactorización |
| Docs | 📝 | Azul | Documentación |
| Test | 🧪 | Rosa | Tests y pruebas |
| Chore | 🔨 | Gris oscuro | Tareas de mantenimiento |

### Mis Tareas (/my-tasks)

Sección dedicada para gestionar tareas personales:

- Vista dividida: Lista de tareas (izquierda) + Calendario (derecha)
- Estadísticas: Pendientes, Completadas, Vencidas
- Filtros por estado y búsqueda
- Calendario mensual con indicadores de tareas y reuniones
- Selección de día para ver actividades (tareas y reuniones) del día
- Botón rápido para agendar reunión en el día seleccionado
- Al crear reunión desde el calendario, la fecha se pre-selecciona automáticamente
- Detalle de tarea con edición y comentarios
- Responsive: Toggle entre lista y calendario en móvil

### Sistema de Reuniones

Funcionalidad completa para agendar y gestionar reuniones:

- Crear reuniones con título, descripción, fecha/hora
- Asociar reuniones a proyectos (opcional)
- Invitar participantes del equipo
- Link de reunión (Google Meet, Zoom, etc.)
- Notificaciones automáticas a invitados
- Creador se confirma automáticamente como asistente
- Editar reunión (solo organizador) con notificación a participantes
- Eliminar reunión con notificación de cancelación a participantes

**Respuestas de asistencia:**
- ✅ Presencial
- 📹 Virtual
- ❓ No sé
- ❌ No asistiré

**Visualización:**
- Calendario con indicadores de reuniones
- Lista de próximas reuniones en el dashboard
- Detalle de reunión con participantes y sus respuestas
- Notificación al organizador cuando alguien responde

### Vista de Stakeholder

Los stakeholders tienen una vista simplificada del proyecto:

- Información del proyecto (empresa, fechas, estado)
- Barra de progreso visual con porcentaje
- Contacto directo del PM (nombre y email)
- Sección de mensajes privados con el PM
- Sin acceso al Kanban ni detalles técnicos

Cuando no hay tareas definidas, se muestra un mensaje indicando que el proyecto está en fase de planificación.

### Sistema de Comentarios

**Comentarios Generales (Equipo)**

- Comentarios en proyectos y tareas
- Sistema de menciones con `@NombreUsuario`
- Autocompletado de usuarios al escribir `@`
- Menciones resaltadas (azul para otros, amarillo para ti)
- Actualización en tiempo real

**Mensajes de Stakeholder (Privados)**

- Canal de comunicación privado entre stakeholder y PM
- Separados de los comentarios del equipo técnico
- Notificaciones automáticas bidireccionales:
  - Al PM cuando el stakeholder escribe
  - Al stakeholder cuando el PM responde
- Sección colapsable para PM/Admin en la vista del proyecto

### Notificaciones

- Notificaciones al ser mencionado en comentarios
- Notificaciones al ser asignado a una tarea
- Notificaciones al ser asignado a un proyecto
- Notificaciones de mensajes de stakeholder (bidireccionales)
- Notificaciones de invitación a reunión
- Notificaciones de respuesta a reunión
- Notificaciones de reunión actualizada
- Notificaciones de reunión cancelada
- **Notificaciones de tareas próximas a vencer** (automáticas diarias)
- Contador de notificaciones no leídas
- Actualización en tiempo real via WebSocket
- Auto-eliminación después de 15 días

### Notificaciones de Vencimiento de Tareas

Sistema automático que notifica sobre tareas próximas a vencer:

- Edge Function ejecutada diariamente a las 8:00 AM
- Notifica al asignado: "La tarea #X vence mañana"
- Notifica al PM: "La tarea #X en 'Proyecto' vence mañana"
- Evita duplicados del mismo día
- Endpoint manual para administradores: `POST /api/dashboard/check-due-tasks`

### Archivos Adjuntos

Sistema de archivos adjuntos para tareas y proyectos:

- Subir archivos arrastrando o seleccionando
- Tipos permitidos: Imágenes (JPG, PNG, GIF, WebP, SVG), PDF, Word (DOC, DOCX), Excel (XLS, XLSX)
- Límite de 10MB por archivo
- Vista previa de imágenes en grid con thumbnails
- Vista previa de PDF en iframe integrado
- Descarga directa de cualquier archivo
- Eliminar archivos (autor, admin o PM)
- Disponible en detalle de tareas y en la vista del proyecto

### Modo Oscuro

- Toggle de tema en el sidebar
- Persistencia en localStorage
- Soporte completo en todos los componentes
- Colores semánticos con variables CSS

### Empresas

- CRUD completo de empresas
- Formateo automático de RUT chileno
- Asociación con proyectos y stakeholders

## Arquitectura de Carpetas

```text
src/
├── app/
│   ├── dashboard/              # Panel principal
│   │   ├── layout.tsx
│   │   ├── page.tsx            # Dashboard con métricas por rol
│   │   ├── users/              # Gestión de usuarios
│   │   ├── companies/          # Gestión de empresas
│   │   └── settings/           # Configuración del sistema
│   ├── projects/               # Gestión de proyectos
│   │   ├── layout.tsx
│   │   ├── page.tsx            # Lista de proyectos
│   │   └── [id]/page.tsx       # Detalle + Kanban
│   ├── my-tasks/               # Mis tareas y reuniones
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── profile/                # Perfil de usuario
│   ├── api/dashboard/          # API Routes
│   │   ├── me/
│   │   ├── users/
│   │   ├── companies/
│   │   ├── projects/
│   │   ├── tasks/
│   │   ├── my-tasks/
│   │   ├── meetings/
│   │   ├── attachments/
│   │   ├── comments/
│   │   ├── notifications/
│   │   ├── activity/
│   │   ├── check-due-tasks/
│   │   └── settings/
│   ├── auth/
│   │   ├── callback/
│   │   └── set-password/
│   └── login/
│
├── components/
│   ├── dashboard/
│   │   ├── DashboardSidebar.tsx
│   │   ├── DashboardLayoutClient.tsx
│   │   ├── NotificationsDropdown.tsx
│   │   ├── UpcomingMeetings.tsx
│   │   ├── users/
│   │   ├── companies/
│   │   ├── tasks/
│   │   │   ├── TaskDetailDialogStandalone.tsx
│   │   │   └── MyTasksClient.tsx
│   │   └── projects/
│   │       ├── ProjectsTableClient.tsx
│   │       ├── ProjectDetailClient.tsx
│   │       ├── KanbanBoard.tsx
│   │       ├── KanbanColumn.tsx
│   │       ├── TaskCard.tsx
│   │       ├── TaskDetailDialog.tsx
│   │       ├── CreateProjectDialog.tsx
│   │       ├── EditProjectDialog.tsx
│   │       ├── DeleteProjectDialog.tsx
│   │       ├── CreateTaskDialog.tsx
│   │       ├── ProjectComments.tsx
│   │       ├── ProjectActivity.tsx
│   │       ├── StakeholderComments.tsx
│   │       └── StakeholderMessagesForPM.tsx
│   ├── my-tasks/
│   │   ├── MyTasksClient.tsx
│   │   ├── TasksList.tsx
│   │   ├── TasksCalendar.tsx
│   │   ├── CreateMeetingDialog.tsx
│   │   └── MeetingDetailDialog.tsx
│   ├── ui/                     # Componentes shadcn/ui
│   │   ├── avatar.tsx          # Con animación de carga
│   │   ├── date-picker.tsx     # DatePicker en español
│   │   ├── calendar.tsx
│   │   ├── file-attachments.tsx # Archivos adjuntos con preview
│   │   ├── mention-input.tsx   # Input con menciones @
│   │   └── ...
│   ├── theme-provider.tsx
│   └── theme-toggle.tsx
│
├── lib/
│   ├── supabase/
│   │   ├── client.ts
│   │   ├── server.ts
│   │   └── middleware.ts
│   ├── hooks/
│   │   └── useRole.ts
│   ├── types/
│   │   └── roles.ts
│   └── utils/
│       ├── formatRut.ts
│       ├── permissions.ts
│       └── activity.ts
│
└── middleware.ts
```

## Base de Datos (Supabase)

### Tablas Principales

#### roles

| Campo | Tipo | Descripción |
| --- | --- | --- |
| id | serial | PK |
| name | text | admin, pm, tech_lead, developer, stakeholder |
| description | text | Descripción del rol |

#### profiles

| Campo | Tipo | Descripción |
| --- | --- | --- |
| id | uuid | PK, FK → auth.users |
| email | text | Email del usuario |
| full_name | text | Nombre completo |
| avatar_url | text | URL del avatar |
| role_id | int | FK → roles |
| company_id | uuid | FK → companies (para stakeholders) |

#### companies

| Campo | Tipo | Descripción |
| --- | --- | --- |
| id | uuid | PK |
| name | text | Nombre de la empresa |
| rut | text | RUT formateado (único) |
| email | text | Email de contacto |
| phone | text | Teléfono |
| address | text | Dirección |
| is_active | boolean | Estado |

#### projects

| Campo | Tipo | Descripción |
| --- | --- | --- |
| id | uuid | PK |
| name | text | Nombre del proyecto |
| description | text | Descripción |
| company_id | uuid | FK → companies |
| pm_id | uuid | FK → profiles |
| tech_lead_id | uuid | FK → profiles |
| status | text | planning, in_progress, paused, completed, cancelled |
| start_date | date | Fecha de inicio |
| end_date | date | Fecha de fin |

#### project_members

| Campo | Tipo | Descripción |
| --- | --- | --- |
| id | uuid | PK |
| project_id | uuid | FK → projects |
| user_id | uuid | FK → profiles |
| role | text | developer, stakeholder |

#### tasks

| Campo | Tipo | Descripción |
| --- | --- | --- |
| id | uuid | PK |
| project_id | uuid | FK → projects |
| task_number | int | Número secuencial (#1, #2...) |
| title | text | Título |
| description | text | Descripción |
| status | text | backlog, todo, in_progress, review, done |
| priority | text | low, medium, high, urgent |
| category | text | task, bug, feature, hotfix, fix, improvement, refactor, docs, test, chore |
| assignee_id | uuid | FK → profiles |
| due_date | date | Fecha límite |
| position | int | Posición en Kanban |

#### comments

| Campo | Tipo | Descripción |
| --- | --- | --- |
| id | uuid | PK |
| content | text | Contenido (soporta @menciones) |
| user_id | uuid | FK → profiles |
| project_id | uuid | FK → projects |
| task_id | uuid | FK → tasks |
| is_stakeholder_message | boolean | True si es mensaje privado stakeholder-PM |

#### notifications

| Campo | Tipo | Descripción |
| --- | --- | --- |
| id | uuid | PK |
| user_id | uuid | FK → profiles (destinatario) |
| from_user_id | uuid | FK → profiles (origen) |
| type | text | mention, task_assigned, project_assigned, stakeholder_comment, meeting_invite, meeting_response, meeting_updated, meeting_cancelled, task_due_soon |
| title | text | Título |
| message | text | Mensaje |
| link | text | URL del recurso |
| read | boolean | Si fue leída |
| meeting_id | uuid | FK → meetings (opcional) |
| task_id | uuid | FK → tasks (opcional) |
| project_id | uuid | FK → projects (opcional) |

#### attachments

| Campo | Tipo | Descripción |
| --- | --- | --- |
| id | uuid | PK |
| task_id | uuid | FK → tasks (opcional) |
| project_id | uuid | FK → projects (opcional) |
| uploaded_by_id | uuid | FK → profiles |
| file_name | text | Nombre original del archivo |
| file_size | bigint | Tamaño en bytes |
| file_type | text | MIME type del archivo |
| file_url | text | URL pública del archivo |
| storage_path | text | Ruta en Supabase Storage |
| created_at | timestamptz | Fecha de subida |

#### meetings

| Campo | Tipo | Descripción |
| --- | --- | --- |
| id | uuid | PK |
| title | text | Título de la reunión |
| description | text | Descripción |
| project_id | uuid | FK → projects (opcional) |
| organizer_id | uuid | FK → profiles |
| start_time | timestamptz | Fecha/hora inicio |
| end_time | timestamptz | Fecha/hora fin |
| meeting_link | text | URL de la reunión |

#### meeting_attendees

| Campo | Tipo | Descripción |
| --- | --- | --- |
| id | uuid | PK |
| meeting_id | uuid | FK → meetings |
| user_id | uuid | FK → profiles |
| response | text | pending, in_person, virtual, declined, maybe |
| responded_at | timestamptz | Fecha de respuesta |

#### activity_log

| Campo | Tipo | Descripción |
| --- | --- | --- |
| id | uuid | PK |
| user_id | uuid | FK → profiles |
| action | text | created, updated, deleted, assigned, status_changed |
| entity_type | text | project, task, user, company |
| entity_id | uuid | ID de la entidad |
| entity_name | text | Nombre para mostrar |
| details | jsonb | Detalles adicionales (project_id, etc.) |

### Supabase Realtime

Tablas con Realtime habilitado:

- `notifications` - Notificaciones instantáneas
- `comments` - Comentarios en tiempo real
- `tasks` - Sincronización del Kanban
- `activity_log` - Historial de actividad

### Supabase Edge Functions

- `task-due-notifications` - Verifica tareas próximas a vencer y envía notificaciones (cron diario 8:00 AM)

### Storage

Bucket `uploads` para archivos:

- `profiles/{user_id}/` - Fotos de perfil
- `attachments/tasks/{task_id}/` - Archivos adjuntos de tareas
- `attachments/projects/{project_id}/` - Archivos adjuntos de proyectos

## API Routes

| Ruta | Método | Descripción |
| --- | --- | --- |
| `/api/dashboard/me` | GET | Usuario actual con rol |
| `/api/dashboard/users` | GET | Lista usuarios |
| `/api/dashboard/invite-user` | POST | Invitar usuario |
| `/api/dashboard/delete-user` | DELETE | Eliminar usuario |
| `/api/dashboard/companies` | GET, POST | CRUD empresas |
| `/api/dashboard/companies/[id]` | PUT, DELETE | Empresa específica |
| `/api/dashboard/projects` | GET, POST | CRUD proyectos (filtrado por rol) |
| `/api/dashboard/projects/[id]` | GET, PUT, DELETE | Proyecto específico |
| `/api/dashboard/projects/[id]/comments` | GET | Comentarios (filtrado para stakeholder) |
| `/api/dashboard/tasks` | POST, PATCH | Crear/mover tareas |
| `/api/dashboard/tasks/[id]` | GET, PUT, DELETE | Tarea específica |
| `/api/dashboard/my-tasks` | GET | Tareas asignadas al usuario |
| `/api/dashboard/meetings` | GET, POST | Listar/crear reuniones |
| `/api/dashboard/meetings/[id]` | GET, PUT, DELETE | Reunión específica, editar, responder asistencia, eliminar |
| `/api/dashboard/attachments` | GET | Listar archivos adjuntos (por task_id o project_id) |
| `/api/dashboard/attachments/upload` | POST | Subir archivo adjunto |
| `/api/dashboard/attachments/[id]` | DELETE | Eliminar archivo adjunto |
| `/api/dashboard/comments` | POST | Crear comentario |
| `/api/dashboard/comments/[id]` | DELETE | Eliminar comentario |
| `/api/dashboard/notifications` | GET, POST, PATCH | Notificaciones |
| `/api/dashboard/activity` | GET, POST | Actividad del sistema |
| `/api/dashboard/check-due-tasks` | POST | Verificar tareas por vencer (admin) |
| `/api/dashboard/settings` | GET, PUT | Configuración |

## Configuración

### Variables de Entorno

```env
NEXT_PUBLIC_SUPABASE_URL=tu_url_de_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Instalación

```bash
npm install
npm run dev
```

## Permisos por Rol

### Admin

- ✅ Dashboard completo
- ✅ Gestión de usuarios
- ✅ Gestión de empresas
- ✅ Todos los proyectos
- ✅ Crear/editar/eliminar proyectos
- ✅ Crear/editar/eliminar tareas
- ✅ Configuración del sistema
- ✅ Ver mensajes de stakeholders
- ✅ Mis Tareas y Reuniones

### PM (Project Manager)

- ✅ Dashboard completo
- ✅ Ver usuarios
- ✅ Gestión de empresas
- ✅ Todos los proyectos
- ✅ Crear/editar proyectos
- ✅ Crear/editar tareas
- ❌ Eliminar proyectos
- ❌ Configuración del sistema
- ✅ Ver mensajes de stakeholders
- ✅ Mis Tareas y Reuniones

### Tech Lead

- ✅ Dashboard (proyectos asignados)
- ❌ Gestión de usuarios
- ❌ Gestión de empresas
- ✅ Proyectos donde es tech_lead o miembro
- ✅ Editar proyectos asignados
- ✅ Crear tareas
- ✅ Mover tareas en Kanban
- ❌ Crear/eliminar proyectos
- ✅ Mis Tareas y Reuniones

### Developer

- ✅ Dashboard (mis tareas)
- ❌ Gestión de usuarios
- ❌ Gestión de empresas
- ✅ Proyectos donde es miembro
- ❌ Editar proyectos
- ❌ Crear tareas
- ✅ Mover tareas en Kanban
- ✅ Comentar en proyectos
- ✅ Mis Tareas y Reuniones

### Stakeholder

- ✅ Dashboard simplificado (progreso)
- ❌ Gestión de usuarios
- ❌ Gestión de empresas
- ✅ Proyectos donde es stakeholder
- ❌ Ver Kanban
- ❌ Ver equipo técnico
- ✅ Ver progreso y fechas
- ✅ Mensajes privados con PM
- ❌ Mis Tareas (no aplica)

## Roadmap

### UX / Productividad

- [ ] Filtros en el Kanban (por asignado, prioridad, categoría, fecha)
- [ ] Búsqueda global (proyectos, tareas, usuarios)
- [ ] Duplicar tareas
- [ ] Vista de lista alternativa al Kanban (tabla con ordenamiento)
- [ ] Textarea para descripción de tareas y proyectos

### Colaboración

- [ ] Historial de cambios en tareas (quién cambió qué y cuándo)
- [ ] Reacciones en comentarios (👍, ✅, 👀)
- [ ] @equipo para mencionar a todo el equipo del proyecto

### Reportes

- [ ] Dashboard con gráficos (burndown, tareas por categoría/prioridad)
- [ ] Exportar a CSV/PDF (tareas, resumen de proyecto)

### Técnicas

- [ ] Paginación en listas (proyectos, tareas, usuarios)
- [ ] Optimistic updates en Kanban (drag & drop instantáneo)
- [ ] Cache con SWR o React Query

## Scripts

| Comando | Descripción |
| --- | --- |
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Build de producción |
| `npm run start` | Servidor de producción |
| `npm run lint` | Ejecutar ESLint |
