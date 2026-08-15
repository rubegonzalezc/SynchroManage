'use client'

import Link from 'next/link'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Calendar } from 'lucide-react'
import { DashboardSection } from '@/components/dashboard/DashboardSection'

interface OpenBug {
  id: string
  title: string
  severity: string
  status: string
  created_at: string
  project: { id: string; name: string } | null
  task: { id: string; task_number: number | null; title: string } | null
  assignee: { id: string; full_name: string; avatar_url: string | null } | null
}

const severityConfig: Record<string, { label: string; color: string }> = {
  low: { label: 'Baja', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
  medium: { label: 'Media', color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' },
  high: { label: 'Alta', color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' },
  critical: { label: 'Crítica', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
}

function getInitials(name: string) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

interface OpenBugsListProps {
  bugs: OpenBug[]
}

export function OpenBugsList({ bugs }: OpenBugsListProps) {
  return (
    <DashboardSection
      title="Bugs abiertos"
      description="Incidencias pendientes de resolución"
      action={
        <span className="text-[12px] font-semibold rounded-full px-2.5 py-0.5 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
          {bugs.length}
        </span>
      }
    >
      {bugs.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">No hay bugs abiertos</p>
      ) : (
        <div className="space-y-1">
          {bugs.map(bug => {
            const sev = severityConfig[bug.severity] ?? severityConfig.medium
            const href = bug.project ? `/projects/${bug.project.id}?tab=bugs` : '#'
            return (
              <Link
                key={bug.id}
                href={href}
                className="flex flex-col sm:flex-row sm:items-center gap-2 rounded-2xl px-2 py-2.5 hover:bg-black/[0.04] dark:hover:bg-white/[0.06] transition-colors"
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <span className="text-[14px] font-medium text-foreground truncate">{bug.title}</span>
                </div>
                <div className="flex items-center gap-2 flex-wrap shrink-0">
                  {bug.project && (
                    <span className="text-[12px] text-muted-foreground truncate max-w-[120px]">{bug.project.name}</span>
                  )}
                  {bug.task && (
                    <span className="text-[12px] text-muted-foreground">#{bug.task.task_number}</span>
                  )}
                  <span className={`text-[11px] font-semibold rounded-full px-2.5 py-0.5 ${sev.color}`}>{sev.label}</span>
                  {bug.assignee ? (
                    <div className="flex items-center gap-1.5">
                      <Avatar className="w-5 h-5">
                        <AvatarImage src={bug.assignee.avatar_url || undefined} />
                        <AvatarFallback className="text-[9px]">{getInitials(bug.assignee.full_name)}</AvatarFallback>
                      </Avatar>
                      <span className="text-[12px] text-muted-foreground">{bug.assignee.full_name}</span>
                    </div>
                  ) : (
                    <span className="text-[12px] text-muted-foreground italic">Sin asignar</span>
                  )}
                  <span className="text-[12px] text-muted-foreground flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {new Date(bug.created_at).toLocaleDateString('es-CL', { day: '2-digit', month: 'short' })}
                  </span>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </DashboardSection>
  )
}
