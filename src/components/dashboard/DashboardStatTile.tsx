import type { ReactNode } from 'react'
import Link from 'next/link'

export function DashboardStatTile({
  title,
  value,
  description,
  href,
}: {
  title: string
  value: ReactNode
  description?: string
  href: string
}) {
  return (
    <Link
      href={href}
      className="snap-start shrink-0 min-w-[148px] lg:min-w-0 rounded-2xl border border-border bg-background px-3.5 py-3 transition-colors hover:border-primary/40"
    >
      <p className="text-[12px] font-medium text-muted-foreground">{title}</p>
      <p className="mt-1 text-[26px] font-semibold tracking-tight leading-none text-foreground">{value}</p>
      {description && (
        <p className="mt-1.5 text-[12px] text-muted-foreground truncate">{description}</p>
      )}
    </Link>
  )
}
