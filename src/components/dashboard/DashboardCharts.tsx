'use client'

import dynamic from 'next/dynamic'
import { DashboardSection } from './DashboardSection'
import { useLayoutMode } from '@/hooks/use-layout-mode'

const TaskStatusChart = dynamic(() => import('./TaskStatusChart').then((mod) => mod.TaskStatusChart))
const ProjectStatusChart = dynamic(() => import('./ProjectStatusChart').then((mod) => mod.ProjectStatusChart))
const BugStatusChart = dynamic(() => import('./BugStatusChart').then((mod) => mod.BugStatusChart))
const UsersRoleChart = dynamic(() => import('./UsersRoleChart').then((mod) => mod.UsersRoleChart))

interface DashboardChartsProps {
  variant: 'admin' | 'pm' | 'developer' | 'other'
  tasksDone: number
  tasksInProgress: number
  tasksReview: number
  tasksTodo: number
  tasksBacklog: number
  projectStatusData: { name: string; count: number; color: string }[]
  bugsOpen: number
  bugsInProgress: number
  bugsResolved: number
  bugsClosed: number
  bugsTotal: number
  roleCounts: { role: string; label: string; count: number }[]
}

export function DashboardCharts({
  variant,
  tasksDone,
  tasksInProgress,
  tasksReview,
  tasksTodo,
  tasksBacklog,
  projectStatusData,
  bugsOpen,
  bugsInProgress,
  bugsResolved,
  bugsClosed,
  bugsTotal,
  roleCounts,
}: DashboardChartsProps) {
  const layout = useLayoutMode()

  const summary = [
    { label: 'Hechas', value: tasksDone, tint: 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200' },
    { label: 'En curso', value: tasksInProgress, tint: 'border-sky-200 bg-sky-50 text-sky-800 dark:border-sky-800 dark:bg-sky-950/40 dark:text-sky-200' },
    { label: 'Revisión', value: tasksReview, tint: 'border-violet-200 bg-violet-50 text-violet-800 dark:border-violet-800 dark:bg-violet-950/40 dark:text-violet-200' },
    { label: 'Bugs activos', value: bugsOpen + bugsInProgress, tint: 'border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-200' },
  ]

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {summary.map((item) => (
          <div key={item.label} className={`rounded-2xl border px-4 py-3 ${item.tint}`}>
            <p className="text-[12px] font-medium opacity-80">{item.label}</p>
            <p className="mt-1 text-[26px] font-semibold tabular-nums leading-none">{item.value}</p>
          </div>
        ))}
      </div>
      {variant === 'admin' && roleCounts.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {roleCounts.map((item) => (
            <div key={item.role} className="shrink-0 rounded-xl border border-border bg-card px-3 py-2">
              <p className="text-[18px] font-semibold tabular-nums leading-none">{item.count}</p>
              <p className="mt-1 text-[12px] text-muted-foreground">{item.label}</p>
            </div>
          ))}
        </div>
      )}
      {layout === 'desktop' && (
    <div className={`grid gap-3 ${variant === 'admin' ? 'md:grid-cols-4' : variant === 'developer' ? 'md:grid-cols-2' : 'md:grid-cols-3'}`}>
      <DashboardSection
        title={variant === 'developer' ? 'Mi Progreso' : 'Tareas'}
        description={
          variant === 'developer'
            ? 'Tus tareas por estado'
            : variant === 'pm'
              ? 'Tareas de tus proyectos por estado'
              : 'Distribución por estado'
        }
      >
        <TaskStatusChart
          done={tasksDone}
          inProgress={tasksInProgress}
          review={tasksReview}
          pending={tasksTodo}
          backlog={tasksBacklog}
        />
      </DashboardSection>

      <DashboardSection
        title="Proyectos"
        description={variant === 'admin' ? 'Por estado' : 'Tus proyectos por estado'}
      >
        <ProjectStatusChart data={projectStatusData} />
      </DashboardSection>

      {variant !== 'developer' && (
        <DashboardSection
          title="Bugs"
          description={bugsTotal > 0 ? `${bugsOpen + bugsInProgress} activos de ${bugsTotal}` : 'Sin bugs registrados'}
        >
          <BugStatusChart
            open={bugsOpen}
            inProgress={bugsInProgress}
            resolved={bugsResolved}
            closed={bugsClosed}
          />
        </DashboardSection>
      )}

      {variant === 'admin' && (
        <DashboardSection title="Usuarios" description="Distribución de roles">
          <UsersRoleChart data={roleCounts} />
        </DashboardSection>
      )}
    </div>
      )}
    </div>
  )
}
