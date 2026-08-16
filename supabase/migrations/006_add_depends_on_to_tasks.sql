-- Dependencia entre tareas: una tarea puede requerir que otra se complete primero
ALTER TABLE public.tasks
  ADD COLUMN IF NOT EXISTS depends_on_task_id UUID REFERENCES public.tasks(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_tasks_depends_on_task_id ON public.tasks(depends_on_task_id);

ALTER TABLE public.tasks
  DROP CONSTRAINT IF EXISTS tasks_no_self_dependency;

ALTER TABLE public.tasks
  ADD CONSTRAINT tasks_no_self_dependency
  CHECK (depends_on_task_id IS NULL OR depends_on_task_id <> id);
