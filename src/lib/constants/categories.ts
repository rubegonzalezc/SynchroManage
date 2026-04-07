/**
 * Fuente de verdad compartida para las categorías de tareas.
 * Refleja exactamente la tabla `task_categories` en Supabase.
 * Importar desde aquí en lugar de hardcodear en cada componente.
 */

export interface TaskCategory {
  slug: string
  label: string
  icon: string
  color: string
  orderIndex: number
}

export const TASK_CATEGORIES: TaskCategory[] = [
  { slug: 'task',        label: 'Tarea',         icon: '📋', color: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',         orderIndex: 0 },
  { slug: 'feature',     label: 'Feature',       icon: '✨', color: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400',  orderIndex: 1 },
  { slug: 'hotfix',      label: 'Hotfix',        icon: '🔥', color: 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400',  orderIndex: 2 },
  { slug: 'fix',         label: 'Fix',           icon: '🔧', color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',  orderIndex: 3 },
  { slug: 'improvement', label: 'Mejora',        icon: '📈', color: 'bg-cyan-100 text-cyan-600 dark:bg-cyan-900/30 dark:text-cyan-400',          orderIndex: 4 },
  { slug: 'refactor',    label: 'Refactor',      icon: '♻️', color: 'bg-teal-100 text-teal-600 dark:bg-teal-900/30 dark:text-teal-400',          orderIndex: 5 },
  { slug: 'docs',        label: 'Documentación', icon: '📝', color: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',          orderIndex: 6 },
  { slug: 'test',        label: 'Test',          icon: '🧪', color: 'bg-pink-100 text-pink-600 dark:bg-pink-900/30 dark:text-pink-400',          orderIndex: 7 },
  { slug: 'chore',       label: 'Chore',         icon: '🔨', color: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',             orderIndex: 8 },
]

/** Lookup O(n) por slug. Devuelve undefined si no existe. */
export function getCategoryBySlug(slug: string | undefined | null): TaskCategory | undefined {
  if (!slug) return undefined
  return TASK_CATEGORIES.find(c => c.slug === slug)
}

/** Mapas rápidos derivados de TASK_CATEGORIES para compatibilidad con código existente */
export const categoryLabels: Record<string, string> = Object.fromEntries(
  TASK_CATEGORIES.map(c => [c.slug, c.label])
)
export const categoryIcons: Record<string, string> = Object.fromEntries(
  TASK_CATEGORIES.map(c => [c.slug, c.icon])
)
export const categoryColors: Record<string, string> = Object.fromEntries(
  TASK_CATEGORIES.map(c => [c.slug, c.color])
)
