# Sprint 1 — Fundamentos Better Auth

**Control de cambios:** CC-23082026  
**Proyecto:** SynchroManage  
**Duración sugerida:** 2 semanas  
**Equipo:** 3 desarrolladores  
**Depende de:** Ningún CC previo (bloquea CC-22082026)

| Desarrollador | Perfil | Rol en el sprint |
|---------------|--------|------------------|
| **Rubén González** | Senior | Instalación Better Auth, schema DB, helper de sesión en APIs |
| **José** | Frontend | Login, layouts, redirección por rol |
| **Sebastián** | Fullstack | Middleware, `/api/dashboard/me`, pruebas E2E login |

## Objetivo del sprint

Tener **login funcional con Better Auth** y **rutas protegidas** sin depender de `supabase.auth.getUser()` en middleware ni layouts.

**Épica:** *Migrar autenticación a Better Auth*

---

## Definition of Done (DoD)

- Better Auth instalado y con tablas migradas en Supabase Postgres.
- Login email/contraseña operativo en staging.
- Middleware redirige a `/login` sin sesión y valida rol.
- `/api/dashboard/me` devuelve perfil usando sesión Better Auth.
- Documentación de variables de entorno actualizada.

---

## Capacidad estimada

| Desarrollador | Puntos asignados |
|---------------|------------------|
| Rubén González | ~14 pts |
| José | ~10 pts |
| Sebastián | ~8 pts |
| **Total** | **~32 pts** |

---

## Historias de usuario

| HU | Título | Prioridad | Puntos | Asignado |
|----|--------|-----------|--------|----------|
| HU-01 | Instalar Better Auth + migración tablas `user`, `session`, `account` | **P0** | 8 | Rubén González |
| HU-02 | Configurar `auth.ts` y route handler `/api/auth/[...all]` | **P0** | 5 | Rubén González |
| HU-03 | Helper `getServerSession()` para API routes | **P0** | 5 | Rubén González |
| HU-04 | Migrar middleware (`updateSession`) a Better Auth | **P0** | 5 | Sebastián |
| HU-05 | Migrar página `/login` (signIn email) | **P1** | 5 | José |
| HU-06 | Migrar layouts y páginas server que usan `getUser()` | **P1** | 4 | José + Sebastián |

---

## HU-01 — Instalar Better Auth + schema

**Criterios de aceptación:**

- Paquete `better-auth` y adaptador Postgres configurados.
- Migración SQL aplicada en proyecto `njkweyaifgqyyosungju`.
- `BETTER_AUTH_SECRET` y `BETTER_AUTH_URL` documentados en README.
- Sin tablas duplicadas que colisionen con `profiles`.

**Notas técnicas:**

- Usar `better-auth` con `postgresql` pooler de Supabase.
- No crear tabla `profiles` desde Better Auth; solo tablas del plugin core.

---

## HU-02 — Route handler Better Auth

**Criterios de aceptación:**

- `src/app/api/auth/[...all]/route.ts` exporta GET/POST del handler.
- Endpoints `/api/auth/sign-in/email`, `sign-out`, `get-session` responden 200 en staging.

---

## HU-03 — Helper de sesión en servidor

**Criterios de aceptación:**

- `src/lib/auth/server.ts` expone `getServerSession()` y `requireSession()`.
- Al menos una API existente (ej. `GET /api/dashboard/me`) migrada como referencia.
- Patrón documentado para el resto de rutas en Sprint 2.

---

## HU-04 — Middleware

**Criterios de aceptación:**

- Rutas privadas (`/dashboard`, `/projects`, `/my-tasks`, etc.) exigen sesión Better Auth.
- Usuario en `/login` con sesión válida redirige a `/dashboard`.
- Validación de rol vía `profiles` (cookie `user_role` opcional, misma lógica que hoy).
- Cero llamadas a `supabase.auth` en `middleware.ts`.

---

## HU-05 — Login UI

**Criterios de aceptación:**

- Formulario login usa `authClient.signIn.email`.
- Mensaje de error «Credenciales incorrectas» (comportamiento actual).
- Redirección por rol tras login (admin/pm/tech_lead/developer/stakeholder → dashboard).
- Flujo de hash de invitación redirige a `/auth/set-password` (preparación Sprint 2).

---

## HU-06 — Layouts server

**Criterios de aceptación:**

- Migrados: `dashboard/layout`, `projects/layout`, `my-tasks/layout`, `profile/layout`, `change-controls/layout`, `page.tsx` raíz.
- Sustituir `supabase.auth.getUser()` por `getServerSession()`.

---

## Riesgos

| Riesgo | Mitigación |
|--------|------------|
| Hashes de contraseña incompatibles | Probar import bcrypt Supabase → Better Auth en HU-01 |
| Realtime deja de recibir JWT Supabase | Sprint 1 solo login; notificaciones vía SWR hasta Sprint 3 |
| Doble auth en staging | Feature flag `AUTH_PROVIDER` solo en dev |

---

## Demo Sprint 1

1. Usuario de prueba creado manualmente en tablas Better Auth.
2. Login en `/login` → dashboard.
3. Logout → vuelve a login.
4. Acceso directo a `/dashboard` sin sesión → redirect login.
