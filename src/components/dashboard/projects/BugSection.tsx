'use client'

import { useState, useEffect } from 'react'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Bug, ChevronDown, ChevronRight, AlertCircle } from 'lucide-react'
import { CreateBugDialog } from './CreateBugDialog'
import { BugDetailDialog } from './BugDetailDialog'

interface Member {
  id: string
  full_name: string
  avatar_url: string | null
  roles?: string[]
}

interface SprintOption {
  id: string
  name: string
  status: string
}

interface TaskOption {
  id: string
  task_number: number | null
  title: string
  sprint_id?: string | null
}

interface BugItem {
  id: string
  title: string
  description: string | null
  steps_to_reproduce: string | null
  severity: string
  status: string
  created_at: string
  sprint: { id: string; name: string; status: string } | null
  task: { id: string; task_number: number | null; title: string } | null
  assignee: { id: string; full_name: string; avatar_url: string | null } | null
  reporter: { id: string; full_name: string; avatar_url: string | null } | null
}

interface BugSectionProps {
  projectId: string
  members: Member[]
  allUsers: Member[]
  currentUserId: string
  currentUserRole: string
  sprints: SprintOption[]
  tasks: TaskOption[]
}

const severityConfig: Record<string, { label: string; color: string; dot: string }> = {
  low: { label: 'Baja', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400', dot: 'bg-green-500' },
  medium: { label: 'Media', color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400', dot: 'bg-yellow-500' },
  high: { label: 'Alta', color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400', dot: 'bg-orange-500' },
  critical: { label: 'Crítica', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400', dot: 'bg-red-500' },
}

const statusConfig: Record<string, { label: string; color: string }> = {
  open: { label: 'Abierto', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
  in_progress: { label: 'En Progreso', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  resolved: { label: 'Resuelto', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
  closed: { label: 'Cerrado', color: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400' },
}

function getInitials(name: string | null) {
  if (!name) return '??'
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

export function BugSection({ projectId, members, allUsers, currentUserId, currentUserRole, sprints, tasks }: BugSectionProps) {
  const [bugs, setBugs] = useState<BugItem[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedBugId, setSelectedBugId] = useState<string | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [sprintFilter, setSprintFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [collapsedSprints, setCollapsedSprints] = useState<Set<string>>(new Set())

  const canManage = ['admin', 'pm', 'tech_lead'].includes(currentUserRole)

  const fetchBugs = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/dashboard/bugs?project_id=${projectId}`)
      const data = await res.json()
      if (res.ok) setBugs(data.bugs || [])
    } catch (err) {
      console.error('Error fetching bugs:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchBugs()
  }, [projectId])

  const filteredBugs = bugs.filter(b => {
    const matchesSprint = sprintFilter === 'all'
      ? true
      : sprintFilter === 'none'
        ? b.sprint === null
        : b.sprint?.id === sprintFilter
    const matchesStatus = statusFilter === 'all' || b.status === statusFilter
    return matchesSprint && matchesStatus
  })

  // Agrupar por sprint
  const grouped = filteredBugs.reduce<Record<string, BugItem[]>>((acc, bug) => {
    const key = bug.sprint?.id ?? 'none'
    if (!acc[key]) acc[key] = []
    acc[key].push(bug)
    return acc
  }, {})

  const toggleSprint = (key: string) => {
    setCollapsedSprints(prev => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  const openBug = (id: string) => {
    setSelectedBugId(id)
    setDetailOpen(true)
  }

  const openBugs = bugs.filter(b => b.status === 'open' || b.status === 'in_progress').length

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Bug className="w-5 h-5 text-red-500" />
            <h3 className="font-semibold text-foreground text-lg">Bugs</h3>
          </div>
          {openBugs > 0 && (
            <Badge variant="secondary" className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
              {openBugs} abierto{openBugs !== 1 ? 's' : ''}
            </Badge>
          )}
        </div>
        {canManage && (
          <CreateBugDialog
            projectId={projectId}
            members={members}
            sprints={sprints}
            tasks={tasks}
            onBugCreated={(newBug) => setBugs(prev => [newBug, ...prev])}
          />
        )}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <Select value={sprintFilter} onValueChange={setSprintFilter}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Todos los sprints" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los sprints</SelectItem>
            <SelectItem value="none">Sin sprint</SelectItem>
            {sprints.map(s => (
              <SelectItem key={s.id} value={s.id}>
                {s.name}{s.status === 'active' ? ' (Activo)' : ''}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Todos los estados" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los estados</SelectItem>
            {Object.entries(statusConfig).map(([val, cfg]) => (
              <SelectItem key={val} value={val}>{cfg.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filteredBugs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-3">
            <AlertCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
          </div>
          <p className="text-muted-foreground">No hay bugs reportados</p>
          {canManage && <p className="text-sm text-muted-foreground mt-1">Usa "Reportar Bug" para registrar uno</p>}
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(grouped).map(([sprintKey, sprintBugs]) => {
            const sprintInfo = sprintKey === 'none' ? null : sprints.find(s => s.id === sprintKey)
            const isCollapsed = collapsedSprints.has(sprintKey)
            const label = sprintInfo ? sprintInfo.name : 'Sin sprint'

            return (
              <div key={sprintKey} className="border border-border rounded-lg overflow-hidden">
                {/* Sprint group header */}
                <button
                  onClick={() => toggleSprint(sprintKey)}
                  className="w-full flex items-center justify-between px-4 py-3 bg-muted/50 hover:bg-muted transition-colors text-left"
                >
                  <div className="flex items-center gap-2">
                    {isCollapsed ? <ChevronRight className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                    <span className="font-medium text-sm text-foreground">{label}</span>
                    {sprintInfo?.status === 'active' && (
                      <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">Activo</Badge>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground">{sprintBugs.length} bug{sprintBugs.length !== 1 ? 's' : ''}</span>
                </button>

                {/* Bug list */}
                {!isCollapsed && (
                  <div className="divide-y divide-border">
                    {sprintBugs.map(bug => {
                      const sev = severityConfig[bug.severity] ?? severityConfig.medium
                      const sta = statusConfig[bug.status] ?? statusConfig.open
                      return (
                        <button
                          key={bug.id}
                          onClick={() => openBug(bug.id)}
                          className="w-full flex items-center gap-4 px-4 py-3 hover:bg-muted/30 transition-colors text-left"
                        >
                          <div className={`w-2 h-2 rounded-full flex-shrink-0 ${sev.dot}`} />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">{bug.title}</p>
                            {bug.task && (
                              <p className="text-xs text-muted-foreground mt-0.5">
                                Tarea: {bug.task.task_number ? `#${bug.task.task_number} ` : ''}{bug.task.title}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <Badge variant="secondary" className={`text-xs ${sev.color}`}>{sev.label}</Badge>
                            <Badge variant="secondary" className={`text-xs ${sta.color}`}>{sta.label}</Badge>
                            {bug.assignee ? (
                              <Avatar className="w-6 h-6">
                                <AvatarImage src={bug.assignee.avatar_url || undefined} />
                                <AvatarFallback className="text-[10px] bg-muted">{getInitials(bug.assignee.full_name)}</AvatarFallback>
                              </Avatar>
                            ) : (
                              <div className="w-6 h-6 rounded-full border-2 border-dashed border-muted-foreground/30 flex items-center justify-center">
                                <span className="text-[8px] text-muted-foreground">?</span>
                              </div>
                            )}
                          </div>
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Detail Dialog */}
      {selectedBugId && (
        <BugDetailDialog
          bugId={selectedBugId}
          projectId={projectId}
          projectName=""
          open={detailOpen}
          onOpenChange={setDetailOpen}
          members={members}
          allUsers={allUsers}
          currentUserId={currentUserId}
          sprints={sprints}
          tasks={tasks}
          onUpdate={fetchBugs}
        />
      )}
    </div>
  )
}
