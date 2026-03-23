'use client'

import { useState, useRef, useEffect, KeyboardEvent, ChangeEvent } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Users } from 'lucide-react'

interface User {
  id: string
  full_name: string
  avatar_url: string | null
}

// Usuario virtual que representa @Todos
const TODOS_USER: User = { id: 'all', full_name: 'Todos', avatar_url: null }

interface MentionInputProps {
  value: string
  onChange: (value: string) => void
  onSubmit: () => void
  users: User[]
  placeholder?: string
  disabled?: boolean
}

export function MentionInput({ value, onChange, onSubmit, users, placeholder, disabled }: MentionInputProps) {
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [filteredUsers, setFilteredUsers] = useState<User[]>([])
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [mentionStart, setMentionStart] = useState<number | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const suggestionsRef = useRef<HTMLDivElement>(null)

  const getInitials = (name: string | null) => {
    if (!name) return '??'
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    const cursorPos = e.target.selectionStart || 0
    onChange(newValue)

    // Buscar si estamos escribiendo una mención
    const textBeforeCursor = newValue.slice(0, cursorPos)
    const lastAtIndex = textBeforeCursor.lastIndexOf('@')

    if (lastAtIndex !== -1) {
      const textAfterAt = textBeforeCursor.slice(lastAtIndex + 1)
      
      // Buscar usuarios que coincidan con lo escrito después del @
      const searchTerm = textAfterAt.toLowerCase()
      const filtered = users.filter(u => 
        u.full_name.toLowerCase().startsWith(searchTerm) ||
        u.full_name.toLowerCase().includes(searchTerm)
      ).slice(0, 4)

      // Agregar @Todos si el término de búsqueda coincide
      const suggestions: User[] = []
      if ('todos'.startsWith(searchTerm) || searchTerm === '') {
        suggestions.push(TODOS_USER)
      }
      suggestions.push(...filtered)
      
      if (suggestions.length > 0) {
        setMentionStart(lastAtIndex)
        setFilteredUsers(suggestions)
        setShowSuggestions(true)
        setSelectedIndex(0)
        return
      }
    }

    setShowSuggestions(false)
    setMentionStart(null)
  }

  const insertMention = (user: User) => {
    if (mentionStart === null) return

    const beforeMention = value.slice(0, mentionStart)
    const cursorPos = inputRef.current?.selectionStart || value.length
    
    // Encontrar dónde termina lo que el usuario escribió después del @
    const afterMention = value.slice(cursorPos)
    
    const newValue = `${beforeMention}@${user.full_name} ${afterMention.trimStart()}`
    onChange(newValue)
    setShowSuggestions(false)
    setMentionStart(null)
    
    // Enfocar el input después de insertar
    setTimeout(() => {
      inputRef.current?.focus()
      const newCursorPos = beforeMention.length + user.full_name.length + 2
      inputRef.current?.setSelectionRange(newCursorPos, newCursorPos)
    }, 0)
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (showSuggestions) {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedIndex(prev => (prev + 1) % filteredUsers.length)
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedIndex(prev => (prev - 1 + filteredUsers.length) % filteredUsers.length)
      } else if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault()
        if (filteredUsers[selectedIndex]) {
          insertMention(filteredUsers[selectedIndex])
        }
      } else if (e.key === 'Escape') {
        setShowSuggestions(false)
      }
    } else if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      onSubmit()
    }
  }

  // Cerrar sugerencias al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(e.target as Node)) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="relative flex-1">
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        className="flex h-10 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
      />
      
      {showSuggestions && (
        <div
          ref={suggestionsRef}
          className="absolute bottom-full left-0 mb-1 w-64 bg-popover border border-border rounded-lg shadow-lg z-50 overflow-hidden"
        >
          <div className="p-2 text-xs text-muted-foreground border-b border-border">Mencionar a...</div>
          {filteredUsers.map((user, index) => (
            <button
              key={user.id}
              type="button"
              onClick={() => insertMention(user)}
              className={`w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-accent transition-colors ${
                index === selectedIndex ? 'bg-accent' : ''
              }`}
            >
              {user.id === 'all' ? (
                <div className="w-6 h-6 rounded-full bg-green-100 dark:bg-green-900/40 flex items-center justify-center flex-shrink-0">
                  <Users className="w-3 h-3 text-green-600 dark:text-green-400" />
                </div>
              ) : (
                <Avatar className="w-6 h-6">
                  <AvatarImage src={user.avatar_url || undefined} />
                  <AvatarFallback className="bg-muted text-muted-foreground text-xs">
                    {getInitials(user.full_name)}
                  </AvatarFallback>
                </Avatar>
              )}
              <span className={`text-sm ${
                user.id === 'all'
                  ? 'font-semibold text-green-700 dark:text-green-400'
                  : 'text-foreground'
              }`}>
                {user.id === 'all' ? '@Todos' : user.full_name}
              </span>
              {user.id === 'all' && (
                <span className="ml-auto text-xs text-muted-foreground">todos</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// Función para detectar si el texto contiene @Todos
export function extractMentionAll(text: string): boolean {
  if (!text) return false
  // Buscar @Todos como palabra completa (seguida de espacio, fin, o @)
  return /@Todos(?:\s|$|@)/i.test(text) || text.endsWith('@Todos')
}

// Función para renderizar texto con menciones resaltadas
export function renderMentions(text: string, users: User[], currentUserId?: string): React.ReactNode {
  if (!text) return text
  
  const parts: React.ReactNode[] = []
  let remainingText = text
  let keyIndex = 0

  // Buscar menciones iterativamente
  while (remainingText.length > 0) {
    const atIndex = remainingText.indexOf('@')
    
    if (atIndex === -1) {
      // No hay más @, agregar el resto del texto
      parts.push(remainingText)
      break
    }

    // Agregar texto antes del @
    if (atIndex > 0) {
      parts.push(remainingText.slice(0, atIndex))
    }

    // Buscar si algún usuario coincide después del @
    const textAfterAt = remainingText.slice(atIndex + 1)
    let foundUser: User | null = null
    let matchLength = 0

    // Verificar primero @Todos (especial)
    if (textAfterAt.toLowerCase().startsWith('todos')) {
      const charAfterTodos = textAfterAt[5]
      if (!charAfterTodos || charAfterTodos === ' ' || charAfterTodos === '@' || charAfterTodos === '\n') {
        parts.push(
          <span
            key={`mention-${keyIndex++}`}
            className="font-semibold px-1 rounded text-green-700 bg-green-100 dark:text-green-400 dark:bg-green-900/30"
          >
            @Todos
          </span>
        )
        remainingText = remainingText.slice(atIndex + 1 + 5)
        continue
      }
    }

    // Ordenar usuarios por longitud de nombre (más largo primero) para evitar coincidencias parciales
    const sortedUsers = [...users].sort((a, b) => b.full_name.length - a.full_name.length)

    for (const user of sortedUsers) {
      if (textAfterAt.toLowerCase().startsWith(user.full_name.toLowerCase())) {
        // Verificar que después del nombre hay un espacio, fin de texto, o @
        const charAfterName = textAfterAt[user.full_name.length]
        if (!charAfterName || charAfterName === ' ' || charAfterName === '@' || charAfterName === '\n') {
          foundUser = user
          matchLength = user.full_name.length
          break
        }
      }
    }

    if (foundUser) {
      const isCurrentUser = currentUserId && foundUser.id === currentUserId
      parts.push(
        <span 
          key={`mention-${keyIndex++}`}
          className={`font-medium px-1 rounded ${
            isCurrentUser 
              ? 'text-amber-700 bg-amber-100 ring-1 ring-amber-300 dark:text-amber-400 dark:bg-amber-900/30 dark:ring-amber-700' 
              : 'text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-900/30'
          }`}
        >
          @{foundUser.full_name}
        </span>
      )
      remainingText = remainingText.slice(atIndex + 1 + matchLength)
    } else {
      // No es una mención válida, agregar el @ y continuar
      parts.push('@')
      remainingText = remainingText.slice(atIndex + 1)
    }
  }

  return parts.length > 0 ? parts : text
}

// Función para extraer IDs de usuarios mencionados
export function extractMentionedUserIds(text: string, users: User[]): string[] {
  if (!text || users.length === 0) return []
  
  const mentionedIds: string[] = []
  let remainingText = text

  // Ordenar usuarios por longitud de nombre (más largo primero)
  const sortedUsers = [...users].sort((a, b) => b.full_name.length - a.full_name.length)

  while (remainingText.length > 0) {
    const atIndex = remainingText.indexOf('@')
    
    if (atIndex === -1) break

    const textAfterAt = remainingText.slice(atIndex + 1)

    for (const user of sortedUsers) {
      if (textAfterAt.toLowerCase().startsWith(user.full_name.toLowerCase())) {
        const charAfterName = textAfterAt[user.full_name.length]
        if (!charAfterName || charAfterName === ' ' || charAfterName === '@' || charAfterName === '\n') {
          if (!mentionedIds.includes(user.id)) {
            mentionedIds.push(user.id)
          }
          remainingText = remainingText.slice(atIndex + 1 + user.full_name.length)
          break
        }
      }
    }

    // Si no encontró usuario, avanzar después del @
    if (remainingText.indexOf('@') === atIndex) {
      remainingText = remainingText.slice(atIndex + 1)
    }
  }

  return mentionedIds
}
