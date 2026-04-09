'use client'

import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { DatePicker } from '@/components/ui/date-picker'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Loader2, X, Check } from 'lucide-react'

interface Project {
  id: string
  name: string
}

interface User {
  id: string
  full_name: string
  avatar_url: string | null
}

interface CreateMeetingDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreated: () => void
  initialDate?: Date | null
}

export function CreateMeetingDialog({ open, onOpenChange, onCreated, initialDate }: CreateMeetingDialogProps) {
  const [loading, setLoading] = useState(false)
  const [projects, setProjects] = useState<Project[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [selectedAttendees, setSelectedAttendees] = useState<string[]>([])
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    project_id: '',
    date: null as Date | null,
    start_time: '09:00',
    end_time: '10:00',
    meeting_link: '',
  })

  useEffect(() => {
    if (open) {
      fetchProjects()
      fetchUsers()
      if (initialDate) {
        setFormData(prev => ({ ...prev, date: initialDate }))
      }
    }
  }, [open, initialDate])

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
      if (res.ok) setUsers(data.users || [])
    } catch (err) {
      console.error('Error fetching users:', err)
    }
  }

  const toggleAttendee = (userId: string) => {
    setSelectedAttendees(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    )
  }

  const handleSubmit = async () => {
    if (!formData.title || !formData.date || !formData.start_time || !formData.end_time) {
      return
    }

    setLoading(true)
    try {
      const dateStr = format(formData.date, 'yyyy-MM-dd')
      const tzOffset = -formData.date.getTimezoneOffset()
      const tzSign = tzOffset >= 0 ? '+' : '-'
      const tzHH = String(Math.floor(Math.abs(tzOffset) / 60)).padStart(2, '0')
      const tzMM = String(Math.abs(tzOffset) % 60).padStart(2, '0')
      const tz = `${tzSign}${tzHH}:${tzMM}`
      const start_time = `${dateStr}T${formData.start_time}:00${tz}`
      const end_time = `${dateStr}T${formData.end_time}:00${tz}`

      const res = await fetch('/api/dashboard/meetings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description || null,
          project_id: formData.project_id || null,
          start_time,
          end_time,
          meeting_link: formData.meeting_link || null,
          attendee_ids: selectedAttendees,
        }),
      })

      if (res.ok) {
        onCreated()
        resetForm()
      }
    } catch (err) {
      console.error('Error creating meeting:', err)
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      project_id: '',
      date: null,
      start_time: '09:00',
      end_time: '10:00',
      meeting_link: '',
    })
    setSelectedAttendees([])
  }

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Agendar Reunión</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Título *</Label>
            <Input
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Nombre de la reunión"
            />
          </div>

          <div className="space-y-2">
            <Label>Descripción</Label>
            <Input
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Descripción opcional"
            />
          </div>

          <div className="space-y-2">
            <Label>Proyecto (opcional)</Label>
            <Select value={formData.project_id || "none"} onValueChange={(v) => setFormData({ ...formData, project_id: v === "none" ? "" : v })}>
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
                value={formData.date}
                onChange={(date) => setFormData({ ...formData, date: date || null })}
                placeholder="Seleccionar"
              />
            </div>
            <div className="space-y-2">
              <Label>Inicio *</Label>
              <Input
                type="time"
                value={formData.start_time}
                onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Fin *</Label>
              <Input
                type="time"
                value={formData.end_time}
                onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Link de reunión</Label>
            <Input
              value={formData.meeting_link}
              onChange={(e) => setFormData({ ...formData, meeting_link: e.target.value })}
              placeholder="https://meet.google.com/..."
            />
          </div>

          <div className="space-y-2">
            <Label>Invitar participantes</Label>
            <div className="border border-border rounded-lg max-h-48 overflow-y-auto">
              {users.map(user => (
                <div
                  key={user.id}
                  onClick={() => toggleAttendee(user.id)}
                  className={`
                    flex items-center gap-3 p-2 cursor-pointer transition-colors
                    ${selectedAttendees.includes(user.id) ? 'bg-primary/10' : 'hover:bg-muted'}
                  `}
                >
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={user.avatar_url || undefined} />
                    <AvatarFallback className="text-xs">{getInitials(user.full_name)}</AvatarFallback>
                  </Avatar>
                  <span className="flex-1 text-sm text-foreground">{user.full_name}</span>
                  {selectedAttendees.includes(user.id) && (
                    <Check className="w-4 h-4 text-primary" />
                  )}
                </div>
              ))}
            </div>
            {selectedAttendees.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {selectedAttendees.map(id => {
                  const user = users.find(u => u.id === id)
                  if (!user) return null
                  return (
                    <span
                      key={id}
                      className="inline-flex items-center gap-1 px-2 py-1 bg-muted rounded-full text-xs"
                    >
                      {user.full_name}
                      <button onClick={() => toggleAttendee(id)} className="hover:text-red-500">
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSubmit} disabled={loading || !formData.title || !formData.date}>
            {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Creando...</> : 'Crear Reunión'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
