# CC-23082026 — Migrar autenticación a Better Auth

**Proyecto:** SynchroManage  
**Control de cambios:** CC-23082026  
**Fecha de apertura:** 23/08/2026  
**Versión objetivo del producto:** `0.2.5`  
**Equipo:** Rubén González, José, Sebastián  
**Estado:** Planificado

## Épica

**Migrar autenticación a Better Auth** — Sustituir Supabase Auth por Better Auth manteniendo Supabase Postgres como base de datos, para desacoplar la identidad del proveedor y habilitar OAuth GitHub (CC-22082026) sin depender de `linkIdentity` ni del Admin API de Supabase.

## Por qué ahora

Auditoría en vivo del proyecto Supabase (`njkweyaifgqyyosungju`, ago 2026):

| Hallazgo | Implicación |
|----------|-------------|
| 4 usuarios, proveedor **solo email** | Sin OAuth configurado hoy |
| `profiles.id` = `auth.users.id` (FK) | Identidad acoplada a Supabase Auth |
| Trigger `on_auth_user_created` → `handle_new_user()` | Creación de perfil ligada a Supabase |
| `password_reset_codes.user_id` → `auth.users` | Reset de contraseña ligado a Supabase |
| ~51 archivos con `auth.getUser()` | Superficie amplia de migración |
| ~41 rutas API con `service_role` | Patrón actual bypasea RLS en servidor |
| Políticas RLS usan `auth.uid()` | Requiere estrategia para acceso directo al cliente |

**Decisión:** no usar Supabase Auth ni `linkIdentity` para GitHub. Better Auth gestiona sesiones y proveedores; Postgres sigue en Supabase.

## Relación con otros CC

| CC | Épica | Versión | Orden |
|----|-------|---------|-------|
| [CC-21082026](../cc-21082026/) | Operar sin fricción | `0.2.0` | En paralelo / antes |
| **CC-23082026** | Migrar a Better Auth | `0.2.5` | **Antes de CC-22082026** |
| [CC-22082026](../cc-22082026/) | Conectar con Git | `0.3.0` | Después de este CC |

> **CC-22082026 queda bloqueado** hasta cerrar CC-23082026. El token GitHub por usuario se implementa como cuenta OAuth en Better Auth (Sprint 3), no como PAT manual en Supabase Auth.

## Alcance del control de cambios

| Incluye | Excluye |
|---------|---------|
| Better Auth: login email/contraseña | Cambiar de proveedor de Postgres |
| Sesiones y middleware Next.js | Migrar datos fuera de Supabase |
| Invitación de usuarios (reemplazo `generateLink`) | SSO empresarial (SAML) |
| Reset de contraseña propio | Multi-tenant |
| GitHub como proveedor OAuth (Sprint 3) | GitLab / Bitbucket |
| Mantener `profiles` y roles actuales | Reescribir RLS completo (solo ajustes mínimos) |
| Eliminar dependencia de `@supabase/ssr` para auth | Eliminar Supabase Realtime/Storage |

## Arquitectura objetivo (resumen)

```text
Browser ──► Better Auth (Next.js API) ──► Sesión (cookie)
                │
                ├──► Postgres (Supabase): user, session, account (Better Auth)
                │
                └──► Postgres (Supabase): profiles, roles, … (negocio, sin cambios de modelo)

API routes ──► getSession() Better Auth ──► service_role Supabase (como hoy)
```

Ver [modelo-auth.md](./modelo-auth.md).

## Sprints

| Sprint | Tema | Documento | Puntos |
|--------|------|-----------|--------|
| **1** | Fundamentos: login, sesión y middleware | [sprint-01-fundamentos-better-auth.md](./sprint-01-fundamentos-better-auth.md) | ~32 pts |
| **2** | Invitaciones, reset y administración de usuarios | [sprint-02-invitaciones-y-reset.md](./sprint-02-invitaciones-y-reset.md) | ~28 pts |
| **3** | GitHub OAuth, cutover y limpieza | [sprint-03-oauth-github-y-cierre.md](./sprint-03-oauth-github-y-cierre.md) | ~26 pts |

**Total estimado:** ~86 pts · **3 sprints** (~2 semanas cada uno, 3 desarrolladores).

## Variables de entorno (nuevas)

```env
# Better Auth
BETTER_AUTH_SECRET=...          # Secreto de firma de sesión (32+ bytes)
BETTER_AUTH_URL=https://synchrodev.cl

# GitHub OAuth (Sprint 3 — también usado por CC-22082026)
GITHUB_CLIENT_ID=...
GITHUB_CLIENT_SECRET=...

# Se mantienen (Postgres + operaciones servidor)
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...

# Cifrado PAT fallback (CC-22082026, si el usuario prefiere PAT manual)
ENCRYPTION_KEY=...
```

## Definition of Done (global)

- Login, logout y rutas protegidas funcionan con Better Auth.
- Invitación y reset de contraseña sin llamadas a `supabase.auth.admin.*`.
- Los 4 usuarios existentes migran sin pérdida de acceso.
- `profiles.id` se mantiene como UUID estable (mismo valor que hoy).
- Build sin errores; sin regresiones en dashboard, tareas, bugs y búsqueda.
- Documentación de cutover y rollback en [modelo-auth.md](./modelo-auth.md).

## Demo de cierre

1. Login con email/contraseña (usuario existente migrado).
2. Admin invita usuario nuevo → correo → establecer contraseña → acceso al dashboard.
3. Reset de contraseña con código de 6 dígitos (flujo actual, sin Supabase Auth).
4. Perfil → **Conectar con GitHub** → sesión vinculada en Better Auth.
5. Verificar que ninguna ruta usa `supabase.auth.getUser()` ni `auth.admin.*`.

## Documentación relacionada

- [Modelo de autenticación](./modelo-auth.md)
- [CC-22082026 — Conectar con Git](../cc-22082026/) (depende de este CC)
