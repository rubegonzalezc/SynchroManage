import type { ReactNode } from 'react'
import Link from 'next/link'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { DashboardStatTile } from './DashboardStatTile'

export interface DashboardStat {
  title: string
  value: number | string
  description?: string
  href: string
}

export interface DashboardTaskItem {
  id: string
  number: number | null
  title: string
  projectName: string
  href: string
  dueLabel: string | null
  overdue: boolean
  priority: string
}

export interface DashboardProjectItem {
  id: string
  name: string
  company: string
  statusLabel: string
  statusClass: string
  href: string
}

export interface DashboardActivityItem {
  id: string
  name: string
  avatarUrl: string | null
  initials: string
  action: string
  actionClass: string
  entity: string
  entityName: string | null
  when: string
}

interface DashboardHomeProps {
  greeting: string
  dateLabel: string
  subtitle: string
  primaryHref: string
  primaryLabel: string
  progress: { done: number; total: number }
  stats: DashboardStat[]
  tasksTitle: string
  tasksDescription: string
  tasksHref: string
  tasks: DashboardTaskItem[] | null
  projectsDescription: string
  projects: DashboardProjectItem[]
  activityDescription: string | null
  activity: DashboardActivityItem[] | null
  meetings: ReactNode
  aside: ReactNode
  charts: ReactNode
}

const priorityLabel: Record<string, string> = {
  urgent: 'Urgente',
  high: 'Alta',
}

export function DashboardHome({
  greeting,
  dateLabel,
  subtitle,
  primaryHref,
  primaryLabel,
  progress,
  stats,
  tasksTitle,
  tasksDescription,
  tasksHref,
  tasks,
  projectsDescription,
  projects,
  activityDescription,
  activity,
  meetings,
  aside,
  charts,
}: DashboardHomeProps) {
  const percent = progress.total > 0 ? Math.round((progress.done / progress.total) * 100) : 0

  return (
    <div className="space-y-5 w-full overflow-x-hidden">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <p className="text-[13px] font-medium text-muted-foreground">{dateLabel}</p>
          <h1 className="mt-1 text-[32px] font-semibold tracking-tight leading-none text-foreground sm:text-[40px]">
            {greeting}
          </h1>
          <p className="mt-3 max-w-xl text-[15px] text-muted-foreground">{subtitle}</p>
        </div>
        <Link
          href={primaryHref}
          className="inline-flex h-11 shrink-0 items-center justify-center rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground"
        >
          {primaryLabel}
        </Link>
      </header>

      <section className="rounded-[28px] border border-border bg-card p-4 sm:p-5">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-[13px] text-muted-foreground">Avance de tareas</p>
            <p className="mt-1 text-[32px] font-semibold tracking-tight leading-none">{percent}%</p>
          </div>
          <p className="text-[13px] text-muted-foreground">
            {progress.done} de {progress.total}
          </p>
        </div>
        <div className="mt-4 h-2 overflow-hidden rounded-full bg-muted">
          <div className="h-full rounded-full bg-primary" style={{ width: `${percent}%` }} />
        </div>
        <div
          className="mt-5 flex gap-2 overflow-x-auto pb-1 snap-x lg:grid lg:overflow-visible"
          style={{ gridTemplateColumns: `repeat(${Math.max(stats.length, 1)}, minmax(0, 1fr))` }}
        >
          {stats.map((stat) => (
            <DashboardStatTile key={stat.title} {...stat} />
          ))}
        </div>
      </section>

      <div className={`grid gap-4 ${tasks ? 'xl:grid-cols-5' : ''}`}>
        {tasks && (
          <section className="rounded-[28px] border border-border bg-card p-4 sm:p-5 xl:col-span-3">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h2 className="text-[16px] font-semibold tracking-tight">{tasksTitle}</h2>
                <p className="mt-0.5 text-[13px] text-muted-foreground">{tasksDescription}</p>
              </div>
              <Link href={tasksHref} className="text-[13px] font-semibold text-primary">
                Ver todas
              </Link>
            </div>
            {tasks.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">No hay tareas urgentes pendientes</p>
            ) : (
              <div className="flex flex-col gap-2">
                {tasks.map((task) => (
                  <Link
                    key={task.id}
                    href={task.href}
                    className="flex gap-3 rounded-2xl border border-border bg-background px-3 py-3"
                  >
                    <span className={`mt-1 w-1 self-stretch rounded-full ${task.priority === 'urgent' ? 'bg-red-500' : 'bg-orange-500'}`} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[15px] font-semibold">{task.title}</span>
                      <span className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[12px] text-muted-foreground">
                        <span>#{task.number ?? '—'}</span>
                        <span className="truncate">{task.projectName}</span>
                        {task.dueLabel && (
                          <span className={task.overdue ? 'font-semibold text-red-600 dark:text-red-400' : ''}>
                            {task.dueLabel}
                          </span>
                        )}
                      </span>
                    </span>
                    <span className={`h-fit rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                      task.priority === 'urgent'
                        ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                        : 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
                    }`}>
                      {priorityLabel[task.priority] || task.priority}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </section>
        )}

        <section className={`rounded-[28px] border border-border bg-card p-4 sm:p-5 ${tasks ? 'xl:col-span-2' : ''}`}>
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <h2 className="text-[16px] font-semibold tracking-tight">Proyectos</h2>
              <p className="mt-0.5 text-[13px] text-muted-foreground">{projectsDescription}</p>
            </div>
            <Link href="/projects" className="text-[13px] font-semibold text-primary">
              Ver todos
            </Link>
          </div>
          {projects.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">No hay proyectos registrados</p>
          ) : (
            <div className="flex flex-col gap-2">
              {projects.map((project) => (
                <Link
                  key={project.id}
                  href={project.href}
                  className="flex items-center gap-3 rounded-2xl border border-border bg-background px-3 py-3"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[14px] font-semibold">{project.name}</span>
                    <span className="mt-0.5 block truncate text-[12px] text-muted-foreground">{project.company}</span>
                  </span>
                  <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${project.statusClass}`}>
                    {project.statusLabel}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>

      {meetings}

      {(activity || aside) && (
        <div className={`grid gap-4 ${aside ? 'lg:grid-cols-2' : ''}`}>
          {activity && (
            <section className="rounded-[28px] border border-border bg-card p-4 sm:p-5">
              <h2 className="text-[16px] font-semibold tracking-tight">Actividad</h2>
              <p className="mt-0.5 mb-4 text-[13px] text-muted-foreground">{activityDescription}</p>
              {activity.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">No hay actividad reciente</p>
              ) : (
                <ol className="space-y-3">
                  {activity.map((item) => (
                    <li key={item.id} className="flex gap-3">
                      <Avatar className="mt-0.5 h-8 w-8 shrink-0">
                        <AvatarImage src={item.avatarUrl || undefined} />
                        <AvatarFallback className="text-[10px]">{item.initials}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="text-[13px] leading-snug text-foreground">
                          <span className="font-semibold">{item.name}</span>
                          {' '}
                          <span className={item.actionClass}>{item.action}</span>
                          {' '}
                          {item.entity}
                          {item.entityName && <span className="font-medium"> “{item.entityName}”</span>}
                        </p>
                        <p className="mt-0.5 text-[11px] text-muted-foreground">{item.when}</p>
                      </div>
                    </li>
                  ))}
                </ol>
              )}
            </section>
          )}
          {aside && <div className="flex flex-col gap-4">{aside}</div>}
        </div>
      )}

      {charts}
    </div>
  )
}
