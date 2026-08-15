'use client'

import Link from 'next/link'
import { Calendar } from 'lucide-react'
import { categoryIcons, categoryLabels, categoryColors } from '@/lib/constants/categories'
import { DashboardSection } from '@/components/dashboard/DashboardSection'

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
    <DashboardSection
      title="Tareas sin asignar"
      description="Requieren un responsable para avanzar"
      action={
        <span className="text-[12px] font-semibold rounded-full px-2.5 py-0.5 bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400">
          {tasks.length}
        </span>
      }
    >
      {tasks.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">Todas las tareas están asignadas</p>
      ) : (
        <div className="space-y-1">
          {tasks.map(task => {
            const base = task.project?.type === 'change_control' ? '/change-controls' : '/projects'
            const href = task.project ? `${base}/${task.project.id}?highlight=${task.id}` : '#'
            return (
              <Link
                key={task.id}
                href={href}
                className="flex flex-col sm:flex-row sm:items-center gap-2 rounded-2xl px-2 py-2.5 hover:bg-black/[0.04] dark:hover:bg-white/[0.06] transition-colors"
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  {task.task_number && (
                    <span className="text-[11px] text-muted-foreground flex-shrink-0">
                      #{task.task_number}
                    </span>
                  )}
                  <span className="text-[14px] font-medium text-foreground truncate">{task.title}</span>
                </div>
                <div className="flex items-center gap-2 flex-wrap shrink-0">
                  {task.project && (
                    <span className="text-[12px] text-muted-foreground truncate max-w-[140px]">
                      {task.project.name}
                    </span>
                  )}
                  {task.category && (
                    <span className={`text-[11px] font-semibold rounded-full px-2.5 py-0.5 ${categoryColors[task.category] || 'bg-slate-100 text-slate-700'}`}>
                      {categoryIcons[task.category]} {categoryLabels[task.category] || task.category}
                    </span>
                  )}
                  <span className={`text-[11px] font-semibold rounded-full px-2.5 py-0.5 ${priorityColors[task.priority] || ''}`}>
                    {priorityLabels[task.priority] || task.priority}
                  </span>
                  {task.due_date && (
                    <span className={`flex items-center gap-1 text-[12px] ${new Date(task.due_date) < new Date() ? 'text-red-500 font-semibold' : 'text-muted-foreground'}`}>
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
    </DashboardSection>
  )
}
