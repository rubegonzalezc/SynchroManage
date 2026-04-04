'use client'

import { useState, useMemo, useEffect, useCallback } from 'react'
import useSWR from 'swr'
import { TasksList, type Task } from './TasksList'
import { TasksCalendar } from './TasksCalendar'
import { CreateMeetingDialog } from './CreateMeetingDialog'
import { MeetingDetailDialog } from './MeetingDetailDialog'
import { MyTasksProjectSelector } from './MyTasksProjectSelector'
import { ProjectSprintBanner } from './ProjectSprintBanner'
import { ProjectOrderDialog } from './ProjectOrderDialog'
import { Button } from '@/components/ui/button'
import { Plus, CalendarDays, ListTodo, Settings2 } from 'lucide-react'
import { useSprints } from '@/hooks/useSprints'

const STORAGE_KEY = 'synchro-project-order'

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
  const [orderDialogOpen, setOrderDialogOpen] = useState(false)
  const [customOrderIds, setCustomOrderIds] = useState<string[] | null>(null)

  // Cargar orden personalizado desde localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) setCustomOrderIds(JSON.parse(saved))
    } catch { /* ignorar */ }
  }, [])

  const saveCustomOrder = useCallback((ids: string[]) => {
    setCustomOrderIds(ids)
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(ids)) } catch { /* ignorar */ }
  }, [])

  const resetOrder = useCallback(() => {
    setCustomOrderIds(null)
    try { localStorage.removeItem(STORAGE_KEY) } catch { /* ignorar */ }
  }, [])

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

  // Proyectos únicos (sin completados), con orden personalizado o automático
  const projectsWithTasks = useMemo(() => {
    const fromTasks = new Map<string, Project>()
    tasks.forEach(t => {
      if (t.project && !fromTasks.has(t.project.id)) {
        fromTasks.set(t.project.id, {
          id: t.project.id,
          name: t.project.name,
          type: t.project.type,
          company: (t.project as Project).company,
        })
      }
    })
    const allProjects = (projectsData?.projects ?? []).filter(
      (p: Project & { status?: string }) => p.status !== 'completed'
    )
    allProjects.forEach(p => {
      if (!fromTasks.has(p.id)) fromTasks.set(p.id, p)
    })
    const active = Array.from(fromTasks.values()).filter(
      (p: Project & { status?: string }) => p.status !== 'completed'
    )

    if (customOrderIds && customOrderIds.length > 0) {
      // Aplicar orden guardado: primero los que tienen posición, luego los nuevos al final
      const ordered = customOrderIds
        .map(id => active.find(p => p.id === id))
        .filter((p): p is Project => !!p)
      const rest = active.filter(p => !customOrderIds.includes(p.id))
      return [...ordered, ...rest]
    }

    // Orden automático: por tareas pendientes desc, luego nombre asc
    return active.sort((a, b) => {
      const diff = (taskCountByProject[b.id] ?? 0) - (taskCountByProject[a.id] ?? 0)
      return diff !== 0 ? diff : a.name.localeCompare(b.name)
    })
  }, [tasks, projectsData?.projects, taskCountByProject, customOrderIds])

  // Tareas filtradas según proyecto seleccionado
  const filteredTasks = useMemo(() => {
    if (selectedProjectId === null) return tasks
    return tasks.filter(t => t.project?.id === selectedProjectId)
  }, [tasks, selectedProjectId])

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

      {/* Project selector + botón de ordenar */}
      {projectsWithTasks.length > 0 && (
        <div className="flex items-start gap-2">
          <div className="flex-1 min-w-0">
            <MyTasksProjectSelector
              projects={projectsWithTasks}
              selectedProjectId={selectedProjectId}
              onSelect={setSelectedProjectId}
              taskCountByProject={taskCountByProject}
            />
          </div>
          <Button
            variant="ghost"
            size="icon"
            className={`h-9 w-9 flex-shrink-0 rounded-full transition-colors ${
              customOrderIds ? 'text-primary bg-primary/10 hover:bg-primary/20' : 'text-muted-foreground hover:text-foreground'
            }`}
            onClick={() => setOrderDialogOpen(true)}
            title={customOrderIds ? 'Orden personalizado activo' : 'Personalizar orden de proyectos'}
          >
            <Settings2 className="w-4 h-4" />
          </Button>
        </div>
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
      <ProjectOrderDialog
        open={orderDialogOpen}
        onOpenChange={setOrderDialogOpen}
        projects={projectsWithTasks}
        onSave={saveCustomOrder}
        onReset={resetOrder}
      />

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
