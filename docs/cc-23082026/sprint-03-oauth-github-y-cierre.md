# Sprint 3 — GitHub OAuth, cutover y limpieza

**Control de cambios:** CC-23082026  
**Proyecto:** SynchroManage  
**Duración sugerida:** 2 semanas  
**Equipo:** 3 desarrolladores  
**Depende de:** Sprint 2 CC-23082026  
**Desbloquea:** [CC-22082026 Sprint 1](../cc-22082026/sprint-01-ramas-y-repositorio.md)

| Desarrollador | Perfil | Rol en el sprint |
|---------------|--------|------------------|
| **Rubén González** | Senior | GitHub provider, migración 4 usuarios, cutover prod |
| **José** | Frontend | Perfil «Conectar GitHub», estados conectado/desconectado |
| **Sebastián** | Fullstack | Limpieza `supabase.auth`, migrar APIs restantes, QA regresión |

## Objetivo del sprint

**Conectar GitHub vía OAuth** en Better Auth, **migrar usuarios existentes**, eliminar Supabase Auth del código y **liberar CC-22082026**.

**Épica:** *Migrar autenticación a Better Auth*

---

## Definition of Done (DoD)

- GitHub OAuth funcional en perfil de usuario.
- 4 usuarios de producción migrados; login verificado.
- Cero imports de `supabase.auth` en `src/`.
- Trigger `on_auth_user_created` eliminado.
- Release `v0.2.5` etiquetado.
- CC-22082026 puede iniciar Sprint 1.

---

## Capacidad estimada

| Desarrollador | Puntos asignados |
|---------------|------------------|
| Rubén González | ~12 pts |
| José | ~6 pts |
| Sebastián | ~8 pts |
| **Total** | **~26 pts** |

---

## Historias de usuario

| HU | Título | Prioridad | Puntos | Asignado |
|----|--------|-----------|--------|----------|
| HU-13 | Configurar GitHub OAuth en Better Auth | **P0** | 5 | Rubén González |
| HU-14 | UI Perfil: Conectar / Desconectar GitHub | **P0** | 5 | José |
| HU-15 | Script migración 4 usuarios + ventana cutover | **P0** | 8 | Rubén González |
| HU-16 | Migrar APIs restantes (`getUser` → `getServerSession`) | **P1** | 5 | Sebastián |
| HU-17 | Eliminar Supabase Auth (código + trigger DB) | **P1** | 3 | Sebastián |

---

## HU-13 — GitHub OAuth

**Criterios de aceptación:**

- Provider `github` en `auth.ts` con `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET`.
- Scopes: `read:user`, `repo` (ajustar con CC-22082026 si basta `contents:write`).
- Cuenta vinculada en tabla `account` con `access_token` almacenado de forma segura (solo servidor).
- API `GET /api/dashboard/me` expone `github_connected: boolean` y `github_username` (sin token).

**Puente a CC-22082026:**

El endpoint `POST /tasks/{id}/git-branch` (futuro) leerá el token desde `account` donde `providerId = 'github'`, con fallback opcional a `profiles.github_token_encrypted` si el usuario prefiere PAT manual.

---

## HU-14 — UI Perfil GitHub

**Criterios de aceptación:**

- Sección **Integración GitHub** en `/profile`.
- Botón **Conectar con GitHub** → OAuth flow.
- Estado conectado: @username + **Desconectar**.
- Estado no conectado: aviso para usar «Crear rama» en CC-22082026.

---

## HU-15 — Migración y cutover

**Criterios de aceptación:**

- Script idempotente: export `auth.users` → import Better Auth `user` + `account`.
- Verificación: cada usuario hace login con contraseña actual.
- Plan de rollback documentado (snapshot DB).
- Ventana de mantenimiento comunicada (< 30 min objetivo).
- Post-cutover: invalidar sesiones Supabase Auth (usuarios re-login una vez).

**Checklist cutover:**

1. [ ] Backup DB
2. [ ] Ejecutar script migración
3. [ ] Deploy app con Better Auth
4. [ ] Smoke test: login, invite, reset, dashboard
5. [ ] Eliminar trigger `on_auth_user_created`
6. [ ] Monitor errores 24 h

---

## HU-16 — Migrar APIs restantes

**Criterios de aceptación:**

- Todas las rutas en `src/app/api/**` usan `getServerSession()` o `requireSession()`.
- Cliente: `useRole`, `NotificationsDropdown`, `profile/page` sin `supabase.auth`.
- `permissions.ts` usa Better Auth.

---

## HU-17 — Limpieza

**Criterios de aceptación:**

- Eliminar `@supabase/ssr` si solo se usaba para auth (evaluar si queda para cookies en otro contexto).
- Eliminar rutas `/auth/callback` de Supabase si Better Auth las reemplaza.
- Actualizar README: sección auth y variables de entorno.
- Opcional: deshabilitar email auth en Supabase dashboard (solo Postgres activo).

---

## Demo Sprint 3 (cierre CC)

1. Usuario existente migrado hace login.
2. Perfil → Conectar GitHub → OAuth OK.
3. `rg supabase.auth src/` → sin resultados.
4. Equipo confirma inicio CC-22082026.

---

## Entregable para CC-22082026

Tras este sprint, CC-22082026 puede asumir:

- Token GitHub disponible server-side vía Better Auth `account`.
- No se implementa PAT manual en Sprint 3 salvo stretch; CC-22082026 documenta fallback en [modelo-git.md](../cc-22082026/modelo-git.md).
