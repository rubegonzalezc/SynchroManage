'use client'

import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { AlertTriangle, ArrowRightLeft, Trash2, X, GitPullRequest } from 'lucide-react'

// Step 1: ¿Crear CC?
interface CreateCCPromptDialogProps {
  open: boolean
  projectName: string
  onCreateCC: () => void
  onSkip: () => void
}

export function CreateCCPromptDialog({ open, projectName, onCreateCC, onSkip }: CreateCCPromptDialogProps) {
  return (
    <AlertDialog open={open}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <GitPullRequest className="w-5 h-5 text-orange-500" />
            Proyecto completado
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="text-sm text-muted-foreground space-y-1">
              <p>El proyecto <span className="font-semibold text-foreground">"{projectName}"</span> fue marcado como completado.</p>
              <p>¿Deseas crear un Control de Cambios para gestionar futuros cambios sobre este proyecto?</p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-col sm:flex-col gap-2 sm:gap-2">
          <Button onClick={onCreateCC} className="w-full bg-orange-600 hover:bg-orange-700 text-white">
            <GitPullRequest className="w-4 h-4 mr-2" />
            Crear Control de Cambios
          </Button>
          <Button onClick={onSkip} variant="outline" className="w-full">
            No por ahora
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

// Step 2a: Tareas pendientes cuando SÍ se crea CC (incluye opción de mudar)
interface PendingTasksWithCCDialogProps {
  open: boolean
  pendingCount: number
  onMigrate: () => void
  onKeep: () => void
  onDelete: () => void
}

export function PendingTasksWithCCDialog({ open, pendingCount, onMigrate, onKeep, onDelete }: PendingTasksWithCCDialogProps) {
  return (
    <AlertDialog open={open}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            Tareas pendientes detectadas
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="text-sm text-muted-foreground space-y-1">
              <p>
                Este proyecto tiene <span className="font-semibold text-foreground">{pendingCount} tarea{pendingCount !== 1 ? 's' : ''} pendiente{pendingCount !== 1 ? 's' : ''}</span> sin completar.
              </p>
              <p>¿Qué deseas hacer con ellas?</p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-col sm:flex-col gap-2 sm:gap-2">
          <Button onClick={onMigrate} className="w-full bg-orange-600 hover:bg-orange-700 text-white">
            <ArrowRightLeft className="w-4 h-4 mr-2" />
            Mudar al Control de Cambios
          </Button>
          <Button onClick={onKeep} variant="outline" className="w-full">
            Mantener tareas pendientes
          </Button>
          <Button onClick={onDelete} variant="outline" className="w-full border-red-300 text-red-600 hover:bg-red-50 dark:border-red-700 dark:text-red-400 dark:hover:bg-red-900/20">
            <Trash2 className="w-4 h-4 mr-2" />
            Eliminar tareas pendientes
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

// Step 2b: Tareas pendientes cuando NO se crea CC (sin opción de mudar)
interface PendingTasksNoCCDialogProps {
  open: boolean
  pendingCount: number
  onKeep: () => void
  onDelete: () => void
}

export function PendingTasksNoCCDialog({ open, pendingCount, onKeep, onDelete }: PendingTasksNoCCDialogProps) {
  return (
    <AlertDialog open={open}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            Tareas pendientes detectadas
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="text-sm text-muted-foreground space-y-1">
              <p>
                Este proyecto tiene <span className="font-semibold text-foreground">{pendingCount} tarea{pendingCount !== 1 ? 's' : ''} pendiente{pendingCount !== 1 ? 's' : ''}</span> sin completar.
              </p>
              <p>¿Qué deseas hacer con ellas?</p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-col sm:flex-col gap-2 sm:gap-2">
          <Button onClick={onKeep} variant="outline" className="w-full">
            Mantener tareas pendientes
          </Button>
          <Button onClick={onDelete} variant="outline" className="w-full border-red-300 text-red-600 hover:bg-red-50 dark:border-red-700 dark:text-red-400 dark:hover:bg-red-900/20">
            <Trash2 className="w-4 h-4 mr-2" />
            Eliminar tareas pendientes
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
