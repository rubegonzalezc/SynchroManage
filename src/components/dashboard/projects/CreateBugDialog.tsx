'use client'

import { useState, useMemo } from 'react'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Plus, Loader2, CheckCircle, Bug, Search, X } from 'lucide-react'
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

interface TaskOption {
  id: string
  task_number: number | null
  title: string
  sprint_id?: string | null
}

interface BugItem {
  id: string
  title: string
  description: string | null
  steps_to_reproduce: string | null
  severity: string
  status: string
  created_at: string
  sprint: { id: string; name: string; status: string } | null
  task: { id: string; task_number: number | null; title: string } | null
  assignee: { id: string; full_name: string; avatar_url: string | null } | null
  reporter: { id: string; full_name: string; avatar_url: string | null } | null
}

interface CreateBugDialogProps {
  projectId: string
  members: Member[]
  sprints?: SprintOption[]
  tasks?: TaskOption[]
  initialSprintId?: string | null
  onBugCreated?: (bug: BugItem) => void
}

const severityOptions = [
  { value: 'low', label: 'Baja', color: 'text-green-600' },
  { value: 'medium', label: 'Media', color: 'text-yellow-600' },
  { value: 'high', label: 'Alta', color: 'text-orange-600' },
  { value: 'critical', label: 'Crítica', color: 'text-red-600' },
]

export function CreateBugDialog({ projectId, members, sprints = [], tasks = [], initialSprintId, onBugCreated }: CreateBugDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [taskSearch, setTaskSearch] = useState('')
  const [taskDropdownOpen, setTaskDropdownOpen] = useState(false)

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    steps_to_reproduce: '',
    severity: 'medium',
    sprint_id: initialSprintId ?? '',
    task_id: '',
    assignee_id: null as string | null,
  })

  // Tareas filtradas por sprint seleccionado y búsqueda
  const filteredTasks = useMemo(() => {
    let result = tasks
    if (formData.sprint_id) {
      result = result.filter(t => t.sprint_id === formData.sprint_id)
    }
    if (taskSearch.trim()) {
      const q = taskSearch.toLowerCase()
      result = result.filter(t =>
        t.title.toLowerCase().includes(q) ||
        (t.task_number != null && `#${t.task_number}`.includes(q))
      )
    }
    return result
  }, [tasks, formData.sprint_id, taskSearch])

  const selectedTask = tasks.find(t => t.id === formData.task_id)

  const handleSprintChange = (v: string) => {
    // Al cambiar sprint, limpiar tarea si no pertenece al nuevo sprint
    const newSprintId = v === 'none' ? '' : v
    const taskStillValid = !newSprintId || tasks.find(t => t.id === formData.task_id)?.sprint_id === newSprintId
    setFormData(prev => ({
      ...prev,
      sprint_id: newSprintId,
      task_id: taskStillValid ? prev.task_id : '',
    }))
    setTaskSearch('')
  }

  const handleTaskSelect = (task: TaskOption) => {
    setFormData(prev => ({ ...prev, task_id: task.id }))
    setTaskSearch('')
    setTaskDropdownOpen(false)
  }

  const handleClearTask = () => {
    setFormData(prev => ({ ...prev, task_id: '' }))
    setTaskSearch('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/dashboard/bugs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project_id: projectId,
          ...formData,
          sprint_id: formData.sprint_id || null,
          task_id: formData.task_id || null,
        }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Error desconocido')

      setSuccess(true)
      setTimeout(() => {
        setOpen(false)
        setFormData({
          title: '', description: '', steps_to_reproduce: '',
          severity: 'medium', sprint_id: initialSprintId ?? '', task_id: '', assignee_id: null,
        })
        setTaskSearch('')
        setSuccess(false)
        onBugCreated?.(data.bug)
      }, 1000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear bug')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5 border-red-200 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20">
          <Bug className="w-4 h-4" /> Reportar Bug
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bug className="w-5 h-5 text-red-500" /> Reportar Bug
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400 px-4 py-3 rounded-lg text-sm">{error}</div>
          )}
          {success && (
            <div className="bg-green-50 border border-green-200 text-green-600 dark:bg-green-900/20 dark:border-green-800 dark:text-green-400 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
              <CheckCircle className="w-4 h-4" /> Bug reportado
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="bug-title">Título *</Label>
            <Input
              id="bug-title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
              placeholder="Descripción breve del bug"
              disabled={loading || success}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="bug-description">Descripción</Label>
            <Textarea
              id="bug-description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe el comportamiento incorrecto..."
              disabled={loading || success}
              className="min-h-[80px] resize-y"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="bug-steps">Pasos para reproducir</Label>
            <Textarea
              id="bug-steps"
              value={formData.steps_to_reproduce}
              onChange={(e) => setFormData({ ...formData, steps_to_reproduce: e.target.value })}
              placeholder="1. Ir a...\n2. Hacer clic en...\n3. Observar que..."
              disabled={loading || success}
              className="min-h-[80px] resize-y font-mono text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Severidad</Label>
              <Select
                value={formData.severity}
                onValueChange={(v) => setFormData({ ...formData, severity: v })}
                disabled={loading || success}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {severityOptions.map(s => (
                    <SelectItem key={s.value} value={s.value}>
                      <span className={s.color}>{s.label}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Sprint</Label>
              <Select
                value={formData.sprint_id || 'none'}
                onValueChange={handleSprintChange}
                disabled={loading || success}
              >
                <SelectTrigger><SelectValue placeholder="Sin sprint" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sin sprint</SelectItem>
                  {sprints.map(s => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}{s.status === 'active' ? ' (Activo)' : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Tarea relacionada con búsqueda */}
          <div className="space-y-2">
            <Label>Tarea relacionada</Label>
            {selectedTask ? (
              <div className="flex items-center gap-2 px-3 py-2 border border-border rounded-md bg-muted/50">
                <span className="flex-1 text-sm truncate">
                  {selectedTask.task_number ? `#${selectedTask.task_number} - ` : ''}{selectedTask.title}
                </span>
                <button
                  type="button"
                  onClick={handleClearTask}
                  disabled={loading || success}
                  className="text-muted-foreground hover:text-foreground flex-shrink-0"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="relative">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                  <Input
                    value={taskSearch}
                    onChange={(e) => { setTaskSearch(e.target.value); setTaskDropdownOpen(true) }}
                    onFocus={() => setTaskDropdownOpen(true)}
                    onBlur={() => setTimeout(() => setTaskDropdownOpen(false), 150)}
                    placeholder={formData.sprint_id ? 'Buscar tarea del sprint...' : 'Buscar tarea...'}
                    disabled={loading || success}
                    className="pl-9"
                  />
                </div>
                {taskDropdownOpen && (
                  <div className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-md shadow-md max-h-48 overflow-y-auto">
                    {filteredTasks.length === 0 ? (
                      <p className="px-3 py-2 text-sm text-muted-foreground">
                        {formData.sprint_id ? 'No hay tareas en este sprint' : 'No hay tareas disponibles'}
                      </p>
                    ) : (
                      filteredTasks.map(t => (
                        <button
                          key={t.id}
                          type="button"
                          onMouseDown={() => handleTaskSelect(t)}
                          className="w-full text-left px-3 py-2 text-sm hover:bg-muted transition-colors truncate"
                        >
                          {t.task_number ? <span className="text-muted-foreground font-mono mr-1">#{t.task_number}</span> : null}
                          {t.title}
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label>Asignar a</Label>
            <SingleSelectUser
              users={members}
              selectedId={formData.assignee_id}
              onSelectionChange={(id) => setFormData({ ...formData, assignee_id: id })}
              placeholder="Asignar desarrollador..."
              emptyLabel="Sin asignar"
              disabled={loading || success}
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading || success} className="bg-red-600 hover:bg-red-700 text-white">
              {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Reportando...</> : 'Reportar Bug'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
