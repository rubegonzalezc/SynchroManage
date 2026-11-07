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

  if (layout !== 'desktop') return null

  return (
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
  )
}
