import type { ReactNode } from 'react'

export function DashboardSection({
  title,
  description,
  action,
  children,
}: {
  title: string
  description?: string
  action?: ReactNode
  children: ReactNode
}) {
  return (
    <section>
      <div className="mb-3 flex items-end justify-between gap-3 border-b border-foreground/20 pb-2">
        <div className="min-w-0">
          <h2 className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">{title}</h2>
          {description && <p className="mt-1 text-[13px] text-muted-foreground">{description}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  )
}
