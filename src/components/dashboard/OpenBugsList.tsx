'use client'

import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Bug, Calendar } from 'lucide-react'

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
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Bug className="w-4 h-4 text-red-500" />
          Bugs Abiertos
          <Badge variant="secondary" className="ml-1 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
            {bugs.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {bugs.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">No hay bugs abiertos</p>
        ) : (
          <div className="space-y-2">
            {bugs.map(bug => {
              const sev = severityConfig[bug.severity] ?? severityConfig.medium
              const href = bug.project ? `/projects/${bug.project.id}?tab=bugs` : '#'
              return (
                <Link
                  key={bug.id}
                  href={href}
                  className="flex flex-col sm:flex-row sm:items-center gap-2 p-3 rounded-lg border border-border hover:bg-muted/30 hover:border-red-200 dark:hover:border-red-800 transition-colors"
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <Bug className="w-3.5 h-3.5 text-red-500 shrink-0" />
                    <span className="text-sm font-medium text-foreground truncate">{bug.title}</span>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap shrink-0">
                    {bug.project && (
                      <span className="text-xs text-muted-foreground truncate max-w-[120px]">{bug.project.name}</span>
                    )}
                    {bug.task && (
                      <span className="text-xs text-muted-foreground">#{bug.task.task_number}</span>
                    )}
                    <Badge variant="secondary" className={`text-xs ${sev.color}`}>{sev.label}</Badge>
                    {bug.assignee ? (
                      <div className="flex items-center gap-1">
                        <Avatar className="w-5 h-5">
                          <AvatarImage src={bug.assignee.avatar_url || undefined} />
                          <AvatarFallback className="text-[9px]">{getInitials(bug.assignee.full_name)}</AvatarFallback>
                        </Avatar>
                        <span className="text-xs text-muted-foreground">{bug.assignee.full_name}</span>
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground italic">Sin asignar</span>
                    )}
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(bug.created_at).toLocaleDateString('es-CL', { day: '2-digit', month: 'short' })}
                    </span>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
