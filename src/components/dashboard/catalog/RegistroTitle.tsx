import type { CSSProperties, ReactNode } from 'react'

export const registroHeadingStyle: CSSProperties = {
  fontFamily: 'Georgia, "Iowan Old Style", Palatino, serif',
}

export function RegistroTitle({
  eyebrow = 'Registro',
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
    <header className="flex flex-col gap-4 border-b border-foreground/20 pb-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-muted-foreground">{eyebrow}</p>
        <h1 className="mt-1 text-[34px] leading-none tracking-tight text-foreground sm:text-[42px]" style={registroHeadingStyle}>
          {title}
        </h1>
        {subtitle && <p className="mt-2 max-w-xl text-[14px] text-muted-foreground">{subtitle}</p>}
      </div>
      {action}
    </header>
  )
}
