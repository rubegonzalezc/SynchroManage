'use client'

import { useState, useEffect } from 'react'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { DatePicker } from '@/components/ui/date-picker'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Loader2, Video, Clock, MapPin, ExternalLink, User, Check, X, HelpCircle, Pencil, Trash2, UserPlus } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import Link from 'next/link'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

interface Attendee {
  id: string
  response: string
  user: { id: string; full_name: string; avatar_url: string | null }
}

interface Project {
  id: string
  name: string
}

interface Meeting {
  id: string
  title: string
  description: string | null
  start_time: string
  end_time: string
  meeting_link: string | null
  project: Project | null
  organizer: { id: string; full_name: string; avatar_url: string | null }
  attendees: Attendee[]
}

interface MeetingDetailDialogProps {
  meetingId: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onUpdated: () => void
}

const responseLabels: Record<string, string> = {
  pending: 'Pendiente',
  in_person: 'Presencial',
  virtual: 'Virtual',
  declined: 'No asistirá',
  maybe: 'No sabe',
}

const responseColors: Record<string, string> = {
  pending: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  in_person: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  virtual: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  declined: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  maybe: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
}

export function MeetingDetailDialog({ meetingId, open, onOpenChange, onUpdated }: MeetingDetailDialogProps) {
  const [meeting, setMeeting] = useState<Meeting | null>(null)
  const [loading, setLoading] = useState(true)
  const [responding, setResponding] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<string>('')
  const [isEditing, setIsEditing] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [saving, setSaving] = useState(false)
  const [projects, setProjects] = useState<Project[]>([])
  const [allUsers, setAllUsers] = useState<{ id: string; full_name: string; avatar_url: string | null }[]>([])
  const [selectedAttendees, setSelectedAttendees] = useState<string[]>([])

  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    project_id: '',
    date: null as Date | null,
    start_time: '',
    end_time: '',
    meeting_link: '',
  })

  useEffect(() => {
    if (open && meetingId) {
      fetchMeeting()
      fetchCurrentUser()
      fetchProjects()
      fetchUsers()
      setIsEditing(false)
    }
  }, [open, meetingId])

  const fetchProjects = async () => {
    try {
      const res = await fetch('/api/dashboard/projects')
      const data = await res.json()
      if (res.ok) setProjects(data.projects || [])
    } catch (err) {
      console.error('Error fetching projects:', err)
    }
  }

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/dashboard/users')
      const data = await res.json()
      if (res.ok) setAllUsers(data.users || [])
    } catch (err) {
      console.error('Error fetching users:', err)
    }
  }

  const fetchMeeting = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/dashboard/meetings/${meetingId}`)
      const data = await res.json()
      if (res.ok) {
        setMeeting(data.meeting)
        // Inicializar formulario de edición
        const m = data.meeting
        const startDate = new Date(m.start_time)
        setEditForm({
          title: m.title,
          description: m.description || '',
          project_id: m.project?.id || '',
          date: startDate,
          start_time: format(startDate, 'HH:mm'),
          end_time: format(new Date(m.end_time), 'HH:mm'),
          meeting_link: m.meeting_link || '',
        })
        // Inicializar participantes (excluir al organizador)
        const attendeeIds = (m.attendees as Attendee[])
          .map((a) => a.user.id)
          .filter((uid: string) => uid !== m.organizer.id)
        setSelectedAttendees(attendeeIds)
      }
    } catch (err) {
      console.error('Error fetching meeting:', err)
    } finally {
      setLoading(false)
    }
  }

  const fetchCurrentUser = async () => {
    try {
      const res = await fetch('/api/dashboard/me')
      const data = await res.json()
      if (res.ok) setCurrentUserId(data.user.id)
    } catch (err) {
      console.error('Error:', err)
    }
  }

  const handleResponse = async (response: string) => {
    setResponding(true)
    try {
      const res = await fetch(`/api/dashboard/meetings/${meetingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ response }),
      })
      if (res.ok) {
        fetchMeeting()
        onUpdated()
      }
    } catch (err) {
      console.error('Error:', err)
    } finally {
      setResponding(false)
    }
  }

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  const toggleAttendee = (userId: string) => {
    setSelectedAttendees(prev =>
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    )
  }

  const handleSaveEdit = async () => {
    if (!editForm.title || !editForm.date) return
    
    setSaving(true)
    try {
      const dateStr = format(editForm.date, 'yyyy-MM-dd')
      const tzOffset = -editForm.date.getTimezoneOffset()
      const tzSign = tzOffset >= 0 ? '+' : '-'
      const tzHH = String(Math.floor(Math.abs(tzOffset) / 60)).padStart(2, '0')
      const tzMM = String(Math.abs(tzOffset) % 60).padStart(2, '0')
      const tz = `${tzSign}${tzHH}:${tzMM}`
      const start_time = `${dateStr}T${editForm.start_time}:00${tz}`
      const end_time = `${dateStr}T${editForm.end_time}:00${tz}`

      const res = await fetch(`/api/dashboard/meetings/${meetingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editForm.title,
          description: editForm.description || null,
          project_id: editForm.project_id || null,
          start_time,
          end_time,
          meeting_link: editForm.meeting_link || null,
          attendee_ids: selectedAttendees,
        }),
      })

      if (res.ok) {
        setIsEditing(false)
        fetchMeeting()
        onUpdated()
      }
    } catch (err) {
      console.error('Error updating meeting:', err)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      const res = await fetch(`/api/dashboard/meetings/${meetingId}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        setShowDeleteDialog(false)
        onOpenChange(false)
        onUpdated()
      }
    } catch (err) {
      console.error('Error deleting meeting:', err)
    } finally {
      setDeleting(false)
    }
  }

  const myAttendance = meeting?.attendees.find(a => a.user.id === currentUserId)
  const isOrganizer = meeting?.organizer.id === currentUserId

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Video className="w-5 h-5 text-green-500" />
              {isEditing ? 'Editar Reunión' : (meeting?.title || 'Cargando...')}
            </DialogTitle>
          </DialogHeader>

          {loading ? (
            <div className="space-y-4 py-2">
              <Skeleton className="h-4 w-3/5" />
              <Skeleton className="h-10 w-full rounded-lg" />
              <div className="space-y-1.5">
                <Skeleton className="h-3.5 w-24" />
                <Skeleton className="h-4 w-40" />
              </div>
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <Skeleton className="w-10 h-10 rounded-full flex-shrink-0" />
                <div className="space-y-1.5">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-28" />
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Skeleton className="w-8 h-8 rounded-full flex-shrink-0" />
                    <Skeleton className="h-4 flex-1" />
                    <Skeleton className="h-5 w-20 rounded-full" />
                  </div>
                ))}
              </div>
            </div>
          ) : meeting ? (
            isEditing ? (
              // Modo edición
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Título *</Label>
                  <Input
                    value={editForm.title}
                    onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                    placeholder="Nombre de la reunión"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Descripción</Label>
                  <Input
                    value={editForm.description}
                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                    placeholder="Descripción opcional"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Proyecto (opcional)</Label>
                  <Select 
                    value={editForm.project_id || "none"} 
                    onValueChange={(v) => setEditForm({ ...editForm, project_id: v === "none" ? "" : v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar proyecto" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Sin proyecto</SelectItem>
                      {projects.map(p => (
                        <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-2">
                    <Label>Fecha *</Label>
                    <DatePicker
                      value={editForm.date}
                      onChange={(date) => setEditForm({ ...editForm, date: date || null })}
                      placeholder="Seleccionar"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Inicio *</Label>
                    <Input
                      type="time"
                      value={editForm.start_time}
                      onChange={(e) => setEditForm({ ...editForm, start_time: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Fin *</Label>
                    <Input
                      type="time"
                      value={editForm.end_time}
                      onChange={(e) => setEditForm({ ...editForm, end_time: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Link de reunión</Label>
                  <Input
                    value={editForm.meeting_link}
                    onChange={(e) => setEditForm({ ...editForm, meeting_link: e.target.value })}
                    placeholder="https://meet.google.com/..."
                  />
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-1"><UserPlus className="w-4 h-4" />Participantes</Label>
                  <div className="border border-border rounded-lg max-h-48 overflow-y-auto">
                    {allUsers
                      .filter(u => u.id !== currentUserId)
                      .map(user => (
                        <div
                          key={user.id}
                          onClick={() => toggleAttendee(user.id)}
                          className={`flex items-center gap-3 p-2 cursor-pointer transition-colors ${
                            selectedAttendees.includes(user.id) ? 'bg-primary/10' : 'hover:bg-muted'
                          }`}
                        >
                          <Avatar className="w-8 h-8">
                            <AvatarImage src={user.avatar_url || undefined} />
                            <AvatarFallback className="text-xs">{getInitials(user.full_name)}</AvatarFallback>
                          </Avatar>
                          <span className="flex-1 text-sm text-foreground">{user.full_name}</span>
                          {selectedAttendees.includes(user.id) && <Check className="w-4 h-4 text-primary" />}
                        </div>
                      ))}
                  </div>
                  {selectedAttendees.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {selectedAttendees.map(id => {
                        const u = allUsers.find(u => u.id === id)
                        if (!u) return null
                        return (
                          <span key={id} className="inline-flex items-center gap-1 px-2 py-1 bg-muted rounded-full text-xs">
                            {u.full_name}
                            <button onClick={() => toggleAttendee(id)} className="hover:text-red-500">
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        )
                      })}
                    </div>
                  )}
                </div>

                <div className="flex gap-2 pt-4">
                  <Button variant="outline" onClick={() => setIsEditing(false)} className="flex-1">
                    Cancelar
                  </Button>
                  <Button onClick={handleSaveEdit} disabled={saving || !editForm.title} className="flex-1">
                    {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Guardando...</> : 'Guardar'}
                  </Button>
                </div>
              </div>
            ) : (
              // Modo visualización
              <div className="space-y-4">
                {/* Botones de editar/eliminar para el organizador */}
                {isOrganizer && (
                  <div className="flex gap-2 justify-end">
                    <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                      <Pencil className="w-4 h-4 mr-1" />
                      Editar
                    </Button>
                    <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20" onClick={() => setShowDeleteDialog(true)}>
                      <Trash2 className="w-4 h-4 mr-1" />
                      Eliminar
                    </Button>
                  </div>
                )}

                {/* Date & Time */}
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="w-4 h-4" />
                  <span>
                    {format(new Date(meeting.start_time), "EEEE d 'de' MMMM, yyyy", { locale: es })}
                  </span>
                  <span>·</span>
                  <span>
                    {format(new Date(meeting.start_time), 'HH:mm')} - {format(new Date(meeting.end_time), 'HH:mm')}
                  </span>
                </div>

                {/* Project */}
                {meeting.project && (
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="w-4 h-4 text-muted-foreground" />
                    <Link href={`/projects/${meeting.project.id}`} className="text-foreground hover:underline flex items-center gap-1">
                      {meeting.project.name}
                      <ExternalLink className="w-3 h-3" />
                    </Link>
                  </div>
                )}

                {/* Meeting Link */}
                {meeting.meeting_link && (
                  <a
                    href={meeting.meeting_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-blue-700 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
                  >
                    <Video className="w-4 h-4" />
                    <span className="text-sm font-medium">Unirse a la reunión</span>
                    <ExternalLink className="w-3 h-3 ml-auto" />
                  </a>
                )}

                {/* Description */}
                {meeting.description && (
                  <div className="text-sm text-muted-foreground">
                    <p>{meeting.description}</p>
                  </div>
                )}

                {/* Organizer */}
                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={meeting.organizer.avatar_url || undefined} />
                    <AvatarFallback>{getInitials(meeting.organizer.full_name)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium text-foreground">{meeting.organizer.full_name}</p>
                    <p className="text-xs text-muted-foreground">Organizador</p>
                  </div>
                </div>

                {/* Attendees */}
                {meeting.attendees.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-foreground mb-2 flex items-center gap-2">
                      <User className="w-4 h-4" />
                      Participantes ({meeting.attendees.length})
                    </h4>
                    <div className="space-y-2">
                      {meeting.attendees.map(attendee => (
                        <div key={attendee.id} className="flex items-center gap-3">
                          <Avatar className="w-8 h-8">
                            <AvatarImage src={attendee.user.avatar_url || undefined} />
                            <AvatarFallback className="text-xs">{getInitials(attendee.user.full_name)}</AvatarFallback>
                          </Avatar>
                          <span className="flex-1 text-sm text-foreground">{attendee.user.full_name}</span>
                          <Badge variant="secondary" className={`text-xs ${responseColors[attendee.response]}`}>
                            {responseLabels[attendee.response]}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Response buttons (only for attendees who are not the organizer) */}
                {myAttendance && !isOrganizer && (
                  <div className="border-t border-border pt-4">
                    <p className="text-sm text-muted-foreground mb-3">¿Cómo asistirás?</p>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant={myAttendance.response === 'in_person' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handleResponse('in_person')}
                        disabled={responding}
                      >
                        <Check className="w-4 h-4 mr-1" />
                        Presencial
                      </Button>
                      <Button
                        variant={myAttendance.response === 'virtual' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handleResponse('virtual')}
                        disabled={responding}
                      >
                        <Video className="w-4 h-4 mr-1" />
                        Virtual
                      </Button>
                      <Button
                        variant={myAttendance.response === 'maybe' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handleResponse('maybe')}
                        disabled={responding}
                      >
                        <HelpCircle className="w-4 h-4 mr-1" />
                        No sé
                      </Button>
                      <Button
                        variant={myAttendance.response === 'declined' ? 'destructive' : 'outline'}
                        size="sm"
                        onClick={() => handleResponse('declined')}
                        disabled={responding}
                      >
                        <X className="w-4 h-4 mr-1" />
                        No asistiré
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )
          ) : (
            <p className="text-center text-muted-foreground py-8">Reunión no encontrada</p>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog de confirmación para eliminar */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar reunión?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se notificará a todos los participantes que la reunión ha sido cancelada.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Eliminando...</> : 'Eliminar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
