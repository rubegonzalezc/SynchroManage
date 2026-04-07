"use client"

import * as React from "react"
import { X, Search, ShieldCheck } from "lucide-react"
import { cn } from "@/lib/utils"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"

interface User {
  id: string
  full_name: string
  avatar_url: string | null
}

interface SingleSelectUserProps {
  users: User[]
  selectedId: string | null
  onSelectionChange: (id: string | null) => void
  placeholder?: string
  disabled?: boolean
  emptyLabel?: string
}

function getInitials(name: string) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

export function SingleSelectUser({
  users,
  selectedId,
  onSelectionChange,
  placeholder = "Buscar revisor...",
  disabled = false,
  emptyLabel = "Sin revisor",
}: SingleSelectUserProps) {
  const [search, setSearch] = React.useState("")
  const [isOpen, setIsOpen] = React.useState(false)
  const containerRef = React.useRef<HTMLDivElement>(null)
  const inputRef = React.useRef<HTMLInputElement>(null)

  const selectedUser = users.find(u => u.id === selectedId) ?? null

  const filtered = React.useMemo(() => {
    const q = search.toLowerCase().trim()
    return q ? users.filter(u => u.full_name.toLowerCase().includes(q)) : users
  }, [users, search])

  // Close on outside click
  React.useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
        setSearch("")
      }
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  const handleSelect = (id: string) => {
    onSelectionChange(id === selectedId ? null : id)
    setIsOpen(false)
    setSearch("")
  }

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation()
    onSelectionChange(null)
  }

  return (
    <div ref={containerRef} className="relative">
      {/* Trigger */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => {
          if (disabled) return
          setIsOpen(prev => !prev)
          setTimeout(() => inputRef.current?.focus(), 50)
        }}
        className={cn(
          "w-full flex items-center gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm transition-colors",
          "hover:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          disabled && "opacity-50 cursor-not-allowed",
          isOpen && "border-ring ring-2 ring-ring"
        )}
      >
        {selectedUser ? (
          <>
            <Avatar className="w-5 h-5 flex-shrink-0">
              <AvatarImage src={selectedUser.avatar_url || undefined} />
              <AvatarFallback className="bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400 text-[10px]">
                {getInitials(selectedUser.full_name)}
              </AvatarFallback>
            </Avatar>
            <span className="flex-1 text-left text-foreground truncate">{selectedUser.full_name}</span>
            {!disabled && (
              <X
                className="w-3.5 h-3.5 text-muted-foreground hover:text-foreground flex-shrink-0"
                onClick={handleClear}
              />
            )}
          </>
        ) : (
          <>
            <ShieldCheck className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            <span className="flex-1 text-left text-muted-foreground">{placeholder}</span>
          </>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 mt-1 w-full rounded-md border border-border bg-popover shadow-md">
          {/* Search */}
          <div className="flex items-center gap-2 border-b border-border px-3 py-2">
            <Search className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
            <input
              ref={inputRef}
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={placeholder}
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              onKeyDown={e => e.key === "Escape" && (setIsOpen(false), setSearch(""))}
            />
          </div>

          {/* Options */}
          <div className="max-h-48 overflow-y-auto py-1">
            {/* Clear option */}
            <button
              type="button"
              onClick={() => { onSelectionChange(null); setIsOpen(false); setSearch("") }}
              className={cn(
                "w-full flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:bg-accent transition-colors",
                !selectedId && "bg-accent/50"
              )}
            >
              <div className="w-5 h-5 rounded-full border-2 border-dashed border-muted-foreground/40 flex-shrink-0" />
              {emptyLabel}
            </button>

            {filtered.length === 0 ? (
              <p className="px-3 py-2 text-sm text-muted-foreground">Sin resultados</p>
            ) : (
              filtered.map(user => (
                <button
                  key={user.id}
                  type="button"
                  onClick={() => handleSelect(user.id)}
                  className={cn(
                    "w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-accent transition-colors",
                    selectedId === user.id && "bg-accent"
                  )}
                >
                  <Avatar className="w-6 h-6 flex-shrink-0">
                    <AvatarImage src={user.avatar_url || undefined} />
                    <AvatarFallback className="bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400 text-[10px]">
                      {getInitials(user.full_name)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="flex-1 text-left truncate">{user.full_name}</span>
                  {selectedId === user.id && (
                    <div className="w-2 h-2 rounded-full bg-violet-500 flex-shrink-0" />
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
