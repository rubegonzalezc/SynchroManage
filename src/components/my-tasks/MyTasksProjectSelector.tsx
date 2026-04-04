'use client'

import { useState, useMemo, useRef, useEffect } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
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
    <Badge
      variant="secondary"
      className={`text-xs px-1.5 py-0 h-5 min-w-[20px] flex items-center justify-center border-0 flex-shrink-0 ${
        isSelected
          ? 'bg-primary-foreground/20 text-primary-foreground'
          : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
      }`}
    >
      {count}
    </Badge>
  )
}

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

  // Cuando abre el popover, enfocar el buscador
  useEffect(() => {
    if (popoverOpen) {
      setTimeout(() => searchRef.current?.focus(), 50)
    } else {
      setSearch('')
    }
  }, [popoverOpen])

  // Tabs visibles vs overflow
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
    // El seleccionado está en overflow → moverlo al frente de los visibles
    const selected = projects[selectedIdx]
    const rest = projects.filter((_, i) => i !== selectedIdx)
    return {
      visibleProjects: [selected, ...rest.slice(0, MAX_VISIBLE_TABS - 1)],
      overflowProjects: rest.slice(MAX_VISIBLE_TABS - 1),
    }
  }, [projects, selectedProjectId])

  // Filtrar overflow según búsqueda (por nombre o cliente)
  const filteredOverflow = useMemo(() => {
    if (!search.trim()) return overflowProjects
    const q = search.toLowerCase()
    return overflowProjects.filter(p =>
      p.name.toLowerCase().includes(q) ||
      p.company?.name.toLowerCase().includes(q)
    )
  }, [overflowProjects, search])

  // También filtrar visibles si hay búsqueda (para mostrar resultados de tabs también en el popover)
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
    <div className="flex items-center gap-2 flex-wrap">
      {/* Tab: Todas */}
      <button
        onClick={() => onSelect(null)}
        className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all border ${
          selectedProjectId === null
            ? 'bg-primary text-primary-foreground border-primary shadow-sm'
            : 'bg-card text-muted-foreground border-border hover:bg-muted hover:text-foreground'
        }`}
      >
        <LayoutGrid className="w-3.5 h-3.5" />
        Todas mis tareas
        {totalPending > 0 && (
          <PendingBadge count={totalPending} isSelected={selectedProjectId === null} />
        )}
      </button>

      {/* Separador */}
      {projects.length > 0 && (
        <div className="w-px h-6 bg-border" />
      )}

      {/* Tabs visibles */}
      {visibleProjects.map((project) => {
        const isSelected = selectedProjectId === project.id
        const pendingCount = taskCountByProject[project.id] ?? 0

        return (
          <button
            key={project.id}
            onClick={() => onSelect(project.id)}
            title={project.company?.name ? `${project.name} · ${project.company.name}` : project.name}
            className={`flex flex-col items-start gap-0 px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all border ${
              isSelected
                ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                : 'bg-card text-muted-foreground border-border hover:bg-muted hover:text-foreground'
            }`}
          >
            <div className="flex items-center gap-2">
              <ProjectIcon type={project.type} className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="max-w-[130px] truncate">{project.name}</span>
              <PendingBadge count={pendingCount} isSelected={isSelected} />
            </div>
            {project.company?.name && (
              <span className={`text-[10px] leading-tight pl-[22px] max-w-[130px] truncate ${
                isSelected ? 'text-primary-foreground/70' : 'text-muted-foreground/70'
              }`}>
                {project.company.name}
              </span>
            )}
          </button>
        )
      })}

      {/* Popover de overflow con buscador */}
      {overflowProjects.length > 0 && (
        <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className={`h-auto py-1.5 rounded-full gap-2 px-4 text-sm font-medium border transition-all ${
                overflowSelected
                  ? 'bg-primary text-primary-foreground border-primary shadow-sm hover:bg-primary/90 hover:text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {overflowSelected && selectedOverflowProject ? (
                <div className="flex flex-col items-start gap-0">
                  <div className="flex items-center gap-2">
                    <ProjectIcon type={selectedOverflowProject.type} className="w-3.5 h-3.5" />
                    <span className="max-w-[120px] truncate">{selectedOverflowProject.name}</span>
                    <ChevronDown className="w-3.5 h-3.5 opacity-60" />
                  </div>
                  {selectedOverflowProject.company?.name && (
                    <span className="text-[10px] leading-tight pl-[22px] text-primary-foreground/70 max-w-[120px] truncate">
                      {selectedOverflowProject.company.name}
                    </span>
                  )}
                </div>
              ) : (
                <>
                  <span>+{overflowProjects.length} proyectos</span>
                  {overflowPendingTotal > 0 && (
                    <span className="text-xs bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 px-1.5 py-0.5 rounded-full font-semibold">
                      {overflowPendingTotal}
                    </span>
                  )}
                  <ChevronDown className="w-3.5 h-3.5 opacity-60" />
                </>
              )}
            </Button>
          </PopoverTrigger>

          <PopoverContent align="start" className="w-72 p-0" sideOffset={8}>
            {/* Buscador */}
            <div className="p-2 border-b border-border">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <Input
                  ref={searchRef}
                  placeholder="Buscar proyecto o cliente..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-8 h-8 text-sm border-0 focus-visible:ring-0 bg-muted/40"
                />
              </div>
            </div>

            {/* Lista de proyectos */}
            <div className="max-h-64 overflow-y-auto py-1">
              {search.trim() && allSearchResults.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">Sin resultados</p>
              ) : search.trim() ? (
                /* Resultados de búsqueda (incluye tabs visibles) */
                allSearchResults.map((project) => {
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
                })
              ) : (
                /* Sin búsqueda: solo overflow */
                filteredOverflow.map((project) => {
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
                })
              )}
            </div>

            {/* Footer: total */}
            {!search.trim() && (
              <div className="border-t border-border px-3 py-2">
                <p className="text-xs text-muted-foreground">
                  {overflowProjects.length} proyecto{overflowProjects.length !== 1 ? 's' : ''} más
                </p>
              </div>
            )}
          </PopoverContent>
        </Popover>
      )}
    </div>
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
      onClick={onSelect}
      className="w-full flex items-center gap-3 px-3 py-2 hover:bg-muted/60 transition-colors text-left"
    >
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
        isSelected ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
      }`}>
        <ProjectIcon type={project.type} className="w-4 h-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium truncate ${isSelected ? 'text-primary' : 'text-foreground'}`}>
          {project.name}
        </p>
        {project.company?.name && (
          <div className="flex items-center gap-1 mt-0.5">
            <Building2 className="w-3 h-3 text-muted-foreground flex-shrink-0" />
            <p className="text-xs text-muted-foreground truncate">{project.company.name}</p>
          </div>
        )}
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        {pendingCount > 0 && (
          <span className="text-xs bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 px-1.5 py-0.5 rounded-full font-semibold">
            {pendingCount}
          </span>
        )}
        {isSelected && <Check className="w-3.5 h-3.5 text-primary" />}
      </div>
    </button>
  )
}
