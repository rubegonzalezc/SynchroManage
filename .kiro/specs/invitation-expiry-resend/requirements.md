# Documento de Requisitos

## Introducción

Esta funcionalidad mejora el flujo de invitación de usuarios en SynchroManage de dos formas: (1) informar explícitamente en el correo de invitación que el enlace expira en 24 horas, y (2) permitir a los administradores reenviar la invitación desde la tabla de gestión de usuarios para renovar el enlace expirado.

## Glosario

- **Sistema_Email**: Módulo de renderizado y envío de correos electrónicos de SynchroManage, compuesto por las plantillas en `templates.ts` y la Edge Function `send-email`.
- **API_Invitación**: Endpoint de la API de Next.js que genera el enlace de invitación mediante Supabase Auth y dispara el envío del correo (`/api/dashboard/invite-user`).
- **API_Reenvío**: Nuevo endpoint de la API de Next.js que regenera el enlace de invitación y reenvía el correo para un usuario pendiente.
- **Tabla_Usuarios**: Componente de interfaz de usuario que muestra la lista de usuarios del sistema con sus estados y acciones (`UsersTableClient`).
- **Administrador**: Usuario con rol `admin` que gestiona las invitaciones de otros usuarios.
- **Usuario_Pendiente**: Usuario creado mediante invitación cuyo email aún no ha sido confirmado.
- **Enlace_Invitación**: URL generada por Supabase Auth con `generateLink({ type: 'invite' })` que permite al invitado establecer su contraseña. Expira en 24 horas por defecto.

## Requisitos

### Requisito 1: Mostrar información de expiración en el correo de invitación

**User Story:** Como administrador, quiero que el correo de invitación informe al destinatario que el enlace expira en 24 horas, para que el invitado sepa que debe actuar dentro de ese plazo.

#### Criterios de Aceptación

1. THE Sistema_Email SHALL incluir un texto visible en el correo de invitación indicando que el Enlace_Invitación expira en 24 horas desde su envío.
2. THE Sistema_Email SHALL posicionar el aviso de expiración debajo del botón "Aceptar Invitación" y antes del texto de descarte del correo.
3. WHEN la interfaz `UserInvitedData` incluye un campo `expiresInHours`, THE Sistema_Email SHALL utilizar el valor de `expiresInHours` para mostrar el plazo de expiración en el correo.
4. IF el campo `expiresInHours` no está presente en `UserInvitedData`, THEN THE Sistema_Email SHALL mostrar "24 horas" como valor por defecto.

### Requisito 2: Botón de reenvío de invitación en la tabla de usuarios

**User Story:** Como administrador, quiero poder reenviar la invitación a un usuario pendiente desde la tabla de usuarios, para que el invitado reciba un nuevo enlace válido sin necesidad de eliminar y recrear el usuario.

#### Criterios de Aceptación

1. WHILE un usuario tiene estado "Pendiente" (email no confirmado), THE Tabla_Usuarios SHALL mostrar un botón de reenvío de invitación en la columna de acciones de ese usuario.
2. WHEN el Administrador hace clic en el botón de reenvío, THE Tabla_Usuarios SHALL enviar una solicitud a la API_Reenvío con el identificador del Usuario_Pendiente.
3. WHILE la solicitud de reenvío está en curso, THE Tabla_Usuarios SHALL deshabilitar el botón de reenvío y mostrar un indicador de carga.
4. WHEN la API_Reenvío responde con éxito, THE Tabla_Usuarios SHALL mostrar una notificación de éxito indicando que la invitación fue reenviada.
5. IF la API_Reenvío responde con error, THEN THE Tabla_Usuarios SHALL mostrar una notificación de error con el mensaje recibido.
6. WHEN un usuario tiene estado "Confirmado", THE Tabla_Usuarios SHALL ocultar el botón de reenvío para ese usuario.

### Requisito 3: Endpoint de reenvío de invitación

**User Story:** Como administrador, quiero que el sistema regenere el enlace de invitación y reenvíe el correo, para que el usuario pendiente reciba un enlace con una nueva fecha de expiración.

#### Criterios de Aceptación

1. WHEN la API_Reenvío recibe una solicitud con un identificador de usuario válido, THE API_Reenvío SHALL generar un nuevo Enlace_Invitación mediante `supabaseAdmin.auth.admin.generateLink({ type: 'invite' })` para el email del Usuario_Pendiente.
2. WHEN la API_Reenvío genera un nuevo Enlace_Invitación, THE API_Reenvío SHALL invocar la Edge Function `send-email` con el tipo `user_invited` y los datos actualizados del usuario (nombre, URL de invitación, roles).
3. THE API_Reenvío SHALL verificar que el solicitante tiene rol `admin` antes de procesar la solicitud.
4. IF el solicitante no tiene rol `admin`, THEN THE API_Reenvío SHALL responder con código HTTP 403 y el mensaje "No tienes permisos".
5. IF el identificador de usuario no corresponde a un usuario existente, THEN THE API_Reenvío SHALL responder con código HTTP 404 y el mensaje "Usuario no encontrado".
6. IF el usuario objetivo ya confirmó su email, THEN THE API_Reenvío SHALL responder con código HTTP 400 y el mensaje "El usuario ya confirmó su cuenta".
7. WHEN la API_Reenvío completa el reenvío con éxito, THE API_Reenvío SHALL registrar la acción en `activity_log` con la acción "invite_resent".
8. IF la generación del Enlace_Invitación falla, THEN THE API_Reenvío SHALL responder con código HTTP 500 y un mensaje descriptivo del error.

### Requisito 4: Compatibilidad con la interfaz de datos del correo

**User Story:** Como desarrollador, quiero que la interfaz `UserInvitedData` soporte opcionalmente el campo de expiración, para que el template de correo pueda mostrar el plazo sin romper las invocaciones existentes.

#### Criterios de Aceptación

1. THE Sistema_Email SHALL extender la interfaz `UserInvitedData` con un campo opcional `expiresInHours` de tipo numérico.
2. WHEN la API_Invitación envía el correo de invitación, THE API_Invitación SHALL incluir el campo `expiresInHours` con valor `24` en los datos enviados a la Edge Function.
3. WHEN la API_Reenvío envía el correo de reenvío, THE API_Reenvío SHALL incluir el campo `expiresInHours` con valor `24` en los datos enviados a la Edge Function.
