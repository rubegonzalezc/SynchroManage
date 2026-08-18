-- Dependencias múltiples entre tareas (N:M)
CREATE TABLE IF NOT EXISTS public.task_dependencies (
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  depends_on_task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (task_id, depends_on_task_id),
  CONSTRAINT task_dependencies_no_self_reference CHECK (task_id <> depends_on_task_id)
);

CREATE INDEX IF NOT EXISTS idx_task_dependencies_task_id
  ON public.task_dependencies(task_id);

CREATE INDEX IF NOT EXISTS idx_task_dependencies_depends_on_task_id
  ON public.task_dependencies(depends_on_task_id);

-- Migrar dependencias existentes (1:1) a la tabla puente
INSERT INTO public.task_dependencies (task_id, depends_on_task_id)
SELECT id, depends_on_task_id
FROM public.tasks
WHERE depends_on_task_id IS NOT NULL
ON CONFLICT (task_id, depends_on_task_id) DO NOTHING;

-- Mantener depends_on_task_id como primera dependencia (compatibilidad)
CREATE OR REPLACE FUNCTION public.sync_task_primary_dependency()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.tasks
  SET depends_on_task_id = (
    SELECT td.depends_on_task_id
    FROM public.task_dependencies td
    WHERE td.task_id = COALESCE(NEW.task_id, OLD.task_id)
    ORDER BY td.created_at ASC
    LIMIT 1
  )
  WHERE id = COALESCE(NEW.task_id, OLD.task_id);
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_task_primary_dependency ON public.task_dependencies;

CREATE TRIGGER trg_sync_task_primary_dependency
AFTER INSERT OR UPDATE OR DELETE ON public.task_dependencies
FOR EACH ROW
EXECUTE FUNCTION public.sync_task_primary_dependency();

-- Sincronizar filas ya migradas
UPDATE public.tasks t
SET depends_on_task_id = sub.depends_on_task_id
FROM (
  SELECT task_id, depends_on_task_id
  FROM public.task_dependencies
) sub
WHERE t.id = sub.task_id
  AND t.depends_on_task_id IS DISTINCT FROM sub.depends_on_task_id;

ALTER TABLE public.task_dependencies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "task_dependencies_select_authenticated"
  ON public.task_dependencies FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "task_dependencies_all_service"
  ON public.task_dependencies FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
