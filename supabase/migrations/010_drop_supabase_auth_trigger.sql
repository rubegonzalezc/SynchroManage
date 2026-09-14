-- CC-23082026: eliminar trigger legacy de Supabase Auth.
-- Los perfiles se crean en inviteUserWithBetterAuth(), no al registrarse en auth.users.

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
