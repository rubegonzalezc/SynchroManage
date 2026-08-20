-- Guarda la HU del sprint de origen al hacer carry-over (ej. Sprint anterior HU-2)

ALTER TABLE public.tasks
  ADD COLUMN IF NOT EXISTS carry_over_sprint_order INTEGER;

COMMENT ON COLUMN public.tasks.carry_over_sprint_order IS
  'Orden HU del sprint anterior al hacer carry-over. NULL si no es carry o no había orden.';
