import type { ReactNode } from 'react'

export function RegistroTitle({
  eyebrow,
  title,
  subtitle,
  action,
}: {
  eyebrow?: string
  title: string
  subtitle?: string
  action?: ReactNode
}) {
  return (
    <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {eyebrow && <p className="text-[13px] text-muted-foreground">{eyebrow}</p>}
        <h1 className="text-[28px] font-semibold tracking-tight text-foreground sm:text-[32px]">{title}</h1>
        {subtitle && <p className="mt-1 max-w-xl text-[14px] text-muted-foreground">{subtitle}</p>}
      </div>
      {action}
    </header>
  )
}
