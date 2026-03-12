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
import { Plus, Loader2, Mail } from 'lucide-react'
import { MultiSelectRole } from '@/components/ui/multi-select-role'

interface Role { id: number; name: string; description: string }
interface Company { id: string; name: string }
interface CreateUserDialogProps { roles: Role[]; onSuccess?: () => void }

export function CreateUserDialog({ roles, onSuccess }: CreateUserDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [companies, setCompanies] = useState<Company[]>([])

  const [formData, setFormData] = useState({
    email: '', full_name: '', role_ids: [] as string[], company_id: '',
  })

  const selectedRoles = roles.filter(r => formData.role_ids.includes(r.id.toString()))
  const hasStakeholder = selectedRoles.some(r => r.name === 'stakeholder')

  useEffect(() => {
    if (open) {
      fetch('/api/dashboard/companies')
        .then(res => res.json())
        .then(data => setCompanies(data.companies || []))
    }
  }, [open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (formData.role_ids.length === 0) {
      setError('Debes seleccionar al menos un rol')
      return
    }
    setLoading(true)
    setError(null)
    setSuccess(false)

    try {
      const response = await fetch('/api/dashboard/invite-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          full_name: formData.full_name,
          role_ids: formData.role_ids.map(Number),
          company_id: hasStakeholder ? formData.company_id : null,
        }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Error al invitar usuario')

      setSuccess(true)
      setTimeout(() => {
        setOpen(false)
        setFormData({ email: '', full_name: '', role_ids: [], company_id: '' })
        setSuccess(false)
        onSuccess?.()
      }, 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al invitar usuario')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-primary hover:bg-primary/90">
          <Plus className="w-4 h-4 mr-2" /> Invitar Usuario
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Invitar Usuario</DialogTitle>
          <DialogDescription>El usuario recibirá un email para establecer su contraseña</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <div className="bg-red-50 border border-red-200 text-red-600 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400 px-4 py-3 rounded-lg text-sm">{error}</div>}
          {success && (
            <div className="bg-green-50 border border-green-200 text-green-600 dark:bg-green-900/20 dark:border-green-800 dark:text-green-400 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
              <Mail className="w-4 h-4" /> Invitación enviada correctamente
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="full_name">Nombre Completo</Label>
            <Input id="full_name" value={formData.full_name} onChange={(e) => setFormData({ ...formData, full_name: e.target.value })} required placeholder="Juan Pérez" disabled={loading || success} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Correo Electrónico</Label>
            <Input id="email" type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} required placeholder="juan@empresa.com" disabled={loading || success} />
          </div>

          <div className="space-y-2">
            <Label>Roles</Label>
            <MultiSelectRole
              roles={roles}
              selectedIds={formData.role_ids}
              onSelectionChange={(ids) => setFormData({ ...formData, role_ids: ids, company_id: '' })}
              placeholder="Seleccionar roles..."
              disabled={loading || success}
            />
          </div>

          {hasStakeholder && (
            <div className="space-y-2">
              <Label htmlFor="company">Empresa</Label>
              <Select value={formData.company_id} onValueChange={(value) => setFormData({ ...formData, company_id: value })} required disabled={loading || success}>
                <SelectTrigger><SelectValue placeholder="Selecciona una empresa" /></SelectTrigger>
                <SelectContent>
                  {companies.map((company) => (
                    <SelectItem key={company.id} value={company.id}>{company.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={loading}>Cancelar</Button>
            <Button type="submit" disabled={loading || success} className="bg-primary hover:bg-primary/90">
              {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Enviando...</> : <><Mail className="w-4 h-4 mr-2" />Enviar Invitación</>}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
