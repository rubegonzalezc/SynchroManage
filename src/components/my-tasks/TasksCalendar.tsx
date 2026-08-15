'use client'

import { useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight, Video, MapPin, Clock, Plus } from 'lucide-react'
import { es } from 'date-fns/locale'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isToday, addMonths, subMonths } from 'date-fns'
import { GlassPanel } from '@/components/ui/glass-panel'

interface Task {
  id: string
  title: string
  due_date: string | null
  status: string
  priority: string
}

interface Meeting {
  id: string
  title: string
  start_time: string
  end_time: string
  project: { id: string; name: string } | null
  organizer: { id: string; full_name: string }
  attendees: { response: string; user: { full_name: string } }[]
}

interface TasksCalendarProps {
  tasks: Task[]
  meetings: Meeting[]
  onMeetingClick: (id: string) => void
  onDateClick: (date: Date) => void
  onTaskClick?: (id: string) => void
}

const priorityColors: Record<string, string> = {
  low: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  medium: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  high: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  urgent: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
}

const priorityLabels: Record<string, string> = {
  low: 'Baja',
  medium: 'Media',
  high: 'Alta',
  urgent: 'Urgente',
}

export function TasksCalendar({ tasks, meetings, onMeetingClick, onDateClick, onTaskClick }: TasksCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())

  const days = useMemo(() => {
    const start = startOfMonth(currentMonth)
    const end = endOfMonth(currentMonth)
    return eachDayOfInterval({ start, end })
  }, [currentMonth])

  const getTasksForDay = (day: Date) => {
    return tasks.filter(task => task.due_date && isSameDay(new Date(task.due_date), day))
  }

  const getMeetingsForDay = (day: Date) => {
    return meetings.filter(meeting => isSameDay(new Date(meeting.start_time), day))
  }

  const formatTime = (date: string) => {
    return format(new Date(date), 'HH:mm', { locale: es })
  }

  return (
    <GlassPanel
      padding={2.25}
      className="h-full"
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        minHeight: 0,
      }}
    >
      <div className="flex items-center justify-between mb-4 flex-shrink-0">
        <h2 className="text-[17px] font-semibold tracking-tight text-foreground capitalize">
          {format(currentMonth, 'MMMM yyyy', { locale: es })}
        </h2>
        <div className="flex gap-0.5">
          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="flex-shrink-0">
        <div className="grid grid-cols-7 gap-1 text-center text-[11px] mb-1">
          {['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa', 'Do'].map(day => (
            <div key={day} className="text-muted-foreground font-medium py-1">{day}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: (days[0].getDay() + 6) % 7 }).map((_, i) => (
            <div key={`empty-${i}`} className="aspect-square" />
          ))}
          {days.map(day => {
            const dayTasks = getTasksForDay(day)
            const dayMeetings = getMeetingsForDay(day)
            const hasItems = dayTasks.length > 0 || dayMeetings.length > 0
            const isSelected = isSameDay(day, selectedDate)

            return (
              <button
                type="button"
                key={day.toISOString()}
                onClick={() => setSelectedDate(day)}
                className={`
                  aspect-square rounded-full text-[13px] flex flex-col items-center justify-center relative
                  transition-colors
                  ${!isSameMonth(day, currentMonth) ? 'text-muted-foreground/50' : 'text-foreground'}
                  ${isToday(day) && !isSelected ? 'bg-primary/15 text-primary font-semibold' : ''}
                  ${isSelected ? 'bg-primary text-primary-foreground font-semibold shadow-[0_6px_16px_rgba(37,99,235,0.28)]' : 'hover:bg-black/[0.04] dark:hover:bg-white/[0.06]'}
                `}
              >
                {day.getDate()}
                {hasItems && (
                  <div className="absolute bottom-1 flex gap-0.5">
                    {dayTasks.length > 0 && <div className={`w-1 h-1 rounded-full ${isSelected ? 'bg-primary-foreground' : 'bg-blue-500'}`} />}
                    {dayMeetings.length > 0 && <div className={`w-1 h-1 rounded-full ${isSelected ? 'bg-primary-foreground' : 'bg-green-500'}`} />}
                  </div>
                )}
              </button>
            )
          })}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto min-h-0 mt-4 pt-3 border-t border-black/[0.06] dark:border-white/[0.08]">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-[14px] font-semibold tracking-tight text-foreground capitalize">
            {isToday(selectedDate)
              ? 'Hoy'
              : format(selectedDate, "EEEE d 'de' MMMM", { locale: es })}
          </h3>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 rounded-full text-[13px]"
            onClick={() => onDateClick(selectedDate)}
          >
            <Plus className="w-3.5 h-3.5" />
            Reunión
          </Button>
        </div>

        {(() => {
          const dayTasks = getTasksForDay(selectedDate)
          const dayMeetings = getMeetingsForDay(selectedDate)
          const hasItems = dayTasks.length > 0 || dayMeetings.length > 0

          if (!hasItems) {
            return (
              <p className="text-[14px] text-muted-foreground text-center py-8">
                Sin actividades para este día
              </p>
            )
          }

          return (
            <div className="space-y-1">
              {dayMeetings.map(meeting => (
                <div
                  key={meeting.id}
                  onClick={() => onMeetingClick(meeting.id)}
                  className="p-3 rounded-2xl hover:bg-black/[0.04] dark:hover:bg-white/[0.06] cursor-pointer transition-colors"
                >
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <p className="font-medium text-foreground text-[14px] line-clamp-1">{meeting.title}</p>
                    <span className="text-[11px] font-semibold rounded-full px-2.5 py-0.5 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 flex-shrink-0 inline-flex items-center gap-1">
                      <Video className="w-3 h-3" />
                      Reunión
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-[12px] text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    <span>{formatTime(meeting.start_time)} - {formatTime(meeting.end_time)}</span>
                  </div>
                  {meeting.project && (
                    <p className="text-[12px] text-muted-foreground mt-1 flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {meeting.project.name}
                    </p>
                  )}
                </div>
              ))}

              {dayTasks.map(task => (
                <div
                  key={task.id}
                  onClick={() => onTaskClick?.(task.id)}
                  className="p-3 rounded-2xl hover:bg-black/[0.04] dark:hover:bg-white/[0.06] cursor-pointer transition-colors"
                >
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <p className="font-medium text-foreground text-[14px] line-clamp-1">{task.title}</p>
                    <span className={`text-[11px] font-semibold rounded-full px-2.5 py-0.5 flex-shrink-0 ${priorityColors[task.priority]}`}>
                      {priorityLabels[task.priority]}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-[12px] text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    <span>Vence hoy</span>
                    <span>·</span>
                    <span className={task.status === 'done' ? 'text-green-600 dark:text-green-400' : ''}>
                      {task.status === 'done' ? 'Completada' : task.status === 'in_progress' ? 'En progreso' : 'Pendiente'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )
        })()}
      </div>
    </GlassPanel>
  )
}
