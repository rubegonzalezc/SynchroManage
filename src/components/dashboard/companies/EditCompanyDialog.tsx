'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Pencil, Loader2, CheckCircle } from 'lucide-react'
import { formatRut } from '@/lib/utils/formatRut'

interface Company {
  id: string
  name: string
  rut: string | null
  email: string | null
  phone: string | null
  address: string | null
  is_active: boolean
}

interface EditCompanyDialogProps {
  company: Company
  onCompanyUpdated?: () => void
}

export function EditCompanyDialog({ company, onCompanyUpdated }: EditCompanyDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const router = useRouter()

  const [formData, setFormData] = useState({
    name: company.name,
    rut: company.rut || '',
    email: company.email || '',
    phone: company.phone || '',
    address: company.address || '',
    is_active: company.is_active,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(false)

    try {
      const response = await fetch(`/api/dashboard/companies/${company.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error)

      setSuccess(true)
      setTimeout(() => {
        setOpen(false)
        setSuccess(false)
        router.refresh()
        onCompanyUpdated?.()
      }, 1500)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al actualizar')
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
          <DialogTitle>Editar Empresa</DialogTitle>
          <DialogDescription>Modifica los datos de {company.name}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400 px-4 py-3 rounded-lg text-sm">{error}</div>
          )}
          {success && (
            <div className="bg-green-50 border border-green-200 text-green-600 dark:bg-green-900/20 dark:border-green-800 dark:text-green-400 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
              <CheckCircle className="w-4 h-4" /> Empresa actualizada correctamente
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="edit_name">Nombre *</Label>
            <Input id="edit_name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required disabled={loading || success} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit_rut">RUT</Label>
              <Input id="edit_rut" value={formData.rut} onChange={(e) => setFormData({ ...formData, rut: formatRut(e.target.value) })} maxLength={12} disabled={loading || success} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit_phone">Teléfono</Label>
              <Input id="edit_phone" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} disabled={loading || success} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit_email">Email</Label>
            <Input id="edit_email" type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} disabled={loading || success} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit_address">Dirección</Label>
            <Input id="edit_address" value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} disabled={loading || success} />
          </div>

          <div className="flex items-center gap-2">
            <input type="checkbox" id="is_active" checked={formData.is_active} onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })} className="rounded" disabled={loading || success} />
            <Label htmlFor="is_active" className="text-sm">Empresa activa</Label>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={loading}>Cancelar</Button>
            <Button type="submit" disabled={loading || success} className="bg-primary hover:bg-primary/90">
              {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Guardando...</> : 'Guardar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
