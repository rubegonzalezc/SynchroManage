'use client'

import { Input } from '@/components/ui/input'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Search, X } from 'lucide-react'
import { TASK_CATEGORIES } from '@/lib/constants/categories'

interface Member {
  id: string
  full_name: string
  avatar_url: string | null
}

interface TaskFiltersProps {
  search: string
  onSearchChange: (value: string) => void
  priorityFilter: string
  onPriorityFilterChange: (value: string) => void
  categoryFilter: string
  onCategoryFilterChange: (value: string) => void
  assigneeFilter: string
  onAssigneeFilterChange: (value: string) => void
  members: Member[]
  onClearFilters: () => void
  hasActiveFilters: boolean
}

const priorityLabels: Record<string, string> = {
  low: 'Baja',
  medium: 'Media',
  high: 'Alta',
  urgent: 'Urgente',
}


export function TaskFilters({
  search, onSearchChange,
  priorityFilter, onPriorityFilterChange,
  categoryFilter, onCategoryFilterChange,
  assigneeFilter, onAssigneeFilterChange,
  members, onClearFilters, hasActiveFilters,
}: TaskFiltersProps) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="relative flex-1 min-w-[200px] max-w-xs">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Buscar tareas..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9"
        />
      </div>

      <Select value={priorityFilter} onValueChange={onPriorityFilterChange}>
        <SelectTrigger className="w-[170px]">
          <SelectValue placeholder="Prioridad" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Prioridad: Todas</SelectItem>
          {Object.entries(priorityLabels).map(([key, label]) => (
            <SelectItem key={key} value={key}>{label}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={categoryFilter} onValueChange={onCategoryFilterChange}>
        <SelectTrigger className="w-[170px]">
          <SelectValue placeholder="Categoría" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Categoría: Todas</SelectItem>
          {TASK_CATEGORIES.map((cat) => (
            <SelectItem key={cat.slug} value={cat.slug}>{cat.icon} {cat.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={assigneeFilter} onValueChange={onAssigneeFilterChange}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Asignado" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Asignado: Todos</SelectItem>
          <SelectItem value="unassigned">Sin asignar</SelectItem>
          {members.map((m) => (
            <SelectItem key={m.id} value={m.id}>{m.full_name}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      {hasActiveFilters && (
        <Button variant="ghost" size="sm" onClick={onClearFilters}>
          <X className="w-4 h-4 mr-1" /> Limpiar
        </Button>
      )}
    </div>
  )
}
