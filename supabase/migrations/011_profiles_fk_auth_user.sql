-- CC-23082026: desacoplar profiles de Supabase Auth (auth.users).
-- La identidad vive en auth_user (Better Auth). Validamos con trigger.

-- 1. Asegurar fila auth_user para cada perfil existente
INSERT INTO auth_user (id, name, email, "emailVerified", image, "createdAt", "updatedAt")
SELECT
  p.id::text,
  COALESCE(p.full_name, 'Usuario'),
  lower(trim(p.email)),
  false,
  p.avatar_url,
  COALESCE(p.created_at, NOW()),
  NOW()
FROM profiles p
LEFT JOIN auth_user u ON u.id = p.id::text
WHERE u.id IS NULL
  AND p.email IS NOT NULL
  AND trim(p.email) <> '';

-- 2. Quitar FK legacy hacia Supabase Auth
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;

-- 3. Validar que cada perfil tenga auth_user (sin FK por tipos uuid/text)
CREATE OR REPLACE FUNCTION public.validate_profile_auth_user()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.auth_user WHERE id = NEW.id::text) THEN
    RAISE EXCEPTION 'El perfil requiere un usuario en auth_user (id=%)', NEW.id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_require_auth_user ON public.profiles;
CREATE TRIGGER profiles_require_auth_user
  BEFORE INSERT OR UPDATE OF id ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_profile_auth_user();

-- 4. Permitir eliminar usuarios que crearon sprints
ALTER TABLE public.sprints DROP CONSTRAINT IF EXISTS sprints_created_by_fkey;
ALTER TABLE public.sprints
  ADD CONSTRAINT sprints_created_by_fkey
  FOREIGN KEY (created_by) REFERENCES public.profiles(id) ON DELETE SET NULL;
