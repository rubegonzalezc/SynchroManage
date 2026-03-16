# Plan de Implementación: Expiración y Reenvío de Invitaciones

## Visión General

Implementar en orden incremental: (1) extender la interfaz y template de correo con aviso de expiración, (2) actualizar la API de invitación existente, (3) crear el endpoint de reenvío, (4) agregar el botón de reenvío en la UI, y (5) escribir tests de propiedad.

## Tareas

- [x] 1. Extender interfaz `UserInvitedData` y actualizar template de correo
  - [x] 1.1 Agregar campo opcional `expiresInHours?: number` a la interfaz `UserInvitedData` en `supabase/functions/send-email/templates.ts`
    - Agregar el campo al tipo existente sin romper invocaciones actuales
    - _Requisitos: 4.1_

  - [x] 1.2 Actualizar `renderUserInvitedEmail()` para mostrar aviso de expiración
    - Insertar un párrafo con el texto de expiración después del botón "Aceptar Invitación" y antes del texto "Si no esperabas esta invitación"
    - Usar `data.expiresInHours ?? 24` para el valor mostrado (fallback a 24 horas)
    - _Requisitos: 1.1, 1.2, 1.3, 1.4_

  - [ ]* 1.3 Escribir test de propiedad para aviso de expiración posicionado correctamente
    - **Propiedad 1: El correo de invitación contiene aviso de expiración correctamente posicionado**
    - Crear archivo `src/lib/utils/__tests__/invitationExpiry.property.test.ts`
    - Generar `UserInvitedData` aleatorio con fast-check, verificar que el aviso existe entre el botón CTA y el texto de descarte
    - Mínimo 100 iteraciones
    - **Valida: Requisitos 1.1, 1.2**

  - [ ]* 1.4 Escribir test de propiedad para valor de `expiresInHours` reflejado en el correo
    - **Propiedad 2: El valor de expiresInHours se refleja en el correo**
    - En el mismo archivo `src/lib/utils/__tests__/invitationExpiry.property.test.ts`
    - Generar datos con `expiresInHours` aleatorio (1-168) y verificar que el valor aparece en el HTML; generar sin el campo y verificar "24 horas" por defecto
    - Mínimo 100 iteraciones
    - **Valida: Requisitos 1.3, 1.4**

- [x] 2. Actualizar API de invitación existente
  - [x] 2.1 Agregar `expiresInHours: 24` al objeto `data` en `src/app/api/dashboard/invite-user/route.ts`
    - En la invocación de `supabaseAdmin.functions.invoke('send-email', ...)`, agregar el campo `expiresInHours: 24` al objeto `data`
    - _Requisitos: 4.2_

  - [x] 2.2 Corregir la URL de fallback en `invite-user/route.ts`
    - Cambiar `process.env.NEXT_PUBLIC_APP_URL || 'https://produccion.d10wccaqn7i0qo.amplifyapp.com'` a `process.env.NEXT_PUBLIC_APP_URL || 'https://synchrodev.cl'`
    - _Requisitos: 4.2_

- [x] 3. Checkpoint - Verificar template y API de invitación
  - Asegurar que todos los tests pasan, preguntar al usuario si surgen dudas.

- [x] 4. Crear endpoint de reenvío de invitación
  - [x] 4.1 Crear `src/app/api/dashboard/resend-invite/route.ts` con handler POST
    - Verificar autenticación y rol admin (mismo patrón que `invite-user/route.ts`)
    - Recibir `{ userId }` del body
    - Buscar perfil del usuario con roles desde `profiles` y `user_roles`
    - Verificar que el usuario existe (404 si no)
    - Verificar que no ha confirmado email via `auth.admin.getUserById` (400 si ya confirmó)
    - Llamar `generateLink({ type: 'invite', email })` para regenerar enlace
    - Invocar `send-email` con tipo `user_invited` incluyendo `expiresInHours: 24`
    - Registrar en `activity_log` con acción `invite_resent`
    - Retornar `{ success: true }` en éxito
    - _Requisitos: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 4.3_

  - [ ]* 4.2 Escribir test de propiedad para rechazo de usuarios no-admin
    - **Propiedad 3: La API de reenvío rechaza solicitudes de usuarios no-admin**
    - Crear test en `src/lib/utils/__tests__/invitationExpiry.property.test.ts`
    - Generar roles no-admin aleatorios con fast-check, verificar respuesta 403 con mock de Supabase
    - Mínimo 100 iteraciones
    - **Valida: Requisitos 3.3, 3.4**

- [x] 5. Agregar botón de reenvío en la tabla de usuarios
  - [x] 5.1 Agregar estado `resendingUserId` y función `handleResendInvite` en `src/components/dashboard/users/UsersTableClient.tsx`
    - Agregar estado `resendingUserId: string | null` para rastrear el usuario en proceso de reenvío
    - Implementar `handleResendInvite(userId)` que llama a `POST /api/dashboard/resend-invite`
    - Mostrar toast de éxito o error según la respuesta
    - _Requisitos: 2.2, 2.4, 2.5_

  - [x] 5.2 Renderizar botón de reenvío condicionalmente en la columna de acciones
    - Importar ícono `RefreshCw` de `lucide-react`
    - Mostrar botón solo cuando `!user.email_confirmed` (usuario pendiente)
    - Ocultar botón cuando el usuario está confirmado
    - Deshabilitar botón y mostrar `Loader2` mientras `resendingUserId === user.id`
    - _Requisitos: 2.1, 2.3, 2.6_

- [x] 6. Checkpoint final - Verificar integración completa
  - Asegurar que todos los tests pasan, preguntar al usuario si surgen dudas.

## Notas

- Las tareas marcadas con `*` son opcionales y pueden omitirse para un MVP más rápido
- Cada tarea referencia requisitos específicos para trazabilidad
- Los checkpoints aseguran validación incremental
- Los tests de propiedad validan propiedades universales de corrección
- El archivo de tests de propiedad se ubica en `src/lib/utils/__tests__/invitationExpiry.property.test.ts`
