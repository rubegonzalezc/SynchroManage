'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Trash2, Loader2, AlertTriangle, CheckCircle } from 'lucide-react'

interface DeleteProjectDialogProps {
  projectId: string
  projectName: string
  onDeleted?: () => void // Callback opcional para cuando se elimina desde la tabla
  triggerVariant?: 'button' | 'icon' // Tipo de trigger
}

export function DeleteProjectDialog({ projectId, projectName, onDeleted, triggerVariant = 'button' }: DeleteProjectDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const router = useRouter()

  const handleDelete = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/dashboard/projects/${projectId}`, { method: 'DELETE' })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error)

      setSuccess(true)
      setTimeout(() => {
        setOpen(false)
        setSuccess(false)
        if (onDeleted) {
          onDeleted()
        } else {
          router.push('/projects')
        }
      }, 1500)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {triggerVariant === 'icon' ? (
          <Button variant="ghost" size="icon" className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/20">
            <Trash2 className="w-4 h-4" />
          </Button>
        ) : (
          <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/20">
            <Trash2 className="w-4 h-4 mr-2" /> Eliminar
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="w-5 h-5" /> Eliminar Proyecto
          </DialogTitle>
          <DialogDescription>
            ¿Estás seguro de eliminar <strong>{projectName}</strong>? Se eliminarán todas las tareas, comentarios y notificaciones asociadas. Esta acción no se puede deshacer.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400 px-4 py-3 rounded-lg text-sm">{error}</div>
        )}
        
        {success && (
          <div className="bg-green-50 border border-green-200 text-green-600 dark:bg-green-900/20 dark:border-green-800 dark:text-green-400 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
            <CheckCircle className="w-4 h-4" /> Proyecto eliminado correctamente
          </div>
        )}

        {!success && (
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
              Cancelar
            </Button>
            <Button onClick={handleDelete} disabled={loading} variant="destructive">
              {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Eliminando...</> : 'Eliminar Proyecto'}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
