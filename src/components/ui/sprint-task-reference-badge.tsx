import { cn } from '@/lib/utils'

interface SprintTaskReferenceBadgeProps {
  label: string
  className?: string
  title?: string
}

/** Badge compacto para referencia Sprint · HU-N (vista lista y diálogos). */
export function SprintTaskReferenceBadge({
  label,
  className,
  title,
}: SprintTaskReferenceBadgeProps) {
  return (
    <span
      title={title}
      className={cn(
        'inline-flex items-center text-[11px] font-mono font-semibold shrink-0',
        'text-blue-700 dark:text-blue-300',
        'bg-blue-50 dark:bg-blue-950/40 px-1.5 py-0.5 rounded',
        className
      )}
    >
      {label}
    </span>
  )
}
