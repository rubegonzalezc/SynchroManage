-- Migration 003: Create task_categories table
-- Applied manually via Supabase SQL Editor

CREATE TABLE public.task_categories (
  slug        TEXT PRIMARY KEY,
  label       TEXT NOT NULL,
  icon        TEXT NOT NULL,
  color       TEXT NOT NULL,
  order_index INT  NOT NULL DEFAULT 0
);

INSERT INTO public.task_categories (slug, label, icon, color, order_index) VALUES
  ('task',        'Tarea',         '📋', 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',         0),
  ('bug',         'Bug',           '🐛', 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',              1),
  ('feature',     'Feature',       '✨', 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400',  2),
  ('hotfix',      'Hotfix',        '🔥', 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400',  3),
  ('fix',         'Fix',           '🔧', 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',  4),
  ('improvement', 'Mejora',        '📈', 'bg-cyan-100 text-cyan-600 dark:bg-cyan-900/30 dark:text-cyan-400',          5),
  ('refactor',    'Refactor',      '♻️', 'bg-teal-100 text-teal-600 dark:bg-teal-900/30 dark:text-teal-400',          6),
  ('docs',        'Documentación', '📝', 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',          7),
  ('test',        'Test',          '🧪', 'bg-pink-100 text-pink-600 dark:bg-pink-900/30 dark:text-pink-400',          8),
  ('chore',       'Chore',         '🔨', 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',             9);

ALTER TABLE public.tasks
  ADD CONSTRAINT tasks_category_fkey
  FOREIGN KEY (category) REFERENCES public.task_categories(slug)
  ON UPDATE CASCADE;
