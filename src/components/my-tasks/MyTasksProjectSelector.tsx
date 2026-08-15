'use client'

import { useState, useMemo, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { GlassPanel } from '@/components/ui/glass-panel'
import { FolderKanban, GitPullRequest, LayoutGrid, ChevronDown, Check, Search, Building2 } from 'lucide-react'

const MAX_VISIBLE_TABS = 4

interface Project {
  id: string
  name: string
  type?: string
  company?: { id: string; name: string } | null
}

interface MyTasksProjectSelectorProps {
  projects: Project[]
  selectedProjectId: string | null
  onSelect: (projectId: string | null) => void
  taskCountByProject: Record<string, number>
}

function ProjectIcon({ type, className }: { type?: string; className?: string }) {
  return type === 'change_control'
    ? <GitPullRequest className={className} />
    : <FolderKanban className={className} />
}

function PendingBadge({ count, isSelected }: { count: number; isSelected: boolean }) {
  if (count === 0) return null
  return (
    <span
      className={`text-[11px] font-semibold rounded-full px-1.5 min-w-[20px] h-5 inline-flex items-center justify-center flex-shrink-0 ${
        isSelected
          ? 'bg-white/20 text-white'
          : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
      }`}
    >
      {count}
    </span>
  )
}

const pillClass = (selected: boolean) =>
  `inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[13px] font-medium whitespace-nowrap transition-colors ${
    selected
      ? 'bg-primary text-primary-foreground shadow-[0_6px_16px_rgba(37,99,235,0.28)]'
      : 'text-muted-foreground hover:bg-black/5 dark:hover:bg-white/8 hover:text-foreground'
  }`

export function MyTasksProjectSelector({
  projects,
  selectedProjectId,
  onSelect,
  taskCountByProject,
}: MyTasksProjectSelectorProps) {
  const [popoverOpen, setPopoverOpen] = useState(false)
  const [search, setSearch] = useState('')
  const searchRef = useRef<HTMLInputElement>(null)

  const totalPending = Object.values(taskCountByProject).reduce((a, b) => a + b, 0)

  useEffect(() => {
    if (popoverOpen) {
      setTimeout(() => searchRef.current?.focus(), 50)
    } else {
      setSearch('')
    }
  }, [popoverOpen])

  const { visibleProjects, overflowProjects } = useMemo(() => {
    if (projects.length <= MAX_VISIBLE_TABS) {
      return { visibleProjects: projects, overflowProjects: [] }
    }
    const selectedIdx = projects.findIndex(p => p.id === selectedProjectId)
    if (selectedIdx < MAX_VISIBLE_TABS || selectedIdx === -1) {
      return {
        visibleProjects: projects.slice(0, MAX_VISIBLE_TABS),
        overflowProjects: projects.slice(MAX_VISIBLE_TABS),
      }
    }
    const selected = projects[selectedIdx]
    const rest = projects.filter((_, i) => i !== selectedIdx)
    return {
      visibleProjects: [selected, ...rest.slice(0, MAX_VISIBLE_TABS - 1)],
      overflowProjects: rest.slice(MAX_VISIBLE_TABS - 1),
    }
  }, [projects, selectedProjectId])

  const filteredOverflow = useMemo(() => {
    if (!search.trim()) return overflowProjects
    const q = search.toLowerCase()
    return overflowProjects.filter(p =>
      p.name.toLowerCase().includes(q) ||
      p.company?.name.toLowerCase().includes(q)
    )
  }, [overflowProjects, search])

  const filteredVisible = useMemo(() => {
    if (!search.trim()) return []
    const q = search.toLowerCase()
    return visibleProjects.filter(p =>
      p.name.toLowerCase().includes(q) ||
      p.company?.name.toLowerCase().includes(q)
    )
  }, [visibleProjects, search])

  const overflowSelected = overflowProjects.some(p => p.id === selectedProjectId)
  const overflowPendingTotal = overflowProjects.reduce(
    (sum, p) => sum + (taskCountByProject[p.id] ?? 0), 0
  )
  const selectedOverflowProject = overflowProjects.find(p => p.id === selectedProjectId)

  const allSearchResults = [...filteredVisible, ...filteredOverflow]

  return (
    <GlassPanel padding={1} sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
      <button
        type="button"
        onClick={() => onSelect(null)}
        className={pillClass(selectedProjectId === null)}
      >
        <LayoutGrid className="w-3.5 h-3.5" />
        Todas
        {totalPending > 0 && (
          <PendingBadge count={totalPending} isSelected={selectedProjectId === null} />
        )}
      </button>

      {visibleProjects.map((project) => {
        const isSelected = selectedProjectId === project.id
        const pendingCount = taskCountByProject[project.id] ?? 0

        return (
          <button
            type="button"
            key={project.id}
            onClick={() => onSelect(project.id)}
            title={project.company?.name ? `${project.name} · ${project.company.name}` : project.name}
            className={pillClass(isSelected)}
          >
            <ProjectIcon type={project.type} className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="max-w-[140px] truncate">{project.name}</span>
            <PendingBadge count={pendingCount} isSelected={isSelected} />
          </button>
        )
      })}

      {overflowProjects.length > 0 && (
        <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className={`h-auto py-1.5 rounded-full gap-1.5 px-3.5 text-[13px] font-medium ${
                overflowSelected
                  ? 'bg-primary text-primary-foreground shadow-[0_6px_16px_rgba(37,99,235,0.28)] hover:bg-primary/90 hover:text-primary-foreground'
                  : 'text-muted-foreground'
              }`}
            >
              {overflowSelected && selectedOverflowProject ? (
                <>
                  <ProjectIcon type={selectedOverflowProject.type} className="w-3.5 h-3.5" />
                  <span className="max-w-[120px] truncate">{selectedOverflowProject.name}</span>
                  <ChevronDown className="w-3.5 h-3.5 opacity-60" />
                </>
              ) : (
                <>
                  <span>+{overflowProjects.length}</span>
                  {overflowPendingTotal > 0 && (
                    <span className="text-[11px] font-semibold rounded-full px-1.5 bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                      {overflowPendingTotal}
                    </span>
                  )}
                  <ChevronDown className="w-3.5 h-3.5 opacity-60" />
                </>
              )}
            </Button>
          </PopoverTrigger>

          <PopoverContent align="start" className="w-72 p-0" sideOffset={8}>
            <div className="p-2 border-b border-border">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground z-10" />
                <Input
                  ref={searchRef}
                  placeholder="Buscar proyecto o cliente..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 h-8 text-sm"
                />
              </div>
            </div>

            <div className="max-h-64 overflow-y-auto py-1">
              {search.trim() && allSearchResults.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">Sin resultados</p>
              ) : (search.trim() ? allSearchResults : filteredOverflow).map((project) => {
                const isSelected = selectedProjectId === project.id
                const pendingCount = taskCountByProject[project.id] ?? 0
                return (
                  <ProjectItem
                    key={project.id}
                    project={project}
                    isSelected={isSelected}
                    pendingCount={pendingCount}
                    onSelect={() => { onSelect(project.id); setPopoverOpen(false) }}
                  />
                )
              })}
            </div>

            {!search.trim() && (
              <div className="border-t border-border px-3 py-2">
                <p className="text-[12px] text-muted-foreground">
                  {overflowProjects.length} proyecto{overflowProjects.length !== 1 ? 's' : ''} más
                </p>
              </div>
            )}
          </PopoverContent>
        </Popover>
      )}
    </GlassPanel>
  )
}

function ProjectItem({
  project,
  isSelected,
  pendingCount,
  onSelect,
}: {
  project: Project
  isSelected: boolean
  pendingCount: number
  onSelect: () => void
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className="w-full flex items-center gap-3 px-3 py-2 rounded-2xl hover:bg-black/[0.04] dark:hover:bg-white/[0.06] transition-colors text-left"
    >
      <div className={`w-8 h-8 rounded-2xl flex items-center justify-center flex-shrink-0 ${
        isSelected ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
      }`}>
        <ProjectIcon type={project.type} className="w-4 h-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-[14px] font-medium truncate ${isSelected ? 'text-primary' : 'text-foreground'}`}>
          {project.name}
        </p>
        {project.company?.name && (
          <div className="flex items-center gap-1 mt-0.5">
            <Building2 className="w-3 h-3 text-muted-foreground flex-shrink-0" />
            <p className="text-[12px] text-muted-foreground truncate">{project.company.name}</p>
          </div>
        )}
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        {pendingCount > 0 && (
          <span className="text-[11px] font-semibold rounded-full px-1.5 py-0.5 bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
            {pendingCount}
          </span>
        )}
        {isSelected && <Check className="w-3.5 h-3.5 text-primary" />}
      </div>
    </button>
  )
}
