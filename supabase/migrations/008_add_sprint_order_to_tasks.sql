-- Orden secuencial de tareas dentro de cada sprint (HU-1, HU-2, ...)
-- No reemplaza task_number global del proyecto.

ALTER TABLE public.tasks
  ADD COLUMN IF NOT EXISTS sprint_order INTEGER;

COMMENT ON COLUMN public.tasks.sprint_order IS
  'Orden secuencial dentro del sprint (1, 2, 3...). NULL si la tarea no tiene sprint asignado.';

-- Índice único parcial: un solo orden por posición dentro de cada sprint
CREATE UNIQUE INDEX IF NOT EXISTS idx_tasks_sprint_id_sprint_order_unique
  ON public.tasks (sprint_id, sprint_order)
  WHERE sprint_id IS NOT NULL AND sprint_order IS NOT NULL;

-- Backfill: tareas con sprint reciben orden según position y, en empate, created_at
WITH ranked AS (
  SELECT
    id,
    ROW_NUMBER() OVER (
      PARTITION BY sprint_id
      ORDER BY position ASC NULLS LAST, created_at ASC, id ASC
    )::INTEGER AS new_sprint_order
  FROM public.tasks
  WHERE sprint_id IS NOT NULL
)
UPDATE public.tasks AS t
SET sprint_order = ranked.new_sprint_order
FROM ranked
WHERE t.id = ranked.id;

-- Asegurar null cuando no hay sprint
UPDATE public.tasks
SET sprint_order = NULL
WHERE sprint_id IS NULL;

-- Mantener coherencia: sin sprint => sin orden
CREATE OR REPLACE FUNCTION public.sync_task_sprint_order()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.sprint_id IS NULL THEN
    NEW.sprint_order := NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_task_sprint_order ON public.tasks;

CREATE TRIGGER trg_sync_task_sprint_order
BEFORE INSERT OR UPDATE OF sprint_id, sprint_order ON public.tasks
FOR EACH ROW
EXECUTE FUNCTION public.sync_task_sprint_order();
