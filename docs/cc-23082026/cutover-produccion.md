# Cutover Better Auth — Producción

**Control de cambios:** CC-23082026  
**Duración objetivo:** &lt; 30 minutos de ventana de mantenimiento

## Pre-requisitos

- Variables en el entorno de producción:
  - `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `DATABASE_URL`
  - `RESEND_API_KEY`, `RESEND_FROM_EMAIL`
  - `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`, `NEXT_PUBLIC_GITHUB_LOGIN_ENABLED=true`
- Migración `008_better_auth_schema.sql` aplicada
- Migración `009_drop_password_reset_codes.sql` aplicada
- Migración `010_drop_supabase_auth_trigger.sql` aplicada

## Checklist

### 1. Backup

```bash
# Desde Supabase Dashboard → Database → Backups
# O export manual del schema public + auth
```

### 2. Aplicar migraciones pendientes

```bash
supabase db push
# o aplicar 010_drop_supabase_auth_trigger.sql manualmente en SQL Editor
```

### 3. Migrar usuarios (si aún no se ejecutó)

```bash
npm run migrate:auth-users
```

Verifica que cada usuario existente tenga fila en `auth_user` y `auth_account` (provider `credential`).

### 4. Deploy

- Deploy de la rama con Better Auth + GitHub OAuth
- Confirmar que `BETTER_AUTH_URL` apunta al dominio de producción (ej. `https://synchrodev.cl`)

### 5. Smoke tests

| Flujo | Resultado esperado |
|-------|-------------------|
| Login email/contraseña | Redirige a `/dashboard` |
| Login GitHub (usuario invitado) | Redirige a `/dashboard` |
| Forgot password | Correo Resend + reset OK |
| Invitar usuario (admin) | Correo + set password OK |
| Perfil → Conectar GitHub | Muestra @username |
| Perfil → Desconectar GitHub | Estado desconectado |
| Usuario sin perfil intenta GitHub | Error en login |

### 6. Comunicación a usuarios migrados

Los hashes de contraseña de Supabase **no son compatibles** con Better Auth (scrypt vs bcrypt). Cada usuario migrado debe:

1. Ir a `/auth/forgot-password`
2. Establecer una nueva contraseña
3. (Opcional) Vincular GitHub desde `/profile`

### 7. Post-cutover

- [ ] Monitorizar logs 24 h (errores 401/500 en `/api/auth/*`)
- [ ] Deshabilitar Supabase Auth en Dashboard (opcional; Postgres sigue activo)
- [ ] Etiquetar release `v0.2.5`

## Rollback

1. Restaurar backup de base de datos
2. Revertir deploy al commit anterior a Better Auth
3. Reactivar Supabase Auth en Dashboard si se deshabilitó

## Plan de rollback documentado

Mantener snapshot de `auth.users` y tablas `auth_*` antes del cutover para comparación y recuperación puntual.
