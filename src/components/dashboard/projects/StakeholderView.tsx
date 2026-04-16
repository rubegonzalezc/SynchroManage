'use client'

import { useState, useEffect } from 'react'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import {
  CheckCircle2, Clock, Circle, Eye, Inbox, RefreshCw,
  ChevronDown, ChevronRight, Milestone, Paperclip,
  FileText, File, FileSpreadsheet, Image as ImageIcon,
  Download, AlertCircle,
} from 'lucide-react'
import type { Sprint } from './CreateSprintDialog'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Task {
  id: string
  task_number: number | null
  title: string
  status: string
  priority: string
  sprint_id: string | null
  is_carry_over: boolean
  assignees: { id: string; full_name: string; avatar_url: string | null }[]
}

interface Attachment {
  id: string
  file_name: string
  file_size: number
  file_type: string
  file_url: string
  created_at: string
  uploaded_by: { id: string; full_name: string; avatar_url: string | null } | null
}

interface StakeholderViewProps {
  projectId: string
  sprints: Sprint[]
  tasks: Task[]
  progressPercentage: number
  totalTasks: number
  completedTasks: number
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const sprintStatusConfig: Record<string, { label: string; color: string }> = {
  planning: { label: 'Planificación', color: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400' },
  active:   { label: 'Activo',        color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  completed:{ label: 'Completado',    color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
}

const taskStatusConfig: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  done:        { label: 'Hecha',       icon: <CheckCircle2 className="w-3.5 h-3.5" />, color: 'text-green-600 dark:text-green-400' },
  in_progress: { label: 'En Progreso', icon: <Clock className="w-3.5 h-3.5" />,        color: 'text-blue-600 dark:text-blue-400' },
  review:      { label: 'Revisión',    icon: <Eye className="w-3.5 h-3.5" />,          color: 'text-violet-600 dark:text-violet-400' },
  todo:        { label: 'Por Hacer',   icon: <Circle className="w-3.5 h-3.5" />,       color: 'text-slate-500 dark:text-slate-400' },
  backlog:     { label: 'Backlog',     icon: <Inbox className="w-3.5 h-3.5" />,        color: 'text-zinc-500 dark:text-zinc-400' },
  carry_over:  { label: 'Carry Over',  icon: <RefreshCw className="w-3.5 h-3.5" />,    color: 'text-amber-600 dark:text-amber-400' },
}

function formatDate(date: string | null) {
  if (!date) return '—'
  return new Date(date).toLocaleDateString('es-CL', { day: '2-digit', month: 'short', year: 'numeric' })
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function getInitials(name: string) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

function getFileIcon(fileType: string) {
  if (fileType.startsWith('image/')) return <ImageIcon className="w-4 h-4 text-blue-500" />
  if (fileType === 'application/pdf') return <FileText className="w-4 h-4 text-red-500" />
  if (fileType.includes('spreadsheet') || fileType.includes('excel')) return <FileSpreadsheet className="w-4 h-4 text-green-600" />
  return <File className="w-4 h-4 text-slate-500" />
}

// ─── Sprint Timeline Item ─────────────────────────────────────────────────────

function SprintTimelineItem({ sprint, tasks, isLast }: { sprint: Sprint; tasks: Task[]; isLast: boolean }) {
  const [expanded, setExpanded] = useState(sprint.status === 'active')

  const sprintTasks = tasks.filter(t => t.sprint_id === sprint.id)
  const done = sprintTasks.filter(t => t.status === 'done').length
  const total = sprintTasks.length
  const pct = total > 0 ? Math.round((done / total) * 100) : 0
  const cfg = sprintStatusConfig[sprint.status] ?? sprintStatusConfig.planning

  return (
    <div className="flex gap-4">
      {/* Timeline spine */}
      <div className="flex flex-col items-center">
        <div className={`w-3 h-3 rounded-full mt-1 flex-shrink-0 border-2 ${
          sprint.status === 'completed' ? 'bg-green-500 border-green-500' :
          sprint.status === 'active'    ? 'bg-blue-500 border-blue-500' :
                                          'bg-muted border-border'
        }`} />
        {!isLast && <div className="w-px flex-1 bg-border mt-1" />}
      </div>

      {/* Content */}
      <div className="flex-1 pb-6">
        <button
          onClick={() => setExpanded(v => !v)}
          className="w-full text-left group"
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-medium text-foreground text-sm">{sprint.name}</span>
              <Badge variant="secondary" className={`text-xs ${cfg.color}`}>{cfg.label}</Badge>
              {sprint.goal && (
                <span className="text-xs text-muted-foreground italic hidden sm:inline">— {sprint.goal}</span>
              )}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-xs text-muted-foreground">
                {formatDate(sprint.start_date)} → {formatDate(sprint.end_date)}
              </span>
              {expanded
                ? <ChevronDown className="w-4 h-4 text-muted-foreground" />
                : <ChevronRight className="w-4 h-4 text-muted-foreground" />
              }
            </div>
          </div>

          {/* Mini progress bar */}
          {total > 0 && (
            <div className="mt-2 flex items-center gap-2">
              <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${sprint.status === 'completed' ? 'bg-green-500' : 'bg-blue-500'}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className="text-xs text-muted-foreground shrink-0">{done}/{total} tareas</span>
            </div>
          )}
        </button>

        {/* Expanded task list */}
        {expanded && sprintTasks.length > 0 && (
          <div className="mt-3 space-y-1.5 pl-1">
            {sprintTasks.map(task => {
              const statusKey = task.is_carry_over && task.status !== 'done' ? 'carry_over' : task.status
              const sc = taskStatusConfig[statusKey] ?? taskStatusConfig.todo
              return (
                <div key={task.id} className="flex items-center gap-2 py-1 px-2 rounded-md hover:bg-muted/50 transition-colors">
                  <span className={sc.color}>{sc.icon}</span>
                  <span className="text-xs text-muted-foreground shrink-0">
                    {task.task_number ? `#${task.task_number}` : '—'}
                  </span>
                  <span className="text-sm text-foreground flex-1 truncate">{task.title}</span>
                  {task.assignees.length > 0 && (
                    <div className="flex -space-x-1 shrink-0">
                      {task.assignees.slice(0, 2).map(a => (
                        <Avatar key={a.id} className="w-5 h-5 border border-background">
                          <AvatarImage src={a.avatar_url || undefined} />
                          <AvatarFallback className="text-[8px]">{getInitials(a.full_name)}</AvatarFallback>
                        </Avatar>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {expanded && sprintTasks.length === 0 && (
          <p className="mt-2 text-xs text-muted-foreground pl-1">Sin tareas asignadas a este sprint.</p>
        )}
      </div>
    </div>
  )
}

// ─── Attachments (read-only) ──────────────────────────────────────────────────

function StakeholderAttachments({ projectId }: { projectId: string }) {
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    fetch(`/api/dashboard/attachments?project_id=${projectId}`)
      .then(r => r.json())
      .then(data => setAttachments(data.attachments || []))
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }, [projectId])

  if (loading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map(i => (
          <div key={i} className="flex items-center gap-3 p-3 rounded-lg border border-border">
            <Skeleton className="w-10 h-10 rounded-lg" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
        <AlertCircle className="w-4 h-4" /> No se pudieron cargar los documentos.
      </div>
    )
  }

  if (attachments.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-6">
        No hay documentos adjuntos en este proyecto.
      </p>
    )
  }

  const images = attachments.filter(a => a.file_type.startsWith('image/'))
  const docs = attachments.filter(a => !a.file_type.startsWith('image/'))

  return (
    <div className="space-y-3">
      {/* Image grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
          {images.map(a => (
            <a
              key={a.id}
              href={a.file_url}
              target="_blank"
              rel="noopener noreferrer"
              className="group relative aspect-square rounded-lg overflow-hidden border border-border bg-muted"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={a.file_url} alt={a.file_name} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-end">
                <div className="w-full bg-black/60 px-2 py-1 translate-y-full group-hover:translate-y-0 transition-transform">
                  <p className="text-xs text-white truncate">{a.file_name}</p>
                </div>
              </div>
            </a>
          ))}
        </div>
      )}

      {/* Document list */}
      {docs.map(a => (
        <div key={a.id} className="flex items-center gap-3 p-3 rounded-lg border border-border bg-card hover:bg-muted/50 transition-colors">
          <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
            {getFileIcon(a.file_type)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">{a.file_name}</p>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>{formatFileSize(a.file_size)}</span>
              {a.uploaded_by && (
                <>
                  <span>·</span>
                  <div className="flex items-center gap-1">
                    <Avatar className="w-4 h-4">
                      <AvatarImage src={a.uploaded_by.avatar_url || undefined} />
                      <AvatarFallback className="text-[8px]">{getInitials(a.uploaded_by.full_name)}</AvatarFallback>
                    </Avatar>
                    <span>{a.uploaded_by.full_name}</span>
                  </div>
                </>
              )}
              <span>· {formatDate(a.created_at)}</span>
            </div>
          </div>
          <a
            href={a.file_url}
            download={a.file_name}
            target="_blank"
            rel="noopener noreferrer"
            className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            title="Descargar"
          >
            <Download className="w-4 h-4" />
          </a>
        </div>
      ))}
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function StakeholderView({ projectId, sprints, tasks, progressPercentage, totalTasks, completedTasks }: StakeholderViewProps) {
  const sortedSprints = [...sprints].sort((a, b) => a.order_index - b.order_index)
  const hasNoTasks = totalTasks === 0

  return (
    <div className="space-y-6">
      {/* Progress card */}
      <div className="bg-card rounded-lg border border-border p-6">
        <h3 className="font-semibold text-foreground mb-4">Progreso del Proyecto</h3>
        {hasNoTasks ? (
          <div className="text-center py-4">
            <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mx-auto mb-3">
              <Clock className="w-6 h-6 text-amber-600 dark:text-amber-400" />
            </div>
            <p className="text-muted-foreground">El proyecto está en fase de planificación.</p>
            <p className="text-sm text-muted-foreground mt-1">Las tareas aún no han sido definidas por el equipo.</p>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Completado</span>
              <span className="font-medium text-foreground">{progressPercentage}%</span>
            </div>
            <div className="w-full bg-muted rounded-full h-3">
              <div
                className="bg-green-500 dark:bg-green-600 h-3 rounded-full transition-all duration-500"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              {completedTasks} tareas completadas de {totalTasks} totales
            </p>
          </div>
        )}
      </div>

      {/* Sprint timeline */}
      <div className="bg-card rounded-lg border border-border p-6">
        <h3 className="font-semibold text-foreground flex items-center gap-2 mb-5">
          <Milestone className="w-4 h-4 text-primary" />
          Hitos del Proyecto
        </h3>

        {sortedSprints.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">
            No hay sprints definidos aún.
          </p>
        ) : (
          <div>
            {sortedSprints.map((sprint, idx) => (
              <SprintTimelineItem
                key={sprint.id}
                sprint={sprint}
                tasks={tasks}
                isLast={idx === sortedSprints.length - 1}
              />
            ))}
          </div>
        )}
      </div>

      {/* Documents */}
      <div className="bg-card rounded-lg border border-border p-6">
        <h3 className="font-semibold text-foreground flex items-center gap-2 mb-4">
          <Paperclip className="w-4 h-4 text-primary" />
          Documentos del Proyecto
        </h3>
        <StakeholderAttachments projectId={projectId} />
      </div>
    </div>
  )
}
