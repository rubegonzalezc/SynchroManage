"use client"

import * as React from "react"
import { X, Search } from "lucide-react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"

interface MultiSelectDeveloperProps {
  members: { id: string; full_name: string; avatar_url: string | null }[]
  selectedIds: string[]
  onSelectionChange: (ids: string[]) => void
  placeholder?: string
  disabled?: boolean
}

export function filterMembersBySearch(
  members: { id: string; full_name: string; avatar_url: string | null }[],
  searchQuery: string
) {
  if (!searchQuery.trim()) return members
  const query = searchQuery.toLowerCase()
  return members.filter((m) => m.full_name.toLowerCase().includes(query))
}

export function getAvailableMembers(
  members: { id: string; full_name: string; avatar_url: string | null }[],
  selectedIds: string[]
) {
  const selectedSet = new Set(selectedIds)
  return members.filter((m) => !selectedSet.has(m.id))
}

export function MultiSelectDeveloper({
  members,
  selectedIds,
  onSelectionChange,
  placeholder = "Buscar desarrollador...",
  disabled = false,
}: MultiSelectDeveloperProps) {
  const [search, setSearch] = React.useState("")
  const [isOpen, setIsOpen] = React.useState(false)
  const containerRef = React.useRef<HTMLDivElement>(null)
  const inputRef = React.useRef<HTMLInputElement>(null)

  const selectedMembers = members.filter((m) => selectedIds.includes(m.id))
  const available = getAvailableMembers(members, selectedIds)
  const filtered = filterMembersBySearch(available, search)

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

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

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
        {selectedMembers.map((member) => (
          <Badge
            key={member.id}
            variant="secondary"
            className="gap-1 pr-1"
          >
            {member.full_name}
            <button
              type="button"
              className="ml-0.5 rounded-full outline-none hover:bg-muted-foreground/20 focus-visible:ring-1 focus-visible:ring-ring"
              onClick={(e) => {
                e.stopPropagation()
                if (!disabled) handleRemove(member.id)
              }}
              aria-label={`Remover ${member.full_name}`}
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
                No se encontraron usuarios
              </div>
            ) : (
              filtered.map((member) => (
                <button
                  key={member.id}
                  type="button"
                  className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground cursor-pointer outline-none focus-visible:bg-accent"
                  onClick={() => handleSelect(member.id)}
                >
                  <Avatar size="sm">
                    {member.avatar_url && (
                      <AvatarImage src={member.avatar_url} alt={member.full_name} />
                    )}
                    <AvatarFallback>{getInitials(member.full_name)}</AvatarFallback>
                  </Avatar>
                  <span>{member.full_name}</span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
