'use client'

import { useMemo, useState } from 'react'
import { TaskDetailDialog } from './TaskDetailDialog'
import type { ProjectTask } from '@/lib/types/task'

interface Member {
  id: string
  full_name: string
  avatar_url: string | null
}

interface MobileTaskStackProps {
  tasks: ProjectTask[]
  projectId: string
  projectName: string
  members: Member[]
  allUsers: Member[]
  currentUserId: string
  onTasksChange: () => void
  highlightId?: string | null
}

const statuses = [
  { id: 'todo', label: 'Por hacer' },
  { id: 'in_progress', label: 'En curso' },
  { id: 'review', label: 'Revisión' },
  { id: 'backlog', label: 'Backlog' },
  { id: 'done', label: 'Listas' },
]

const priorityBar: Record<string, string> = {
  low: 'bg-slate-400',
  medium: 'bg-blue-500',
  high: 'bg-orange-500',
  urgent: 'bg-red-500',
}

export function MobileTaskStack({
  tasks,
  projectId,
  projectName,
  members,
  allUsers,
  currentUserId,
  onTasksChange,
  highlightId,
}: MobileTaskStackProps) {
  const counts = useMemo(() => {
    const map: Record<string, number> = {}
    for (const status of statuses) map[status.id] = 0
    for (const task of tasks) map[task.status] = (map[task.status] ?? 0) + 1
    return map
  }, [tasks])

  const [status, setStatus] = useState(() => statuses.find((item) => counts[item.id] > 0)?.id ?? 'todo')
  const [openTaskId, setOpenTaskId] = useState<string | null>(highlightId ?? null)

  const visible = useMemo(
    () => tasks
      .filter((task) => task.status === status)
      .sort((a, b) => (a.sprint_order ?? 999) - (b.sprint_order ?? 999) || a.position - b.position),
    [tasks, status]
  )

  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-2 overflow-x-auto pb-1">
        {statuses.map((item) => {
          const selected = item.id === status
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setStatus(item.id)}
              className={`shrink-0 rounded-full px-3 py-1.5 text-[13px] font-medium ${
                selected ? 'bg-primary text-primary-foreground' : 'bg-card text-muted-foreground border border-border'
              }`}
            >
              {item.label}
              <span className="ml-1.5 tabular-nums opacity-80">{counts[item.id] ?? 0}</span>
            </button>
          )
        })}
      </div>

      {visible.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border px-4 py-10 text-center text-sm text-muted-foreground">
          No hay tareas en esta columna
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {visible.map((task) => (
            <button
              key={task.id}
              type="button"
              onClick={() => setOpenTaskId(task.id)}
              className="mobile-task-card w-full text-left rounded-2xl border border-border bg-card px-3 py-3 flex gap-3"
            >
              <span className={`mt-1 w-1 self-stretch rounded-full ${priorityBar[task.priority] || 'bg-slate-400'}`} />
              <span className="min-w-0 flex-1">
                <span className="block text-[15px] font-semibold leading-snug text-foreground">{task.title}</span>
                <span className="mt-1 block text-[12px] text-muted-foreground">
                  {task.sprint_order != null ? `HU-${task.sprint_order}` : `#${task.task_number ?? '—'}`}
                  {task.assignees[0] ? ` · ${task.assignees[0].full_name}` : ''}
                </span>
              </span>
            </button>
          ))}
        </div>
      )}

      {openTaskId && (
        <TaskDetailDialog
          taskId={openTaskId}
          projectId={projectId}
          projectName={projectName}
          open
          onOpenChange={(open) => {
            if (!open) setOpenTaskId(null)
          }}
          members={members}
          allUsers={allUsers}
          currentUserId={currentUserId}
          onUpdate={onTasksChange}
        />
      )}
    </div>
  )
}
