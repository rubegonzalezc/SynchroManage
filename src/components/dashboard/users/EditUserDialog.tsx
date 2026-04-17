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
import { Pencil, Loader2 } from 'lucide-react'
import { MultiSelectRole } from '@/components/ui/multi-select-role'
import { getPrimaryRole, type RoleName } from '@/lib/types/roles'

interface Role { id: number; name: string; description: string }
interface Company { id: string; name: string }

interface User {
  id: string
  email: string | null
  full_name: string | null
  role_id: number
  role: Role | null
  company_id: string | null
  roles?: string[]
}

interface EditUserDialogProps {
  user: User
  roles: Role[]
  onSuccess?: () => void
}

export function EditUserDialog({ user, roles, onSuccess }: EditUserDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [companies, setCompanies] = useState<Company[]>([])

  // Inicializar role_ids desde user.roles (nombres) mapeados a IDs
  const getInitialRoleIds = (): string[] => {
    if (user.roles && user.roles.length > 0) {
      return user.roles
        .map(roleName => roles.find(r => r.name === roleName)?.id.toString())
        .filter((id): id is string => id !== undefined)
    }
    return user.role_id ? [user.role_id.toString()] : []
  }

  const [formData, setFormData] = useState({
    full_name: user.full_name || '',
    role_ids: getInitialRoleIds(),
    company_id: user.company_id || '',
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

  useEffect(() => {
    setFormData({
      full_name: user.full_name || '',
      role_ids: getInitialRoleIds(),
      company_id: user.company_id || '',
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (formData.role_ids.length === 0) {
      setError('Debes seleccionar al menos un rol')
      return
    }
    setLoading(true)
    setError(null)

    try {
      // Determinar rol primario para profiles.role_id (backward compat)
      const selectedRoleNames = formData.role_ids
        .map(id => roles.find(r => r.id.toString() === id)?.name as RoleName)
        .filter(Boolean)
      const primaryRole = getPrimaryRole(selectedRoleNames)
      const primaryRoleId = roles.find(r => r.name === primaryRole)?.id

      const response = await fetch(`/api/dashboard/users/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: formData.full_name,
          role_ids: formData.role_ids.map(id => parseInt(id)),
          primary_role_id: primaryRoleId,
          company_id: hasStakeholder ? (formData.company_id || null) : null,
        }),
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Error al actualizar usuario')

      setOpen(false)
      onSuccess?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al actualizar usuario')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
          <Pencil className="w-4 h-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Editar Usuario</DialogTitle>
          <DialogDescription>Modifica los datos de {user.full_name || user.email}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400 px-4 py-3 rounded-lg text-sm">{error}</div>
          )}

          <div className="space-y-2">
            <Label htmlFor="edit_email">Correo Electrónico</Label>
            <Input id="edit_email" type="email" value={user.email || ''} disabled className="bg-muted" />
            <p className="text-xs text-muted-foreground">El correo no se puede modificar</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit_full_name">Nombre Completo</Label>
            <Input
              id="edit_full_name"
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              required
              placeholder="Juan Pérez"
            />
          </div>

          <div className="space-y-2">
            <Label>Roles</Label>
            <MultiSelectRole
              roles={roles}
              selectedIds={formData.role_ids}
              onSelectionChange={(ids) => setFormData({ ...formData, role_ids: ids, company_id: '' })}
              placeholder="Seleccionar roles..."
            />
          </div>

          {hasStakeholder && (
            <div className="space-y-2">
              <Label htmlFor="edit_company">Empresa</Label>
              <Select
                value={formData.company_id}
                onValueChange={(value) => setFormData({ ...formData, company_id: value })}
              >
                <SelectTrigger><SelectValue placeholder="Selecciona una empresa" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Sin empresa</SelectItem>
                  {companies.map((company) => (
                    <SelectItem key={company.id} value={company.id}>{company.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">Los stakeholders deben estar asociados a una empresa</p>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={loading}>Cancelar</Button>
            <Button type="submit" disabled={loading} className="bg-primary hover:bg-primary/90">
              {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Guardando...</> : 'Guardar Cambios'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
