'use client'

import { useState, useMemo } from 'react'
import useSWR from 'swr'
import { TasksList, type Task } from './TasksList'
import { TasksCalendar } from './TasksCalendar'
import { CreateMeetingDialog } from './CreateMeetingDialog'
import { MeetingDetailDialog } from './MeetingDetailDialog'
import { MyTasksProjectSelector } from './MyTasksProjectSelector'
import { ProjectSprintBanner } from './ProjectSprintBanner'
import { Button } from '@/components/ui/button'
import { Plus, CalendarDays, ListTodo } from 'lucide-react'
import { useSprints } from '@/hooks/useSprints'

interface Meeting {
  id: string
  title: string
  description: string | null
  start_time: string
  end_time: string
  meeting_link: string | null
  project: { id: string; name: string } | null
  organizer: { id: string; full_name: string; avatar_url: string | null }
  attendees: {
    id: string
    response: string
    user: { id: string; full_name: string; avatar_url: string | null }
  }[]
}

interface Project {
  id: string
  name: string
  type?: string
  company?: { id: string; name: string } | null
}

export function MyTasksClient() {
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null)
  const [createMeetingOpen, setCreateMeetingOpen] = useState(false)
  const [selectedMeetingId, setSelectedMeetingId] = useState<string | null>(null)
  const [mobileView, setMobileView] = useState<'list' | 'calendar'>('list')
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)

  // Fetch de tareas propias (con sprint y proyecto)
  const { data: tasksData, isLoading: tasksLoading, mutate: mutateTasks } = useSWR<{ tasks: Task[] }>(
    '/api/dashboard/my-tasks'
  )

  // Fetch de reuniones
  const { data: meetingsData, mutate: mutateMeetings } = useSWR<{ meetings: Meeting[] }>(
    '/api/dashboard/meetings'
  )

  // Fetch de proyectos para el selector
  const { data: projectsData } = useSWR<{ projects: Project[] }>('/api/dashboard/projects')

  // Sprints del proyecto seleccionado (para el banner)
  const { sprints } = useSprints(selectedProjectId ?? '')

  const tasks: Task[] = tasksData?.tasks ?? []
  const meetings: Meeting[] = meetingsData?.meetings ?? []

  // Proyectos únicos que tienen tareas asignadas al usuario
  const projectsWithTasks = useMemo(() => {
    const fromTasks = new Map<string, Project>()
    tasks.forEach(t => {
      if (t.project && !fromTasks.has(t.project.id)) {
        fromTasks.set(t.project.id, { id: t.project.id, name: t.project.name, type: t.project.type, company: (t.project as Project).company })
      }
    })
    // Fusionar con la lista oficial de proyectos para incluir proyectos sin tareas
    const allProjects = projectsData?.projects ?? []
    allProjects.forEach(p => {
      if (!fromTasks.has(p.id)) {
        fromTasks.set(p.id, p)
      }
    })
    return Array.from(fromTasks.values()).sort((a, b) => a.name.localeCompare(b.name))
  }, [tasks, projectsData?.projects])

  // Tareas filtradas según proyecto seleccionado
  const filteredTasks = useMemo(() => {
    if (selectedProjectId === null) return tasks
    return tasks.filter(t => t.project?.id === selectedProjectId)
  }, [tasks, selectedProjectId])

  // Conteo de tareas pendientes por proyecto para el selector
  const taskCountByProject = useMemo(() => {
    const counts: Record<string, number> = {}
    tasks.forEach(t => {
      if (t.status !== 'done' && t.project?.id) {
        counts[t.project.id] = (counts[t.project.id] ?? 0) + 1
      }
    })
    return counts
  }, [tasks])

  // Nombre del proyecto seleccionado
  const selectedProjectName = useMemo(
    () => projectsWithTasks.find(p => p.id === selectedProjectId)?.name ?? '',
    [projectsWithTasks, selectedProjectId]
  )

  const handleMeetingCreated = () => {
    mutateMeetings()
    setCreateMeetingOpen(false)
  }

  const handleTaskUpdated = () => {
    mutateTasks()
  }

  // Tareas en formato mínimo para el calendario (subset de campos)
  const calendarTasks = useMemo(() => filteredTasks.map(t => ({
    id: t.id,
    title: t.title,
    due_date: t.due_date ?? null,
    status: t.status,
    priority: t.priority,
  })), [filteredTasks])

  return (
    <div className="h-full flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Mis Tareas</h1>
          <p className="text-muted-foreground text-sm">
            {selectedProjectId
              ? `Viendo tareas de ${selectedProjectName}`
              : 'Todas tus tareas y reuniones asignadas'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Mobile view toggle */}
          <div className="flex md:hidden border border-border rounded-lg overflow-hidden">
            <Button
              variant={mobileView === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setMobileView('list')}
              className="rounded-none"
            >
              <ListTodo className="w-4 h-4" />
            </Button>
            <Button
              variant={mobileView === 'calendar' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setMobileView('calendar')}
              className="rounded-none"
            >
              <CalendarDays className="w-4 h-4" />
            </Button>
          </div>
          <Button onClick={() => { setSelectedDate(null); setCreateMeetingOpen(true) }}>
            <Plus className="w-4 h-4 mr-2" />
            Agendar Reunión
          </Button>
        </div>
      </div>

      {/* Project selector */}
      {projectsWithTasks.length > 0 && (
        <MyTasksProjectSelector
          projects={projectsWithTasks}
          selectedProjectId={selectedProjectId}
          onSelect={setSelectedProjectId}
          taskCountByProject={taskCountByProject}
        />
      )}

      {/* Sprint banner — solo cuando hay proyecto seleccionado */}
      {selectedProjectId && (
        <ProjectSprintBanner
          sprints={sprints}
          tasks={filteredTasks}
          projectName={selectedProjectName}
        />
      )}

      {/* Split: lista + calendario */}
      <div className="flex-1 flex gap-4 min-h-0">
        {/* Tasks list */}
        <div className={`flex-1 min-w-0 ${mobileView === 'calendar' ? 'hidden md:flex md:flex-col' : 'flex flex-col'}`}>
          <TasksList
            tasks={filteredTasks}
            loading={tasksLoading}
            onTaskUpdated={handleTaskUpdated}
            showProject={selectedProjectId === null}
          />
        </div>

        {/* Calendar */}
        <div className={`w-full md:w-[380px] lg:w-[420px] flex-shrink-0 ${mobileView === 'list' ? 'hidden md:block' : ''}`}>
          <TasksCalendar
            tasks={calendarTasks}
            meetings={meetings}
            onMeetingClick={(id) => setSelectedMeetingId(id)}
            onDateClick={(date) => {
              setSelectedDate(date)
              setCreateMeetingOpen(true)
            }}
          />
        </div>
      </div>

      {/* Dialogs */}
      <CreateMeetingDialog
        open={createMeetingOpen}
        onOpenChange={setCreateMeetingOpen}
        onCreated={handleMeetingCreated}
        initialDate={selectedDate}
      />

      {selectedMeetingId && (
        <MeetingDetailDialog
          meetingId={selectedMeetingId}
          open={!!selectedMeetingId}
          onOpenChange={(open) => !open && setSelectedMeetingId(null)}
          onUpdated={mutateMeetings}
        />
      )}
    </div>
  )
}
