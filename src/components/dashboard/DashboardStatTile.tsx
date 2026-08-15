'use client'

import type { ReactNode } from 'react'
import Link from 'next/link'
import { GlassPanel } from '@/components/ui/glass-panel'

export function DashboardStatTile({
  title,
  value,
  description,
  href,
  accent = '#0A84FF',
}: {
  title: string
  value: ReactNode
  description?: string
  href: string
  accent?: string
}) {
  return (
    <Link href={href} className="block h-full min-w-0">
      <GlassPanel
        padding={2.25}
        sx={{
          height: '100%',
          transition: 'transform 400ms cubic-bezier(0.22, 1, 0.36, 1), box-shadow 400ms cubic-bezier(0.22, 1, 0.36, 1)',
          '&:hover': {
            transform: 'translateY(-3px)',
            boxShadow: '0 18px 40px rgba(15, 23, 42, 0.1)',
          },
        }}
      >
        <p className="text-[12px] font-medium text-muted-foreground tracking-tight">{title}</p>
        <p
          className="text-[28px] font-semibold tracking-tight leading-none mt-2"
          style={{ color: accent }}
        >
          {value}
        </p>
        {description && (
          <p className="text-[12px] text-muted-foreground mt-1.5">{description}</p>
        )}
      </GlassPanel>
    </Link>
  )
}
