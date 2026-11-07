import type { ReactNode } from 'react'
import Link from 'next/link'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { RegistroTitle } from './catalog/RegistroTitle'

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

function LedgerHead({ title, description, href, hrefLabel }: { title: string; description: string; href: string; hrefLabel: string }) {
  return (
    <div className="mb-3 flex items-end justify-between gap-3">
      <div>
        <h2 className="text-[16px] font-semibold tracking-tight">{title}</h2>
        <p className="mt-0.5 text-[13px] text-muted-foreground">{description}</p>
      </div>
      <Link href={href} className="text-[13px] font-medium text-primary">
        {hrefLabel}
      </Link>
    </div>
  )
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
    <div className="w-full overflow-x-hidden">
      <RegistroTitle
        eyebrow={dateLabel}
        title={greeting}
        subtitle={subtitle}
        action={
          <Link
            href={primaryHref}
            className="inline-flex h-10 items-center justify-center rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground"
          >
            {primaryLabel}
          </Link>
        }
      />

      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <div className="rounded-2xl border border-border bg-card px-4 py-4">
          <p className="text-[13px] text-muted-foreground">Avance</p>
          <p className="mt-2 text-[28px] font-semibold tabular-nums leading-none">{percent}%</p>
          <p className="mt-2 text-[12px] text-muted-foreground">{progress.done} de {progress.total}</p>
        </div>
        {stats.map((stat) => (
          <Link key={stat.title} href={stat.href} className="rounded-2xl border border-border bg-card px-4 py-4 transition-colors hover:border-primary/40">
            <p className="text-[13px] text-muted-foreground">{stat.title}</p>
            <p className="mt-2 text-[28px] font-semibold tabular-nums leading-none">{stat.value}</p>
            {stat.description && <p className="mt-2 truncate text-[12px] text-muted-foreground">{stat.description}</p>}
          </Link>
        ))}
      </div>

      <div className={`mt-8 grid gap-8 ${tasks ? 'xl:grid-cols-5' : ''}`}>
        {tasks && (
          <section className="rounded-2xl border border-border bg-card p-4 sm:p-5 xl:col-span-3">
            <LedgerHead title={tasksTitle} description={tasksDescription} href={tasksHref} hrefLabel="Ver todas" />
            {tasks.length === 0 ? (
              <p className="py-8 text-[14px] text-muted-foreground">No hay tareas urgentes pendientes</p>
            ) : (
              <ul>
                {tasks.map((task) => (
                  <li key={task.id} className="border-b border-foreground/10">
                    <Link href={task.href} className="flex items-start gap-3 py-3">
                      <span className={`mt-1.5 h-2.5 w-2.5 shrink-0 ${task.priority === 'urgent' ? 'bg-rose-600' : 'bg-amber-500'}`} />
                      <span className="min-w-0 flex-1">
                        <span className="block text-[16px] font-medium leading-snug">{task.title}</span>
                        <span className="mt-1 block text-[13px] text-muted-foreground">
                          #{task.number ?? '—'} · {task.projectName}
                          {task.dueLabel ? ` · ${task.dueLabel}` : ''}
                          {task.overdue ? ' · Vencida' : ''}
                        </span>
                      </span>
                      <span className="text-[11px] uppercase tracking-[0.12em]">
                        {priorityLabel[task.priority] || task.priority}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}

        <section className={`rounded-2xl border border-border bg-card p-4 sm:p-5 ${tasks ? 'xl:col-span-2' : ''}`}>
          <LedgerHead title="Proyectos" description={projectsDescription} href="/projects" hrefLabel="Ver todos" />
          {projects.length === 0 ? (
            <p className="py-8 text-[14px] text-muted-foreground">No hay proyectos registrados</p>
          ) : (
            <ul>
              {projects.map((project) => (
                <li key={project.id} className="border-b border-foreground/10">
                  <Link href={project.href} className="flex items-start justify-between gap-3 py-3">
                    <span className="min-w-0">
                      <span className="block text-[16px] font-medium leading-snug">{project.name}</span>
                      <span className="mt-1 block text-[13px] text-muted-foreground">{project.company}</span>
                    </span>
                    <span className="text-[11px] uppercase tracking-[0.12em]">{project.statusLabel}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <div className="mt-8">{meetings}</div>

      {(activity || aside) && (
        <div className={`mt-8 grid gap-8 ${aside ? 'lg:grid-cols-2' : ''}`}>
          {activity && (
            <section className="rounded-2xl border border-border bg-card p-4 sm:p-5">
              <h2 className="text-[16px] font-semibold tracking-tight">Actividad</h2>
              <p className="mt-0.5 mb-3 text-[13px] text-muted-foreground">{activityDescription}</p>
              {activity.length === 0 ? (
                <p className="py-6 text-[14px] text-muted-foreground">No hay actividad reciente</p>
              ) : (
                <ol>
                  {activity.map((item) => (
                    <li key={item.id} className="flex gap-3 border-b border-foreground/10 py-3">
                      <Avatar className="mt-0.5 h-8 w-8 shrink-0">
                        <AvatarImage src={item.avatarUrl || undefined} />
                        <AvatarFallback className="text-[10px]">{item.initials}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="text-[14px] leading-snug">
                          <span className="font-medium">{item.name}</span>{' '}
                          <span className={item.actionClass}>{item.action}</span>{' '}
                          {item.entity}
                          {item.entityName && <span className="font-medium"> “{item.entityName}”</span>}
                        </p>
                        <p className="mt-1 text-[12px] text-muted-foreground">{item.when}</p>
                      </div>
                    </li>
                  ))}
                </ol>
              )}
            </section>
          )}
          {aside && <div className="flex flex-col gap-8">{aside}</div>}
        </div>
      )}

      {charts && <div className="mt-8">{charts}</div>}
    </div>
  )
}
