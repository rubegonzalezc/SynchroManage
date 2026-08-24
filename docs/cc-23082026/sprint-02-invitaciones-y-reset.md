# Sprint 2 — Invitaciones, reset y administración

**Control de cambios:** CC-23082026  
**Proyecto:** SynchroManage  
**Duración sugerida:** 2 semanas  
**Equipo:** 3 desarrolladores  
**Depende de:** Sprint 1 CC-23082026

| Desarrollador | Perfil | Rol en el sprint |
|---------------|--------|------------------|
| **Rubén González** | Senior | invite-user, delete-user, migración `password_reset_codes` |
| **José** | Frontend | set-password, forgot-password UI |
| **Sebastián** | Fullstack | users API, resend-invite, hook creación de perfil |

## Objetivo del sprint

Reemplazar **todas** las llamadas a `supabase.auth.admin.*` y completar flujos de **invitación** y **reset de contraseña** con Better Auth.

**Épica:** *Migrar autenticación a Better Auth*

---

## Definition of Done (DoD)

- `POST /api/dashboard/invite-user` sin `auth.admin.generateLink`.
- `POST /api/auth/password-reset/*` sin `auth.admin.updateUserById`.
- `DELETE /api/dashboard/delete-user` elimina user Better Auth + profile.
- `GET /api/dashboard/users` lista usuarios sin `auth.admin.listUsers`.
- Nuevo usuario invitado obtiene `profiles` + `user_roles` automáticamente.

---

## Capacidad estimada

| Desarrollador | Puntos asignados |
|---------------|------------------|
| Rubén González | ~12 pts |
| José | ~8 pts |
| Sebastián | ~8 pts |
| **Total** | **~28 pts** |

---

## Historias de usuario

| HU | Título | Prioridad | Puntos | Asignado |
|----|--------|-----------|--------|----------|
| HU-07 | Hook post-creación: `profiles` + `user_roles` | **P0** | 5 | Sebastián |
| HU-08 | Migrar `invite-user` y `resend-invite` | **P0** | 8 | Rubén González |
| HU-09 | Migrar flujo reset contraseña (3 endpoints) | **P0** | 8 | Rubén González |
| HU-10 | Migrar `delete-user` y `users` admin | **P1** | 5 | Sebastián |
| HU-11 | UI `/auth/set-password` y forgot-password | **P1** | 5 | José |
| HU-12 | FK `password_reset_codes` → tabla `user` | **P2** | 2 | Rubén González |

---

## HU-07 — Hook creación de perfil

**Criterios de aceptación:**

- Tras crear `user` en Better Auth (invitación), se inserta/actualiza `profiles` con `full_name`, `role_id`, `company_id`.
- Se insertan filas en `user_roles` según roles seleccionados.
- Equivalente funcional al flujo actual post-`generateLink`.
- Trigger `on_auth_user_created` marcado para eliminación en Sprint 3 (no ejecutar en paralelo).

---

## HU-08 — Invitación

**Criterios de aceptación:**

- Admin puede invitar con mismos campos que hoy (email, nombre, roles, empresa).
- Correo vía Edge Function `send-email` con link de verificación Better Auth.
- Link expirado muestra UI actual en login (`linkExpired`).
- Sin llamadas a `supabaseAdmin.auth.admin`.

---

## HU-09 — Reset contraseña

**Criterios de aceptación:**

- Flujo de 6 dígitos se mantiene (UX igual).
- `password_reset_codes` valida contra `user.id` (Better Auth).
- Nueva contraseña se guarda en `account` credential de Better Auth.
- Rate limit básico en generación de códigos (como hoy).

---

## HU-10 — Administración usuarios

**Criterios de aceptación:**

- Listado admin incluye `email_confirmed`, `last_sign_in` desde tablas Better Auth.
- Eliminar usuario borra: session, account, user, profiles, user_roles (orden correcto por FKs).
- Activity log registra acción `deleted` como hoy.

---

## HU-11 — UI set-password / forgot

**Criterios de aceptación:**

- `/auth/set-password` usa token de invitación Better Auth.
- `/auth/forgot-password` (si existe) alineado con API reset.
- `/profile` cambio de contraseña: re-autenticar + update vía Better Auth (sin `signInWithPassword` Supabase).

---

## HU-12 — Migración FK password_reset_codes

**SQL orientativo:**

```sql
ALTER TABLE password_reset_codes
  DROP CONSTRAINT IF EXISTS password_reset_codes_user_id_fkey;

ALTER TABLE password_reset_codes
  ADD CONSTRAINT password_reset_codes_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES "user"(id) ON DELETE CASCADE;
```

(Ajustar nombre de tabla según schema generado por Better Auth.)

---

## Demo Sprint 2

1. Admin invita a `nuevo@ejemplo.cl` con rol developer.
2. Usuario abre link, define contraseña, entra al dashboard.
3. Forgot password → código → nueva contraseña → login OK.
4. Admin elimina usuario de prueba.
