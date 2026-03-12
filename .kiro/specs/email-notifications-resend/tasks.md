# Tareas: Notificaciones por Correo con Resend

## Tarea 1: Funciones de utilidad puras (validación, deduplicación, generación de código)

- [x] 1.1 Crear `src/lib/utils/email-validation.ts` con funciones `isValidEmail(email: string): boolean` y `isValidNotificationType(type: string): boolean`
- [x] 1.2 Crear `src/lib/utils/email-recipients.ts` con función `deduplicateRecipients(recipients, currentUserId): EmailRecipient[]` que deduplica por userId, consolida roles y excluye al usuario actual
- [x] 1.3 Crear `src/lib/utils/verification-code.ts` con funciones `generateVerificationCode(): string` (6 dígitos numéricos) y `calculateExpiration(): Date` (15 minutos desde ahora) y `isCodeValid(code, storedCode, expiresAt): boolean`
- [x] 1.4 Escribir tests de propiedad en `src/lib/utils/__tests__/emailValidation.property.test.ts` — Propiedad 1: validación rechaza emails y tipos inválidos
- [x] 1.5 Escribir tests de propiedad en `src/lib/utils/__tests__/emailRecipients.property.test.ts` — Propiedad 2: deduplicación con consolidación de roles y auto-exclusión, y Propiedad 3: solo nuevos asignados reciben email
- [x] 1.6 Escribir tests de propiedad en `src/lib/utils/__tests__/verificationCode.property.test.ts` — Propiedad 5: código de 6 dígitos, Propiedad 6: expiración 15 min, Propiedad 7: códigos inválidos rechazados, Propiedad 8: nuevo código invalida anteriores

## Tarea 2: Plantillas de email HTML

- [x] 2.1 Crear `src/lib/utils/email-templates.ts` con funciones `renderProjectAssignedEmail(data)`, `renderTaskAssignedEmail(data)`, `renderPasswordResetEmail(data)` que retornan HTML string con estructura común (logo, footer) y campos específicos por tipo
- [x] 2.2 Escribir tests de propiedad en `src/lib/utils/__tests__/emailTemplates.property.test.ts` — Propiedad 4: plantillas contienen todos los campos requeridos por tipo y estructura común

## Tarea 3: Supabase Edge Function `send-email`

- [x] 3.1 Crear estructura de directorio `supabase/functions/send-email/` e `index.ts` con la Edge Function que valida entrada, genera HTML usando plantillas, y envía vía Resend API con `fetch`
- [x] 3.2 Documentar en README o comentarios cómo desplegar: `supabase functions deploy send-email` y configurar secret `supabase secrets set RESEND_API_KEY=re_RzzWmAy5_4yJASak8q4zwy5bgfQB29ac8`

## Tarea 4: API Routes de recuperación de contraseña

- [x] 4.1 Crear `src/app/api/auth/password-reset/route.ts` (POST) — recibe email, busca usuario, genera código, invalida previos, inserta en `password_reset_codes`, invoca Edge Function. Retorna 200 genérico siempre.
- [x] 4.2 Crear `src/app/api/auth/password-reset/verify/route.ts` (POST) — recibe email y code, verifica en `password_reset_codes` que no esté usado ni expirado
- [x] 4.3 Crear `src/app/api/auth/password-reset/reset/route.ts` (POST) — recibe email, code y password, re-verifica código, cambia contraseña con `supabaseAdmin.auth.admin.updateUserById()`, elimina código usado

## Tarea 5: Integrar envío de email en API routes existentes

- [x] 5.1 Modificar `src/app/api/dashboard/projects/route.ts` (POST) — después de crear proyecto y notificaciones internas, recopilar destinatarios (PM, Tech Lead, miembros), deduplicar con `deduplicateRecipients()`, invocar Edge Function para cada destinatario. Envolver en try/catch para no bloquear operación principal.
- [x] 5.2 Modificar `src/app/api/dashboard/tasks/route.ts` (POST) — después de crear tarea, invocar Edge Function para cada asignado (excluyendo creador). Envolver en try/catch.
- [x] 5.3 Modificar `src/app/api/dashboard/tasks/[id]/route.ts` (PUT) — después de actualizar tarea, invocar Edge Function solo para nuevos asignados (`addedIds`, excluyendo usuario actual). Envolver en try/catch.

## Tarea 6: Página de recuperación de contraseña y enlace en login

- [x] 6.1 Crear `src/app/auth/forgot-password/page.tsx` — componente cliente con 3 pasos: formulario email → formulario código 6 dígitos → formulario nueva contraseña con confirmación. Incluir manejo de errores y estados de carga.
- [x] 6.2 Modificar `src/app/login/page.tsx` — agregar enlace "¿Olvidaste tu contraseña?" debajo del botón de login que navegue a `/auth/forgot-password`

## Tarea 7: Configuración de base de datos

- [x] 7.1 Crear script SQL o migración para la tabla `password_reset_codes` si no existe, con índices en `user_id` y `(user_id, code, used)`
