'use client'

import { useState } from 'react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { FolderKanban, GitPullRequest, GripVertical, RotateCcw } from 'lucide-react'

interface Project {
  id: string
  name: string
  type?: string
  company?: { id: string; name: string } | null
}

interface ProjectOrderDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  projects: Project[]
  onSave: (orderedIds: string[]) => void
  onReset: () => void
}

function SortableItem({ project }: { project: Project }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: project.id,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
        isDragging
          ? 'bg-primary/5 border-primary/30 shadow-md z-10'
          : 'bg-card border-border hover:bg-muted/40'
      }`}
    >
      {/* Drag handle */}
      <button
        className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground touch-none p-0.5"
        {...attributes}
        {...listeners}
        aria-label="Arrastrar para reordenar"
      >
        <GripVertical className="w-4 h-4" />
      </button>

      {/* Ícono tipo */}
      <div className="w-7 h-7 rounded-md bg-muted flex items-center justify-center flex-shrink-0">
        {project.type === 'change_control' ? (
          <GitPullRequest className="w-3.5 h-3.5 text-muted-foreground" />
        ) : (
          <FolderKanban className="w-3.5 h-3.5 text-muted-foreground" />
        )}
      </div>

      {/* Nombre + cliente */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate">{project.name}</p>
        {project.company?.name && (
          <p className="text-xs text-muted-foreground truncate">{project.company.name}</p>
        )}
      </div>
    </div>
  )
}

export function ProjectOrderDialog({
  open,
  onOpenChange,
  projects,
  onSave,
  onReset,
}: ProjectOrderDialogProps) {
  const [localOrder, setLocalOrder] = useState<Project[]>(projects)

  // Sincronizar cuando cambian los proyectos externos (nuevos proyectos añadidos, etc.)
  const mergedProjects = [
    ...localOrder.filter(p => projects.some(ext => ext.id === p.id)),
    ...projects.filter(p => !localOrder.some(lo => lo.id === p.id)),
  ].map(p => projects.find(ext => ext.id === p.id) ?? p)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (over && active.id !== over.id) {
      setLocalOrder(prev => {
        const oldIdx = prev.findIndex(p => p.id === active.id)
        const newIdx = prev.findIndex(p => p.id === over.id)
        return arrayMove(prev, oldIdx, newIdx)
      })
    }
  }

  function handleSave() {
    onSave(mergedProjects.map(p => p.id))
    onOpenChange(false)
  }

  function handleReset() {
    onReset()
    onOpenChange(false)
  }

  // Actualizar localOrder cuando se abre el diálogo
  function handleOpenChange(val: boolean) {
    if (val) setLocalOrder(projects)
    onOpenChange(val)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Personalizar orden de proyectos</DialogTitle>
          <p className="text-sm text-muted-foreground">
            Arrastra los proyectos para definir el orden en que aparecen en las pestañas.
          </p>
        </DialogHeader>

        <div className="max-h-[400px] overflow-y-auto">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={mergedProjects.map(p => p.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="flex flex-col gap-2 p-1">
                {mergedProjects.map(project => (
                  <SortableItem key={project.id} project={project} />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </div>

        <DialogFooter className="flex-row justify-between gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground gap-2"
            onClick={handleReset}
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Restablecer automático
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button size="sm" onClick={handleSave}>
              Guardar orden
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
