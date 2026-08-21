'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Bug,
  FolderKanban,
  ListTodo,
  Loader2,
  Search,
  UserRound,
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import type { DashboardSearchResponse } from '@/lib/types/search'
import {
  COMMAND_PALETTE_MIN_QUERY_LENGTH,
  useDashboardSearch,
} from '@/hooks/useDashboardSearch'
import {
  getBugSearchHref,
  getProjectSearchHref,
  getTaskSearchHref,
  getUserSearchHref,
} from '@/lib/utils/search-navigation'

interface CommandPaletteProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface PaletteItem {
  id: string
  group: 'Tareas' | 'Proyectos' | 'Bugs' | 'Usuarios'
  title: string
  subtitle?: string
  href: string
}

function buildPaletteItems(
  results: DashboardSearchResponse,
  currentUserId?: string | null
): PaletteItem[] {
  const items: PaletteItem[] = []

  for (const task of results.tasks) {
    items.push({
      id: `task-${task.id}`,
      group: 'Tareas',
      title: task.task_number != null ? `#${task.task_number} ${task.title}` : task.title,
      subtitle: task.project?.name ?? undefined,
      href: getTaskSearchHref(task),
    })
  }

  for (const project of results.projects) {
    items.push({
      id: `project-${project.id}`,
      group: 'Proyectos',
      title: project.name,
      subtitle: project.type === 'change_control' ? 'Control de cambios' : 'Proyecto',
      href: getProjectSearchHref(project),
    })
  }

  for (const bug of results.bugs) {
    items.push({
      id: `bug-${bug.id}`,
      group: 'Bugs',
      title: bug.title,
      subtitle: bug.project?.name ?? undefined,
      href: getBugSearchHref(bug),
    })
  }

  for (const user of results.users) {
    items.push({
      id: `user-${user.id}`,
      group: 'Usuarios',
      title: user.full_name || user.email,
      subtitle: user.full_name ? user.email : undefined,
      href: getUserSearchHref(user, currentUserId),
    })
  }

  return items
}

const groupIcon = {
  Tareas: ListTodo,
  Proyectos: FolderKanban,
  Bugs: Bug,
  Usuarios: UserRound,
} as const

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)

  const { results, isLoading, error, shouldFetch } = useDashboardSearch(query, open)

  useEffect(() => {
    if (!open) return
    setQuery('')
    setSelectedIndex(0)
    const timeout = window.setTimeout(() => inputRef.current?.focus(), 0)
    return () => window.clearTimeout(timeout)
  }, [open])

  useEffect(() => {
    if (!open || currentUserId) return
    fetch('/api/dashboard/me')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setCurrentUserId(data?.user?.id ?? null))
      .catch(() => setCurrentUserId(null))
  }, [open, currentUserId])

  const items = useMemo(
    () => buildPaletteItems(results, currentUserId),
    [results, currentUserId]
  )

  useEffect(() => {
    setSelectedIndex(0)
  }, [query, items.length])

  const groupedItems = useMemo(() => {
    const groups: Array<{ label: PaletteItem['group']; items: PaletteItem[]; startIndex: number }> = []
    const order: PaletteItem['group'][] = ['Tareas', 'Proyectos', 'Bugs', 'Usuarios']
    let offset = 0

    for (const label of order) {
      const groupItems = items.filter((item) => item.group === label)
      if (groupItems.length > 0) {
        groups.push({ label, items: groupItems, startIndex: offset })
        offset += groupItems.length
      }
    }

    return groups
  }, [items])

  const navigateTo = (href: string) => {
    onOpenChange(false)
    router.push(href)
  }

  const handleInputKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (items.length === 0) return

    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setSelectedIndex((prev) => (prev + 1) % items.length)
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      setSelectedIndex((prev) => (prev - 1 + items.length) % items.length)
    } else if (event.key === 'Enter') {
      event.preventDefault()
      const target = items[selectedIndex]
      if (target) navigateTo(target.href)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl p-0 gap-0 overflow-hidden" showCloseButton>
        <DialogHeader className="px-4 pt-4 pb-2 space-y-1">
          <DialogTitle>Búsqueda rápida</DialogTitle>
          <DialogDescription>
            Tareas, proyectos, bugs y usuarios. Escribe al menos {COMMAND_PALETTE_MIN_QUERY_LENGTH} caracteres.
          </DialogDescription>
        </DialogHeader>

        <div className="px-4 pb-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              ref={inputRef}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={handleInputKeyDown}
              placeholder="Buscar por título, #tarea, proyecto, bug o usuario…"
              className="pl-9"
              aria-label="Buscar en el sistema"
              autoComplete="off"
            />
          </div>
        </div>

        <div className="border-t border-border max-h-[min(360px,50dvh)] overflow-y-auto px-2 pb-2">
          {query.trim().length < COMMAND_PALETTE_MIN_QUERY_LENGTH ? (
            <p className="px-3 py-8 text-center text-sm text-muted-foreground">
              Escribe al menos {COMMAND_PALETTE_MIN_QUERY_LENGTH} caracteres para buscar
            </p>
          ) : isLoading ? (
            <div className="flex items-center justify-center gap-2 px-3 py-8 text-sm text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" />
              Buscando…
            </div>
          ) : error ? (
            <p className="px-3 py-8 text-center text-sm text-red-600 dark:text-red-400">
              No se pudo completar la búsqueda
            </p>
          ) : items.length === 0 && shouldFetch ? (
            <p className="px-3 py-8 text-center text-sm text-muted-foreground">
              Sin resultados para &quot;{query.trim()}&quot;
            </p>
          ) : (
            groupedItems.map((group) => {
              const GroupIcon = groupIcon[group.label]

              return (
                <div key={group.label} className="py-1">
                  <div className="flex items-center gap-2 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    <GroupIcon className="w-3.5 h-3.5" />
                    {group.label}
                  </div>
                  <div role="listbox" aria-label={group.label}>
                    {group.items.map((item, indexInGroup) => {
                      const flatIndex = group.startIndex + indexInGroup
                      const selected = flatIndex === selectedIndex

                      return (
                        <button
                          key={item.id}
                          type="button"
                          role="option"
                          aria-selected={selected}
                          className={cn(
                            'w-full text-left rounded-xl px-3 py-2.5 transition-colors',
                            selected
                              ? 'bg-primary/10 text-foreground'
                              : 'hover:bg-muted/60 text-foreground'
                          )}
                          onMouseEnter={() => setSelectedIndex(flatIndex)}
                          onClick={() => navigateTo(item.href)}
                        >
                          <div className="text-sm font-medium truncate">{item.title}</div>
                          {item.subtitle && (
                            <div className="text-xs text-muted-foreground truncate">{item.subtitle}</div>
                          )}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )
            })
          )}
        </div>

        <div className="border-t border-border px-4 py-2 text-[11px] text-muted-foreground flex items-center justify-between">
          <span>↑↓ navegar · Enter abrir · Esc cerrar</span>
          <span className="hidden sm:inline">⌘K / Ctrl+K</span>
        </div>
      </DialogContent>
    </Dialog>
  )
}
