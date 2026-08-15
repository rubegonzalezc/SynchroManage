'use client'

import type { ReactNode } from 'react'
import { GlassPanel } from '@/components/ui/glass-panel'

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
    <GlassPanel sx={{ height: '100%' }}>
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="min-w-0">
          <h3 className="text-[17px] font-semibold tracking-tight text-foreground">{title}</h3>
          {description && (
            <p className="text-[13px] text-muted-foreground mt-0.5">{description}</p>
          )}
        </div>
        {action}
      </div>
      {children}
    </GlassPanel>
  )
}
