-- CC-07112026 / SynchroManaha - Security
-- RLS de categorías, funciones de autorización fuera de la API pública,
-- políticas de sprints, bugs y perfiles, y plan_key para reimportar.

CREATE SCHEMA IF NOT EXISTS private;

REVOKE ALL ON SCHEMA private FROM PUBLIC;
GRANT USAGE ON SCHEMA private TO authenticated, service_role;

CREATE OR REPLACE FUNCTION private.get_user_role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT r.name
  FROM public.roles r
  INNER JOIN public.profiles p ON p.role_id = r.id
  WHERE p.id = auth.uid()
$$;

CREATE OR REPLACE FUNCTION private.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT private.get_user_role() = 'admin'
$$;

CREATE OR REPLACE FUNCTION private.can_see_project(target_project uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    private.is_admin()
    OR EXISTS (
      SELECT 1
      FROM public.projects pr
      LEFT JOIN public.project_members pm ON pm.project_id = pr.id
      WHERE pr.id = target_project
        AND (
          pr.pm_id = auth.uid()
          OR pr.tech_lead_id = auth.uid()
          OR pm.user_id = auth.uid()
        )
    )
$$;

CREATE OR REPLACE FUNCTION private.can_manage_project(target_project uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    private.is_admin()
    OR EXISTS (
      SELECT 1
      FROM public.projects pr
      WHERE pr.id = target_project
        AND pr.pm_id = auth.uid()
    )
$$;

REVOKE ALL ON FUNCTION private.get_user_role() FROM PUBLIC;
REVOKE ALL ON FUNCTION private.is_admin() FROM PUBLIC;
REVOKE ALL ON FUNCTION private.can_see_project(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION private.can_manage_project(uuid) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION private.get_user_role() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION private.is_admin() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION private.can_see_project(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION private.can_manage_project(uuid) TO authenticated, service_role;

-- Políticas que llamaban public.is_admin()
DROP POLICY IF EXISTS "Admins can view all activity" ON public.activity_log;
CREATE POLICY "Admins can view all activity" ON public.activity_log
  FOR SELECT TO authenticated
  USING (private.is_admin());

DROP POLICY IF EXISTS "Companies modifiable by admins" ON public.companies;
CREATE POLICY "Companies modifiable by admins" ON public.companies
  FOR ALL TO authenticated
  USING (private.is_admin())
  WITH CHECK (private.is_admin());

DROP POLICY IF EXISTS "Admins can update any profile" ON public.profiles;
CREATE POLICY "Admins can update any profile" ON public.profiles
  FOR UPDATE TO authenticated
  USING (private.is_admin())
  WITH CHECK (private.is_admin());

DROP POLICY IF EXISTS "Users can view profiles" ON public.profiles;
CREATE POLICY "Users can view profiles" ON public.profiles
  FOR SELECT TO authenticated
  USING ((id = auth.uid()) OR private.is_admin());

DROP POLICY IF EXISTS "Allow rut lookup for login" ON public.profiles;

DROP POLICY IF EXISTS "Admins can update settings" ON public.system_settings;
CREATE POLICY "Admins can update settings" ON public.system_settings
  FOR UPDATE TO authenticated
  USING (private.is_admin())
  WITH CHECK (private.is_admin());

DROP POLICY IF EXISTS "Admins can view settings" ON public.system_settings;
CREATE POLICY "Admins can view settings" ON public.system_settings
  FOR SELECT TO authenticated
  USING (private.is_admin());

DROP FUNCTION IF EXISTS public.is_admin();
DROP FUNCTION IF EXISTS public.get_user_role();

-- HU-01
ALTER TABLE public.task_categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS task_categories_select ON public.task_categories;
CREATE POLICY task_categories_select ON public.task_categories
  FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS task_categories_insert ON public.task_categories;
CREATE POLICY task_categories_insert ON public.task_categories
  FOR INSERT TO authenticated
  WITH CHECK (private.is_admin());

DROP POLICY IF EXISTS task_categories_update ON public.task_categories;
CREATE POLICY task_categories_update ON public.task_categories
  FOR UPDATE TO authenticated
  USING (private.is_admin())
  WITH CHECK (private.is_admin());

DROP POLICY IF EXISTS task_categories_delete ON public.task_categories;
CREATE POLICY task_categories_delete ON public.task_categories
  FOR DELETE TO authenticated
  USING (private.is_admin());

-- HU-03
DROP POLICY IF EXISTS sprints_delete ON public.sprints;
DROP POLICY IF EXISTS sprints_insert ON public.sprints;
DROP POLICY IF EXISTS sprints_select ON public.sprints;
DROP POLICY IF EXISTS sprints_update ON public.sprints;

CREATE POLICY sprints_select ON public.sprints
  FOR SELECT TO authenticated
  USING (private.can_see_project(project_id));

CREATE POLICY sprints_insert ON public.sprints
  FOR INSERT TO authenticated
  WITH CHECK (private.can_manage_project(project_id));

CREATE POLICY sprints_update ON public.sprints
  FOR UPDATE TO authenticated
  USING (private.can_manage_project(project_id))
  WITH CHECK (private.can_manage_project(project_id));

CREATE POLICY sprints_delete ON public.sprints
  FOR DELETE TO authenticated
  USING (private.can_manage_project(project_id));

DROP POLICY IF EXISTS "Authenticated users can manage bugs" ON public.bugs;

CREATE POLICY bugs_select ON public.bugs
  FOR SELECT TO authenticated
  USING (private.can_see_project(project_id));

CREATE POLICY bugs_insert ON public.bugs
  FOR INSERT TO authenticated
  WITH CHECK (private.can_see_project(project_id));

CREATE POLICY bugs_update ON public.bugs
  FOR UPDATE TO authenticated
  USING (private.can_see_project(project_id))
  WITH CHECK (private.can_see_project(project_id));

CREATE POLICY bugs_delete ON public.bugs
  FOR DELETE TO authenticated
  USING (private.can_manage_project(project_id));

-- HU-05
ALTER TABLE public.tasks
  ADD COLUMN IF NOT EXISTS plan_key text;

UPDATE public.tasks
SET plan_key = 'HU-' || sprint_order::text
WHERE sprint_id IS NOT NULL
  AND sprint_order IS NOT NULL
  AND plan_key IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS tasks_sprint_plan_key_uidx
  ON public.tasks (sprint_id, plan_key)
  WHERE plan_key IS NOT NULL AND sprint_id IS NOT NULL;
