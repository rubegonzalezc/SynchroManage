"use client"

import * as React from "react"
import { X, Search } from "lucide-react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"

interface RoleOption {
  id: number
  name: string
  description: string
}

interface MultiSelectRoleProps {
  roles: RoleOption[]
  selectedIds: string[]
  onSelectionChange: (ids: string[]) => void
  placeholder?: string
  disabled?: boolean
}

const roleLabels: Record<string, string> = {
  admin: "Administrador",
  pm: "Project Manager",
  tech_lead: "Tech Lead",
  developer: "Desarrollador",
  stakeholder: "Stakeholder",
}

const roleBadgeColors: Record<string, string> = {
  admin: "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800",
  pm: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800",
  tech_lead: "bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800",
  developer: "bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800",
  stakeholder: "bg-cyan-100 text-cyan-700 border-cyan-200 dark:bg-cyan-900/30 dark:text-cyan-400 dark:border-cyan-800",
}

export function MultiSelectRole({
  roles,
  selectedIds,
  onSelectionChange,
  placeholder = "Buscar rol...",
  disabled = false,
}: MultiSelectRoleProps) {
  const [search, setSearch] = React.useState("")
  const [isOpen, setIsOpen] = React.useState(false)
  const containerRef = React.useRef<HTMLDivElement>(null)
  const inputRef = React.useRef<HTMLInputElement>(null)

  const selectedRoles = roles.filter((r) => selectedIds.includes(r.id.toString()))
  const available = roles.filter((r) => !selectedIds.includes(r.id.toString()))
  const filtered = available.filter((r) => {
    if (!search.trim()) return true
    const query = search.toLowerCase()
    const label = roleLabels[r.name] || r.name
    return label.toLowerCase().includes(query) || r.name.toLowerCase().includes(query)
  })

  const handleSelect = (id: string) => {
    onSelectionChange([...selectedIds, id])
    setSearch("")
    inputRef.current?.focus()
  }

  const handleRemove = (id: string) => {
    onSelectionChange(selectedIds.filter((sid) => sid !== id))
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !search && selectedIds.length > 0) {
      onSelectionChange(selectedIds.slice(0, -1))
    }
    if (e.key === "Escape") {
      setIsOpen(false)
      inputRef.current?.blur()
    }
  }

  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  return (
    <div ref={containerRef} className="relative">
      <div
        className={cn(
          "border-input bg-transparent dark:bg-input/30 flex min-h-9 w-full flex-wrap items-center gap-1 rounded-md border px-3 py-1 shadow-xs transition-[color,box-shadow]",
          isOpen && "border-ring ring-ring/50 ring-[3px]",
          disabled && "pointer-events-none cursor-not-allowed opacity-50"
        )}
        onClick={() => {
          if (!disabled) {
            inputRef.current?.focus()
            setIsOpen(true)
          }
        }}
      >
        {selectedRoles.map((role) => (
          <Badge
            key={role.id}
            variant="outline"
            className={cn("gap-1 pr-1", roleBadgeColors[role.name])}
          >
            {roleLabels[role.name] || role.name}
            <button
              type="button"
              className="ml-0.5 rounded-full outline-none hover:bg-muted-foreground/20 focus-visible:ring-1 focus-visible:ring-ring"
              onClick={(e) => {
                e.stopPropagation()
                if (!disabled) handleRemove(role.id.toString())
              }}
              aria-label={`Remover ${roleLabels[role.name] || role.name}`}
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}
        <div className="flex flex-1 items-center gap-1">
          <Search className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setIsOpen(true)
            }}
            onFocus={() => setIsOpen(true)}
            onKeyDown={handleKeyDown}
            placeholder={selectedIds.length === 0 ? placeholder : ""}
            disabled={disabled}
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground min-w-[80px] h-7"
          />
        </div>
      </div>

      {isOpen && !disabled && (
        <div className="absolute z-50 mt-1 w-full rounded-md border border-input bg-popover shadow-md">
          <div className="max-h-48 overflow-y-auto p-1">
            {filtered.length === 0 ? (
              <div className="px-3 py-2 text-sm text-muted-foreground text-center">
                No se encontraron roles
              </div>
            ) : (
              filtered.map((role) => (
                <button
                  key={role.id}
                  type="button"
                  className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground cursor-pointer outline-none focus-visible:bg-accent"
                  onClick={() => handleSelect(role.id.toString())}
                >
                  <Badge variant="outline" className={cn("text-xs", roleBadgeColors[role.name])}>
                    {roleLabels[role.name] || role.name}
                  </Badge>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
