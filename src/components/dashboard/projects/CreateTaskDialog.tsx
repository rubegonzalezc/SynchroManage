'use client'

import { useState, useEffect } from 'react'
import { format } from 'date-fns'
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
import { Textarea } from '@/components/ui/textarea'
import { DatePicker } from '@/components/ui/date-picker'
import { Checkbox } from '@/components/ui/checkbox'
import { Plus, Loader2, CheckCircle, GitBranch } from 'lucide-react'
import { CopyButton } from '@/components/ui/copy-button'
import { TASK_CATEGORIES } from '@/lib/constants/categories'
import { SingleSelectUser } from '@/components/ui/single-select-user'

interface Member {
  id: string
  full_name: string
  avatar_url: string | null
  roles?: string[]
}

interface SprintOption {
  id: string
  name: string
  status: string
}

interface CreateTaskDialogProps {
  projectId: string
  projectName: string
  members: Member[]
  sprints?: SprintOption[]
  initialSprintId?: string | null
  onTaskCreated?: () => void
}

export function CreateTaskDialog({ projectId, projectName, members, sprints = [], initialSprintId, onTaskCreated }: CreateTaskDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [autoBranchName, setAutoBranchName] = useState(true)

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: 'backlog',
    priority: 'medium',
    category: 'task',
    assignee_ids: [] as string[],
    reviewer_id: null as string | null,
    due_date: '',
    sprint_id: initialSprintId ?? '',
    branch_name: '',
    complexity: null as number | null,
  })

  // Actualizar sprint_id cuando cambia initialSprintId (sprint activo seleccionado)
  useEffect(() => {
    setFormData(prev => ({ ...prev, sprint_id: initialSprintId ?? '' }))
  }, [initialSprintId])

  // Previsualización de la rama en tiempo real mientras el autoBranchName está activo
  const previewSlug = formData.title
        .toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
  const generatedPreview = formData.title ? `${formData.category}/${previewSlug}-[#]` : ''

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
          sprint_id: formData.sprint_id || null,
          assignee_ids: formData.assignee_ids.length > 0 ? formData.assignee_ids : [],
          auto_branch: autoBranchName, // Pasamos la bandera a la API para que maneje el número
        }),
      })
      let data;
      try {
        data = await response.json()
      } catch (err) {
        throw new Error(`Error del servidor (${response.status})`)
      }
      if (!response.ok) throw new Error(data.error || 'Error desconocido')

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
          priority: 'medium', category: 'task', assignee_ids: [], reviewer_id: null, due_date: '',
          sprint_id: initialSprintId ?? '', branch_name: '', complexity: null,
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
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe la tarea en detalle..."
              disabled={loading || success}
              className="min-h-[100px] resize-y"
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

            <div className="space-y-2">
              <Label>Categoría</Label>
              <Select
                value={formData.category}
                onValueChange={(v) => setFormData({ ...formData, category: v })}
                disabled={loading || success}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TASK_CATEGORIES.map(cat => (
                    <SelectItem key={cat.slug} value={cat.slug}>
                      {cat.icon} {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Complejidad</Label>
              <Select
                value={formData.complexity === null ? '?' : String(formData.complexity)}
                onValueChange={(v) => setFormData({ ...formData, complexity: v === '?' ? null : Number(v) })}
                disabled={loading || success}
              >
                <SelectTrigger><SelectValue placeholder="Seleccionar complejidad" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="?">? — No sé</SelectItem>
                  {[1,2,3,4,5,6,7,8,9,10].map(n => (
                    <SelectItem key={n} value={String(n)}>{n}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
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
                value={formData.due_date ? new Date(formData.due_date + 'T00:00:00') : null}
                onChange={(date) => setFormData({ ...formData, due_date: date ? format(date, 'yyyy-MM-dd') : '' })}
                placeholder="Seleccionar fecha"
                disabled={loading || success}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5">
                Revisor (QA)
                <span className="text-[10px] font-normal text-muted-foreground bg-muted px-1.5 py-0.5 rounded">opcional</span>
              </Label>
              <SingleSelectUser
                users={members}
                selectedId={formData.reviewer_id}
                onSelectionChange={(id) => setFormData(prev => ({ ...prev, reviewer_id: id }))}
                placeholder="Asignar revisor..."
                emptyLabel="Sin revisor"
                disabled={loading || success}
              />
            </div>
          </div>

          {sprints.length > 0 && (
            <div className="space-y-2">
              <Label>Sprint</Label>
              <Select
                value={formData.sprint_id || 'none'}
                onValueChange={(v) => setFormData(prev => ({ ...prev, sprint_id: v === 'none' ? '' : v }))}
                disabled={loading || success}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sin sprint (Backlog)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sin sprint (Backlog)</SelectItem>
                  {sprints.map(s => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                      {s.status === 'active' && ' (Activo)'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="branch_name" className="flex items-center gap-1.5">
                <GitBranch className="w-3.5 h-3.5" />
                Nombre de rama
              </Label>
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="autoBranch" 
                  checked={autoBranchName} 
                  onCheckedChange={(checked) => setAutoBranchName(checked === true)}
                  disabled={loading || success}
                />
                <Label
                  htmlFor="autoBranch"
                  className="text-xs text-muted-foreground font-normal cursor-pointer leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Autocompletar
                </Label>
              </div>
            </div>
            <div className="flex gap-2">
              <Input
                id="branch_name"
                value={autoBranchName ? generatedPreview : formData.branch_name}
                onChange={(e) => {
                  setFormData({ ...formData, branch_name: e.target.value })
                  if (autoBranchName) setAutoBranchName(false)
                }}
                placeholder="feat/nombre-de-la-tarea"
                disabled={loading || success || autoBranchName}
              />
              <CopyButton value={autoBranchName ? generatedPreview : formData.branch_name} />
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
