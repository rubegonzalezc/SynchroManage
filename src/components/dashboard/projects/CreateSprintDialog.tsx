'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { DatePicker } from '@/components/ui/date-picker'
import { Loader2, CheckCircle } from 'lucide-react'

export interface Sprint {
  id: string
  name: string
  goal: string | null
  start_date: string
  end_date: string
  status: 'planning' | 'active' | 'completed'
  order_index: number
  tasks?: { id: string; status: string; is_carry_over: boolean }[]
}

interface CreateSprintDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  projectId: string
  onCreated: (sprint: Sprint) => void
}

export function CreateSprintDialog({ open, onOpenChange, projectId, onCreated }: CreateSprintDialogProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    goal: '',
    start_date: null as Date | null,
    end_date: null as Date | null,
  })

  const handleSubmit = async () => {
    if (!formData.name.trim() || !formData.start_date || !formData.end_date) {
      setError('Nombre, fecha de inicio y fecha de fin son obligatorios')
      return
    }
    if (formData.end_date <= formData.start_date) {
      setError('La fecha de fin debe ser posterior a la de inicio')
      return
    }

    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/dashboard/projects/${projectId}/sprints`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name.trim(),
          goal: formData.goal.trim() || null,
          start_date: format(formData.start_date, 'yyyy-MM-dd'),
          end_date: format(formData.end_date, 'yyyy-MM-dd'),
        }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error)

      setSuccess(true)
      onCreated(data.sprint)
      setTimeout(() => {
        onOpenChange(false)
        setFormData({ name: '', goal: '', start_date: null, end_date: null })
        setSuccess(false)
      }, 800)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear sprint')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nuevo Sprint</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}
          {success && (
            <div className="bg-green-50 border border-green-200 text-green-600 dark:bg-green-900/20 dark:border-green-800 dark:text-green-400 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
              <CheckCircle className="w-4 h-4" /> Sprint creado
            </div>
          )}

          <div className="space-y-2">
            <Label>Nombre del Sprint *</Label>
            <Input
              placeholder="Ej. Sprint 1 — Autenticación"
              value={formData.name}
              onChange={e => setFormData(p => ({ ...p, name: e.target.value }))}
              disabled={loading || success}
            />
          </div>

          <div className="space-y-2">
            <Label>Objetivo</Label>
            <Textarea
              placeholder="¿Qué se quiere lograr en este sprint?"
              value={formData.goal}
              onChange={e => setFormData(p => ({ ...p, goal: e.target.value }))}
              disabled={loading || success}
              className="resize-none min-h-[80px]"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Fecha de inicio *</Label>
              <DatePicker
                value={formData.start_date}
                onChange={date => setFormData(p => ({ ...p, start_date: date ?? null }))}
                placeholder="Inicio"
                disabled={loading || success}
              />
            </div>
            <div className="space-y-2">
              <Label>Fecha de fin *</Label>
              <DatePicker
                value={formData.end_date}
                onChange={date => setFormData(p => ({ ...p, end_date: date ?? null }))}
                placeholder="Fin"
                disabled={loading || success}
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={loading || success} className="bg-primary hover:bg-primary/90">
            {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Creando...</> : 'Crear Sprint'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
