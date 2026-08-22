export const BUG_SEVERITY_CONFIG = {
  low: { label: 'Baja', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400', accent: '#30D158' },
  medium: { label: 'Media', color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400', accent: '#FF9F0A' },
  high: { label: 'Alta', color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400', accent: '#FF6723' },
  critical: { label: 'Crítica', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400', accent: '#FF453A' },
} as const

export const BUG_STATUS_CONFIG = {
  open: { label: 'Abierto', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
  in_progress: { label: 'En Progreso', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  resolved: { label: 'Resuelto', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
  closed: { label: 'Cerrado', color: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400' },
} as const

export const BUG_SEVERITY_ORDER = ['low', 'medium', 'high', 'critical'] as const
