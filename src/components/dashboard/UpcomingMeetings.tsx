'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Video, Clock, Users, ExternalLink } from 'lucide-react'
import Link from 'next/link'
import { format, isToday, isTomorrow } from 'date-fns'
import { es } from 'date-fns/locale'
import { Skeleton } from '@/components/ui/skeleton'

interface Meeting {
  id: string
  title: string
  start_time: string
  end_time: string
  meeting_link: string | null
  project: { id: string; name: string } | null
  organizer: { id: string; full_name: string; avatar_url: string | null }
  attendees: {
    response: string
    user: { id: string; full_name: string; avatar_url: string | null }
  }[]
}

const responseColors: Record<string, string> = {
  pending: 'bg-slate-500',
  in_person: 'bg-green-500',
  virtual: 'bg-blue-500',
  declined: 'bg-red-500',
  maybe: 'bg-amber-500',
}

export function UpcomingMeetings() {
  const [meetings, setMeetings] = useState<Meeting[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const controller = new AbortController()
    const fetchMeetings = async () => {
      try {
        const res = await fetch('/api/dashboard/meetings', { signal: controller.signal })
        const data = await res.json()
        if (res.ok) {
          setMeetings((data.meetings || []).slice(0, 3))
        }
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') return
        console.error('Error fetching meetings:', err)
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }
    fetchMeetings()
    return () => controller.abort()
  }, [])

  const formatMeetingDate = (date: string) => {
    const d = new Date(date)
    if (isToday(d)) return 'Hoy'
    if (isTomorrow(d)) return 'Mañana'
    return format(d, "EEE d 'de' MMM", { locale: es })
  }

  const formatTime = (date: string) => {
    return format(new Date(date), 'HH:mm')
  }

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  if (loading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <Video className="w-5 h-5 text-green-500" /> Próximas Reuniones
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="p-3 rounded-lg bg-muted/50 space-y-2.5">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-3/5" />
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-3 w-3 rounded-full" />
                      <Skeleton className="h-3 w-40" />
                    </div>
                  </div>
                  <Skeleton className="h-8 w-8 rounded-lg flex-shrink-0" />
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-3 w-3 rounded-full" />
                    <div className="flex -space-x-1.5">
                      {[1, 2, 3].map((a) => (
                        <Skeleton key={a} className="w-6 h-6 rounded-full border-2 border-background" />
                      ))}
                    </div>
                    <Skeleton className="h-3 w-24" />
                  </div>
                  <Skeleton className="h-5 w-20 rounded-full" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Video className="w-5 h-5 text-green-500" /> Próximas Reuniones
            </CardTitle>
            <CardDescription>Reuniones programadas</CardDescription>
          </div>
          <Link href="/my-tasks" className="text-sm text-primary hover:underline">
            Ver todas
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        {meetings.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">
            No tienes reuniones próximas
          </p>
        ) : (
          <div className="space-y-3">
            {meetings.map((meeting) => {
              const confirmedCount = meeting.attendees.filter(
                a => a.response === 'in_person' || a.response === 'virtual'
              ).length

              return (
                <Link
                  key={meeting.id}
                  href="/my-tasks"
                  className="block p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-foreground truncate">{meeting.title}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                        <Clock className="w-3 h-3" />
                        <span>{formatMeetingDate(meeting.start_time)}</span>
                        <span>·</span>
                        <span>{formatTime(meeting.start_time)} - {formatTime(meeting.end_time)}</span>
                      </div>
                    </div>
                    {meeting.meeting_link && (
                      <a
                        href={meeting.meeting_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors"
                      >
                        <Video className="w-4 h-4" />
                      </a>
                    )}
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <Users className="w-3 h-3 text-muted-foreground" />
                      <div className="flex -space-x-2">
                        {meeting.attendees.slice(0, 4).map((attendee, i) => (
                          <div
                            key={i}
                            className="relative"
                            title={`${attendee.user.full_name} - ${attendee.response}`}
                          >
                            <Avatar className="w-6 h-6 border-2 border-background">
                              <AvatarImage src={attendee.user.avatar_url || undefined} />
                              <AvatarFallback className="text-[10px]">
                                {getInitials(attendee.user.full_name)}
                              </AvatarFallback>
                            </Avatar>
                            <div className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border border-background ${responseColors[attendee.response]}`} />
                          </div>
                        ))}
                        {meeting.attendees.length > 4 && (
                          <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-[10px] text-muted-foreground border-2 border-background">
                            +{meeting.attendees.length - 4}
                          </div>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground ml-1">
                        {confirmedCount}/{meeting.attendees.length} confirmados
                      </span>
                    </div>

                    {meeting.project && (
                      <Badge variant="outline" className="text-xs">
                        {meeting.project.name}
                      </Badge>
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
