'use client'

import { useState, useEffect } from 'react'
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { DatePicker } from '@/components/ui/date-picker'
import { Plus, Loader2, GitPullRequest, CheckCircle, X, Sparkles } from 'lucide-react'

interface Company { id: string; name: string }
interface User { id: string; full_name: string; email: string; role: { name: string } | null; roles?: string[] }
interface ParentProject {
  id: string
  name: string
  description?: string | null
  company?: { id: string; name: string } | null
  pm?: { id: string; full_name: string } | null
  tech_lead?: { id: string; full_name: string } | null
  members?: Array<{ role: string; user: { id: string; full_name: string } }>
}

interface CreateChangeControlDialogProps {
  onCreated?: () => void
  onCancelled?: () => void
  // Cuando se abre desde el botón en el detalle del proyecto
  preselectedProject?: ParentProject
  trigger?: React.ReactNode
  // Tareas a mudar al CC una vez creado
  pendingTaskIds?: string[]
  // Forzar apertura programática (sin trigger)
  forceOpen?: boolean
}

const emptyForm = {
  name: '',
  description: '',
  company_id: '',
  pm_id: '',
  tech_lead_id: '',
  status: 'planning',
  start_date: '',
  end_date: '',
  parent_project_id: '',
}

export function CreateChangeControlDialog({ onCreated, onCancelled, preselectedProject, trigger, pendingTaskIds = [], forceOpen }: CreateChangeControlDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const [companies, setCompanies] = useState<Company[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [parentProjects, setParentProjects] = useState<ParentProject[]>([])

  const [formData, setFormData] = useState(emptyForm)
  const [selectedDevelopers, setSelectedDevelopers] = useState<string[]>([])
  const [selectedStakeholders, setSelectedStakeholders] = useState<string[]>([])

  useEffect(() => {
    if (forceOpen) setOpen(true)
  }, [forceOpen])

  useEffect(() => {
    if (open) {
      const safeFetch = async (url: string) => {
        const r = await fetch(url)
        if (!r.ok) return {}
        return r.json()
      }

      Promise.all([
        safeFetch('/api/dashboard/companies'),
        safeFetch('/api/dashboard/users'),
        safeFetch('/api/dashboard/projects?type=project'),
      ]).then(([companiesData, usersData, projectsData]) => {
        setCompanies(companiesData.companies || [])
        setUsers(usersData.users || [])
        setParentProjects(projectsData.projects || [])

        // Si hay proyecto pre-seleccionado, auto-llenar
        if (preselectedProject) {
          applyProjectDefaults(preselectedProject)
        }
      }).catch(console.error)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const applyProjectDefaults = (project: ParentProject) => {
    setFormData(prev => ({
      ...prev,
      parent_project_id: project.id,
      name: project.name,
      description: project.description || `Control de cambios del proyecto "${project.name}"`,
      company_id: project.company?.id || prev.company_id,
      pm_id: project.pm?.id || prev.pm_id,
      tech_lead_id: project.tech_lead?.id || prev.tech_lead_id,
    }))
    const devIds = project.members?.filter(m => m.role === 'developer').map(m => m.user.id) || []
    const stakeIds = project.members?.filter(m => m.role === 'stakeholder').map(m => m.user.id) || []
    setSelectedDevelopers(devIds)
    setSelectedStakeholders(stakeIds)
  }

  // Cuando el usuario cambia el proyecto origen manualmente, auto-llenar
  const handleParentProjectChange = (projectId: string) => {
    const selected = parentProjects.find(p => p.id === projectId)
    if (selected) {
      applyProjectDefaults(selected)
    } else {
      setFormData(prev => ({ ...prev, parent_project_id: projectId }))
    }
  }

  const pms = users.filter(u => u.roles?.includes('pm') || u.roles?.includes('admin'))
  const techLeads = users.filter(u => u.roles?.includes('tech_lead') || u.roles?.includes('admin'))
  const developers = users.filter(u => u.roles?.includes('developer'))
  const stakeholders = users.filter(u => u.roles?.includes('stakeholder'))

  const addDeveloper = (userId: string) => {
    if (!selectedDevelopers.includes(userId)) setSelectedDevelopers([...selectedDevelopers, userId])
  }
  const removeDeveloper = (userId: string) => setSelectedDevelopers(selectedDevelopers.filter(id => id !== userId))
  const addStakeholder = (userId: string) => {
    if (!selectedStakeholders.includes(userId)) setSelectedStakeholders([...selectedStakeholders, userId])
  }
  const removeStakeholder = (userId: string) => setSelectedStakeholders(selectedStakeholders.filter(id => id !== userId))

  const handleClose = () => {
    setOpen(false)
    setFormData(emptyForm)
    setSelectedDevelopers([])
    setSelectedStakeholders([])
    setError(null)
    setSuccess(false)
    onCancelled?.()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const members = [
        ...selectedDevelopers.map(userId => ({ user_id: userId, role: 'developer' })),
        ...selectedStakeholders.map(userId => ({ user_id: userId, role: 'stakeholder' })),
      ]

      const response = await fetch('/api/dashboard/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          type: 'change_control',
          company_id: formData.company_id || null,
          pm_id: formData.pm_id || null,
          tech_lead_id: formData.tech_lead_id || null,
          parent_project_id: formData.parent_project_id || null,
          members,
        }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error)

      // Mudar tareas pendientes al nuevo CC si se solicitó
      if (pendingTaskIds.length > 0 && data.project?.id) {
        await fetch('/api/dashboard/tasks/migrate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ task_ids: pendingTaskIds, target_project_id: data.project.id }),
        })
      }

      setSuccess(true)
      setTimeout(() => {
        handleClose()
        onCreated?.()
      }, 1500)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear control de cambios')
    } finally {
      setLoading(false)
    }
  }

  const isPreselected = !!preselectedProject

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); else setOpen(true) }}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button className="bg-primary hover:bg-primary/90">
            <Plus className="w-4 h-4 mr-2" /> Nuevo CC
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GitPullRequest className="w-5 h-5" /> Nuevo Control de Cambios
          </DialogTitle>
          <DialogDescription>
            {isPreselected
              ? `Creando CC a partir de "${preselectedProject.name}". El equipo fue importado automáticamente.`
              : 'Crea un control de cambios vinculado a un proyecto existente'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400 px-4 py-3 rounded-lg text-sm">{error}</div>
          )}
          {success && (
            <div className="bg-green-50 border border-green-200 text-green-600 dark:bg-green-900/20 dark:border-green-800 dark:text-green-400 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
              <CheckCircle className="w-4 h-4" /> Control de cambios creado correctamente
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="cc_name">Nombre *</Label>
            <Input
              id="cc_name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              placeholder="Ej: Cambio de módulo de pagos"
              disabled={loading || success}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="cc_description">Descripción</Label>
            <Input
              id="cc_description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Descripción del cambio solicitado"
              disabled={loading || success}
            />
          </div>

          {/* Proyecto origen */}
          <div className="space-y-2">
            <Label className="flex items-center gap-1">
              Proyecto Origen
              {formData.parent_project_id && (
                <span className="text-xs text-orange-600 dark:text-orange-400 flex items-center gap-1 ml-1">
                  <Sparkles className="w-3 h-3" /> equipo importado
                </span>
              )}
            </Label>
            <Select
              value={formData.parent_project_id}
              onValueChange={handleParentProjectChange}
              disabled={loading || success || isPreselected}
            >
              <SelectTrigger><SelectValue placeholder="Vincular a proyecto existente (opcional)" /></SelectTrigger>
              <SelectContent>
                {parentProjects.map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Empresa</Label>
              <Select value={formData.company_id} onValueChange={(v) => setFormData({ ...formData, company_id: v })} disabled={loading || success}>
                <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                <SelectContent>
                  {companies.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Estado</Label>
              <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v })} disabled={loading || success}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="planning">Planificación</SelectItem>
                  <SelectItem value="in_progress">En Progreso</SelectItem>
                  <SelectItem value="paused">Pausado</SelectItem>
                  <SelectItem value="completed">Completado</SelectItem>
                  <SelectItem value="cancelled">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Project Manager</Label>
              <Select value={formData.pm_id} onValueChange={(v) => setFormData({ ...formData, pm_id: v })} disabled={loading || success}>
                <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                <SelectContent>
                  {pms.map((u) => (<SelectItem key={u.id} value={u.id}>{u.full_name}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Tech Lead</Label>
              <Select value={formData.tech_lead_id} onValueChange={(v) => setFormData({ ...formData, tech_lead_id: v })} disabled={loading || success}>
                <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                <SelectContent>
                  {techLeads.map((u) => (<SelectItem key={u.id} value={u.id}>{u.full_name}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Desarrolladores</Label>
            <Select value="" onValueChange={addDeveloper} disabled={loading || success}>
              <SelectTrigger><SelectValue placeholder="Agregar desarrollador..." /></SelectTrigger>
              <SelectContent>
                {developers.filter(d => !selectedDevelopers.includes(d.id)).map((u) => (
                  <SelectItem key={u.id} value={u.id}>{u.full_name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedDevelopers.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {selectedDevelopers.map(devId => {
                  const dev = developers.find(d => d.id === devId) || { id: devId, full_name: preselectedProject?.members?.find(m => m.user.id === devId)?.user.full_name || devId }
                  return (
                    <Badge key={devId} variant="secondary" className="flex items-center gap-1">
                      {dev.full_name}
                      <button type="button" onClick={() => removeDeveloper(devId)} className="ml-1 hover:text-red-600" disabled={loading || success}>
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  )
                })}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label>Stakeholders</Label>
            <Select value="" onValueChange={addStakeholder} disabled={loading || success}>
              <SelectTrigger><SelectValue placeholder="Agregar stakeholder..." /></SelectTrigger>
              <SelectContent>
                {stakeholders.filter(s => !selectedStakeholders.includes(s.id)).map((u) => (
                  <SelectItem key={u.id} value={u.id}>{u.full_name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedStakeholders.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {selectedStakeholders.map(sId => {
                  const stakeholder = stakeholders.find(s => s.id === sId) || { id: sId, full_name: preselectedProject?.members?.find(m => m.user.id === sId)?.user.full_name || sId }
                  return (
                    <Badge key={sId} variant="secondary" className="flex items-center gap-1 bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400">
                      {stakeholder.full_name}
                      <button type="button" onClick={() => removeStakeholder(sId)} className="ml-1 hover:text-red-600" disabled={loading || success}>
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  )
                })}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Fecha Inicio</Label>
              <DatePicker
                value={formData.start_date ? new Date(formData.start_date) : null}
                onChange={(date) => setFormData({ ...formData, start_date: date ? date.toISOString().split('T')[0] : '' })}
                placeholder="Seleccionar inicio"
                disabled={loading || success}
              />
            </div>
            <div className="space-y-2">
              <Label>Fecha Fin</Label>
              <DatePicker
                value={formData.end_date ? new Date(formData.end_date) : null}
                onChange={(date) => setFormData({ ...formData, end_date: date ? date.toISOString().split('T')[0] : '' })}
                placeholder="Seleccionar fin"
                disabled={loading || success}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={handleClose} disabled={loading}>Cancelar</Button>
            <Button type="submit" disabled={loading || success} className="bg-primary hover:bg-primary/90">
              {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Creando...</> : 'Crear CC'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
