'use client'

import { useState } from 'react'
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { MultiSelectDeveloper } from '@/components/ui/multi-select-developer'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { DatePicker } from '@/components/ui/date-picker'
import { Plus, Loader2, CheckCircle } from 'lucide-react'

interface Member {
  id: string
  full_name: string
  avatar_url: string | null
  roles?: string[]
}

interface CreateTaskDialogProps {
  projectId: string
  projectName: string
  members: Member[]
  onTaskCreated?: () => void
}

export function CreateTaskDialog({ projectId, projectName, members, onTaskCreated }: CreateTaskDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: 'backlog',
    priority: 'medium',
    category: 'task',
    assignee_ids: [] as string[],
    due_date: '',
  })

  const developerMembers = members.filter(u => u.roles?.includes('developer'))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(false)

    try {
      const response = await fetch('/api/dashboard/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project_id: projectId,
          ...formData,
          assignee_ids: formData.assignee_ids.length > 0 ? formData.assignee_ids : [],
        }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error)

      // Notificar a los usuarios asignados
      if (formData.assignee_ids.length > 0) {
        await Promise.all(
          formData.assignee_ids.map((assigneeId) =>
            fetch('/api/dashboard/notifications', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                user_id: assigneeId,
                type: 'task_assigned',
                title: 'Te asignaron una tarea',
                message: `Te asignaron la tarea "${formData.title}" en el proyecto "${projectName}"`,
                link: `/projects/${projectId}`,
                task_id: data.task?.id,
                project_id: projectId,
              }),
            })
          )
        )
      }

      setSuccess(true)
      setTimeout(() => {
        setOpen(false)
        setFormData({
          title: '', description: '', status: 'backlog',
          priority: 'medium', category: 'task', assignee_ids: [], due_date: '',
        })
        setSuccess(false)
        onTaskCreated?.()
      }, 1000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear tarea')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="w-full bg-primary hover:bg-primary/90">
          <Plus className="w-4 h-4 mr-2" /> Nueva Tarea
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nueva Tarea</DialogTitle>
          <DialogDescription>Agrega una tarea al proyecto</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400 px-4 py-3 rounded-lg text-sm">{error}</div>
          )}
          {success && (
            <div className="bg-green-50 border border-green-200 text-green-600 dark:bg-green-900/20 dark:border-green-800 dark:text-green-400 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
              <CheckCircle className="w-4 h-4" /> Tarea creada
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="title">Título *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
              placeholder="Nombre de la tarea"
              disabled={loading || success}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descripción</Label>
            <Input
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Descripción opcional"
              disabled={loading || success}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Estado</Label>
              <Select
                value={formData.status}
                onValueChange={(v) => setFormData({ ...formData, status: v })}
                disabled={loading || success}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="backlog">Backlog</SelectItem>
                  <SelectItem value="todo">Por Hacer</SelectItem>
                  <SelectItem value="in_progress">En Progreso</SelectItem>
                  <SelectItem value="review">En Revisión</SelectItem>
                  <SelectItem value="done">Completado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Prioridad</Label>
              <Select
                value={formData.priority}
                onValueChange={(v) => setFormData({ ...formData, priority: v })}
                disabled={loading || success}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Baja</SelectItem>
                  <SelectItem value="medium">Media</SelectItem>
                  <SelectItem value="high">Alta</SelectItem>
                  <SelectItem value="urgent">Urgente</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Categoría</Label>
            <Select
              value={formData.category}
              onValueChange={(v) => setFormData({ ...formData, category: v })}
              disabled={loading || success}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="task">📋 Tarea</SelectItem>
                <SelectItem value="bug">🐛 Bug</SelectItem>
                <SelectItem value="feature">✨ Feature</SelectItem>
                <SelectItem value="hotfix">🔥 Hotfix</SelectItem>
                <SelectItem value="fix">🔧 Fix</SelectItem>
                <SelectItem value="improvement">📈 Mejora</SelectItem>
                <SelectItem value="refactor">♻️ Refactor</SelectItem>
                <SelectItem value="docs">📝 Documentación</SelectItem>
                <SelectItem value="test">🧪 Test</SelectItem>
                <SelectItem value="chore">🔨 Chore</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Asignado a</Label>
              <MultiSelectDeveloper
                members={developerMembers}
                selectedIds={formData.assignee_ids}
                onSelectionChange={(ids) => setFormData(prev => ({ ...prev, assignee_ids: ids }))}
                placeholder="Buscar desarrollador..."
                disabled={loading || success}
              />
            </div>

            <div className="space-y-2">
              <Label>Fecha límite</Label>
              <DatePicker
                value={formData.due_date ? new Date(formData.due_date) : null}
                onChange={(date) => setFormData({ ...formData, due_date: date ? date.toISOString().split('T')[0] : '' })}
                placeholder="Seleccionar fecha"
                disabled={loading || success}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading || success} className="bg-primary hover:bg-primary/90">
              {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Creando...</> : 'Crear Tarea'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
