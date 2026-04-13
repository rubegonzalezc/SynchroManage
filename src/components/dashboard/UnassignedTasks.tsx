'use client'

import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { UserX, Calendar } from 'lucide-react'
import { categoryIcons, categoryLabels, categoryColors } from '@/lib/constants/categories'

interface UnassignedTask {
  id: string
  task_number: number | null
  title: string
  status: string
  priority: string
  category: string | null
  due_date: string | null
  project: { id: string; name: string; type: string } | null
}

const priorityColors: Record<string, string> = {
  low: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
  medium: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
  high: 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400',
  urgent: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
}

const priorityLabels: Record<string, string> = {
  low: 'Baja', medium: 'Media', high: 'Alta', urgent: 'Urgente',
}

interface UnassignedTasksProps {
  tasks: UnassignedTask[]
}

export function UnassignedTasks({ tasks }: UnassignedTasksProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <UserX className="w-4 h-4 text-rose-500" />
          Tareas sin Asignar
          <Badge variant="secondary" className="ml-1 bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400">
            {tasks.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {tasks.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">Todas las tareas están asignadas</p>
        ) : (
          <div className="space-y-2">
            {tasks.map(task => {
              const base = task.project?.type === 'change_control' ? '/change-controls' : '/projects'
              const href = task.project ? `${base}/${task.project.id}?highlight=${task.id}` : '#'
              return (
                <Link
                  key={task.id}
                  href={href}
                  className="flex flex-col sm:flex-row sm:items-center gap-2 p-3 rounded-lg border border-border hover:bg-muted/30 hover:border-primary/40 transition-colors"
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    {task.task_number && (
                      <span className="text-xs font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded shrink-0">
                        #{task.task_number}
                      </span>
                    )}
                    <span className="text-sm font-medium text-foreground truncate">{task.title}</span>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap shrink-0">
                    {task.project && (
                      <span className="text-xs text-muted-foreground truncate max-w-[140px]">
                        {task.project.name}
                      </span>
                    )}
                    {task.category && (
                      <Badge variant="secondary" className={`text-xs ${categoryColors[task.category] || ''}`}>
                        {categoryIcons[task.category]} {categoryLabels[task.category] || task.category}
                      </Badge>
                    )}
                    <Badge variant="secondary" className={`text-xs ${priorityColors[task.priority] || ''}`}>
                      {priorityLabels[task.priority] || task.priority}
                    </Badge>
                    {task.due_date && (
                      <span className={`flex items-center gap-1 text-xs ${new Date(task.due_date) < new Date() ? 'text-red-500' : 'text-muted-foreground'}`}>
                        <Calendar className="w-3 h-3" />
                        {new Date(task.due_date).toLocaleDateString('es-CL', { day: '2-digit', month: 'short' })}
                      </span>
                    )}
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
