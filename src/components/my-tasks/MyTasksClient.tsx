'use client'

import { useState, useEffect } from 'react'
import { TasksList } from './TasksList'
import { TasksCalendar } from './TasksCalendar'
import { CreateMeetingDialog } from './CreateMeetingDialog'
import { MeetingDetailDialog } from './MeetingDetailDialog'
import { Button } from '@/components/ui/button'
import { Plus, CalendarDays, ListTodo } from 'lucide-react'

interface Task {
  id: string
  task_number: number | null
  title: string
  description: string | null
  status: string
  priority: string
  due_date: string | null
  created_at: string
  project: { id: string; name: string } | null
}

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

export function MyTasksClient() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [meetings, setMeetings] = useState<Meeting[]>([])
  const [loading, setLoading] = useState(true)
  const [createMeetingOpen, setCreateMeetingOpen] = useState(false)
  const [selectedMeetingId, setSelectedMeetingId] = useState<string | null>(null)
  const [mobileView, setMobileView] = useState<'list' | 'calendar'>('list')
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)

  const fetchData = async () => {
    try {
      const [tasksRes, meetingsRes] = await Promise.all([
        fetch('/api/dashboard/my-tasks'),
        fetch('/api/dashboard/meetings'),
      ])
      
      const tasksData = await tasksRes.json()
      const meetingsData = await meetingsRes.json()
      
      if (tasksRes.ok) setTasks(tasksData.tasks || [])
      if (meetingsRes.ok) setMeetings(meetingsData.meetings || [])
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleMeetingCreated = () => {
    fetchData()
    setCreateMeetingOpen(false)
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Mis Tareas</h1>
          <p className="text-muted-foreground">Gestiona tus tareas y reuniones</p>
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

      {/* Content - Split view */}
      <div className="flex-1 flex gap-6 min-h-0">
        {/* Tasks List - Left side */}
        <div className={`flex-1 min-w-0 ${mobileView === 'calendar' ? 'hidden md:block' : ''}`}>
          <TasksList tasks={tasks} loading={loading} onTaskUpdated={fetchData} />
        </div>

        {/* Calendar - Right side */}
        <div className={`w-full md:w-[400px] lg:w-[450px] flex-shrink-0 ${mobileView === 'list' ? 'hidden md:block' : ''}`}>
          <TasksCalendar
            tasks={tasks}
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
          onUpdated={fetchData}
        />
      )}
    </div>
  )
}
