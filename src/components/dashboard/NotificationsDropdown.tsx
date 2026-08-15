'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Bell,
  Check,
  CheckCheck,
  Trash2,
  ListTodo,
  FolderKanban,
  CalendarClock,
  Clock,
  X,
} from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { createClient } from '@/lib/supabase/client'

// ─── Tipos ────────────────────────────────────────────────────────────────────

type NotificationType =
  | 'task_assigned'
  | 'project_assigned'
  | 'meeting_invite'
  | 'meeting_response'
  | 'meeting_updated'
  | 'meeting_cancelled'
  | 'task_due_soon'

interface Notification {
  id: string
  type: NotificationType
  title: string
  message: string
  link: string | null
  read: boolean
  created_at: string
  from_user: {
    id: string
    full_name: string
    avatar_url: string | null
  } | null
}

// ─── Filtros disponibles ───────────────────────────────────────────────────────

type FilterKey = 'all' | 'tasks' | 'projects' | 'meetings'

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'all',      label: 'Todas' },
  { key: 'tasks',    label: 'Tareas' },
  { key: 'projects', label: 'Proyectos' },
  { key: 'meetings', label: 'Reuniones' },
]

const FILTER_TYPES: Record<FilterKey, NotificationType[] | null> = {
  all:      null,
  tasks:    ['task_assigned', 'task_due_soon'],
  projects: ['project_assigned'],
  meetings: ['meeting_invite', 'meeting_response', 'meeting_updated', 'meeting_cancelled'],
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getInitials(name: string | null) {
  if (!name) return '??'
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

function formatTime(date: string) {
  const now = new Date()
  const notifDate = new Date(date)
  const diffMs = now.getTime() - notifDate.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'Ahora'
  if (diffMins < 60) return `${diffMins}m`
  if (diffHours < 24) return `${diffHours}h`
  if (diffDays < 7) return `${diffDays}d`
  return notifDate.toLocaleDateString('es-CL', { day: '2-digit', month: 'short' })
}

/** Devuelve true si la notificación fue creada hace menos de 24 horas */
function isNew(date: string) {
  return Date.now() - new Date(date).getTime() < 86400000
}

function getIcon(type: NotificationType) {
  switch (type) {
    case 'task_assigned':
    case 'task_due_soon':
      return <ListTodo className="w-4 h-4 text-green-500" />
    case 'project_assigned':
      return <FolderKanban className="w-4 h-4 text-purple-500" />
    case 'meeting_invite':
    case 'meeting_updated':
    case 'meeting_cancelled':
      return <CalendarClock className="w-4 h-4 text-blue-500" />
    case 'meeting_response':
      return <CalendarClock className="w-4 h-4 text-amber-500" />
    default:
      return <Bell className="w-4 h-4 text-muted-foreground" />
  }
}

// ─── Sub-componente: fila de notificación ─────────────────────────────────────

function NotificationRow({
  notification,
  onRead,
  onClose,
}: {
  notification: Notification
  onRead: (id: string) => void
  onClose: () => void
}) {
  const content = (
    <>
      {/* Avatar o icono */}
      <div className="flex-shrink-0 mt-0.5">
        {notification.from_user ? (
          <Avatar className="w-8 h-8">
            <AvatarImage src={notification.from_user.avatar_url || undefined} />
            <AvatarFallback className="bg-muted text-muted-foreground text-xs">
              {getInitials(notification.from_user.full_name)}
            </AvatarFallback>
          </Avatar>
        ) : (
          <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
            {getIcon(notification.type)}
          </div>
        )}
      </div>

      {/* Texto */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-medium text-foreground line-clamp-1">
            {notification.title}
          </p>
          <span className="text-xs text-muted-foreground flex-shrink-0 flex items-center gap-0.5">
            <Clock className="w-3 h-3" />
            {formatTime(notification.created_at)}
          </span>
        </div>
        <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
          {notification.message}
        </p>
      </div>

      {/* Indicador no leída */}
      {!notification.read && (
        <div className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0 mt-2" />
      )}
    </>
  )

  const rowClass = `flex gap-3 px-4 py-3 hover:bg-muted/50 transition-colors ${
    !notification.read ? 'bg-blue-50/50 dark:bg-blue-900/20' : ''
  }`

  const handleClick = () => {
    if (!notification.read) onRead(notification.id)
    onClose()
  }

  if (notification.link) {
    return (
      <Link href={notification.link} onClick={handleClick} className={rowClass}>
        {content}
      </Link>
    )
  }

  return (
    <div onClick={handleClick} className={`${rowClass} cursor-pointer`}>
      {content}
    </div>
  )
}

// ─── Sub-componente: sección con título ───────────────────────────────────────

function NotificationSection({
  title,
  notifications,
  onRead,
  onClose,
}: {
  title: string
  notifications: Notification[]
  onRead: (id: string) => void
  onClose: () => void
}) {
  if (notifications.length === 0) return null

  return (
    <div>
      <p className="px-4 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground bg-muted/30 border-b border-border">
        {title}
      </p>
      {notifications.map(n => (
        <NotificationRow key={n.id} notification={n} onRead={onRead} onClose={onClose} />
      ))}
    </div>
  )
}

// ─── Componente principal ─────────────────────────────────────────────────────

export function NotificationsDropdown() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [activeFilter, setActiveFilter] = useState<FilterKey>('all')
  const [clearing, setClearing] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  // ── Fetch ──────────────────────────────────────────────────────────────────

  const fetchNotifications = async (signal?: AbortSignal) => {
    try {
      const response = await fetch('/api/dashboard/notifications', { signal })
      if (response.ok) {
        const data = await response.json()
        setNotifications(data.notifications || [])
        setUnreadCount(data.unreadCount || 0)
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return
      console.error('Error fetching notifications:', error)
    } finally {
      if (!signal?.aborted) setLoading(false)
    }
  }

  // ── Init + realtime ────────────────────────────────────────────────────────

  useEffect(() => {
    if (!mounted) return
    const controller = new AbortController()
    const supabase = createClient()

    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (controller.signal.aborted) return
      if (user) {
        setUserId(user.id)
        fetchNotifications(controller.signal)
      }
    }

    getUser()
    return () => controller.abort()
  }, [mounted])

  useEffect(() => {
    if (!userId) return
    const supabase = createClient()

    const channel = supabase
      .channel('notifications-changes')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`,
      }, () => { fetchNotifications() })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`,
      }, (payload) => {
        const updated = payload.new as { id: string; read: boolean }
        setNotifications(prev =>
          prev.map(n => n.id === updated.id ? { ...n, read: updated.read } : n)
        )
        if (updated.read) setUnreadCount(prev => Math.max(0, prev - 1))
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [userId])

  // ── Acciones ───────────────────────────────────────────────────────────────

  const markAsRead = async (notificationId: string) => {
    try {
      await fetch('/api/dashboard/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationIds: [notificationId] }),
      })
      setNotifications(prev =>
        prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
      )
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch (error) {
      console.error('Error marking as read:', error)
    }
  }

  const markAllAsRead = async () => {
    try {
      await fetch('/api/dashboard/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markAll: true }),
      })
      setNotifications(prev => prev.map(n => ({ ...n, read: true })))
      setUnreadCount(0)
    } catch (error) {
      console.error('Error marking all as read:', error)
    }
  }

  const clearHistory = async () => {
    setClearing(true)
    try {
      await fetch('/api/dashboard/notifications?onlyRead=true', { method: 'DELETE' })
      setNotifications(prev => prev.filter(n => !n.read))
    } catch (error) {
      console.error('Error clearing history:', error)
    } finally {
      setClearing(false)
    }
  }

  // ── Filtrado y secciones ───────────────────────────────────────────────────

  const filtered = useMemo(() => {
    const types = FILTER_TYPES[activeFilter]
    if (!types) return notifications
    return notifications.filter(n => types.includes(n.type))
  }, [notifications, activeFilter])

  const newNotifs = useMemo(() => filtered.filter(n => isNew(n.created_at)), [filtered])
  const olderNotifs = useMemo(() => filtered.filter(n => !isNew(n.created_at)), [filtered])

  const hasRead = notifications.some(n => n.read)
  const hasUnread = unreadCount > 0

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild suppressHydrationWarning>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="w-5 h-5 text-muted-foreground" />
          {mounted && unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-medium">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-96 p-0" onCloseAutoFocus={e => e.preventDefault()}>

        {/* ── Header ── */}
        <div className="px-4 py-3 border-b border-border">
          <div className="flex items-center justify-between mb-2.5">
            <h3 className="font-semibold text-foreground">Notificaciones</h3>
            <div className="flex items-center gap-1">
              {hasUnread && (
                <button
                  onClick={markAllAsRead}
                  title="Marcar todo como leído"
                  className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 px-2 py-1 rounded hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  Marcar todo como leído
                </button>
              )}
              {hasRead && (
                <button
                  onClick={clearHistory}
                  disabled={clearing}
                  title="Limpiar leídas"
                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive px-2 py-1 rounded hover:bg-muted transition-colors disabled:opacity-50"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  {clearing ? 'Limpiando…' : 'Limpiar leídas'}
                </button>
              )}
            </div>
          </div>

          {/* ── Filtros ── */}
          <div className="flex gap-1">
            {FILTERS.map(f => (
              <button
                key={f.key}
                onClick={() => setActiveFilter(f.key)}
                className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                  activeFilter === f.key
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Lista ── */}
        <div className="max-h-[420px] overflow-y-auto">
          {loading ? (
            <div className="space-y-1 p-1">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex gap-3 px-3 py-3">
                  <Skeleton className="w-8 h-8 rounded-full flex-shrink-0" />
                  <div className="flex-1 space-y-2 pt-0.5">
                    <Skeleton className="h-3.5 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-10 text-center">
              <Bell className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">
                {activeFilter === 'all'
                  ? 'No tienes notificaciones'
                  : 'No hay notificaciones en esta categoría'}
              </p>
              {activeFilter !== 'all' && (
                <button
                  onClick={() => setActiveFilter('all')}
                  className="mt-2 text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 mx-auto"
                >
                  <X className="w-3 h-3" /> Quitar filtro
                </button>
              )}
            </div>
          ) : (
            <>
              <NotificationSection
                title="Nuevas"
                notifications={newNotifs}
                onRead={markAsRead}
                onClose={() => setOpen(false)}
              />
              <NotificationSection
                title="Anteriores"
                notifications={olderNotifs}
                onRead={markAsRead}
                onClose={() => setOpen(false)}
              />
            </>
          )}
        </div>

        {/* ── Footer con conteo ── */}
        {!loading && filtered.length > 0 && (
          <div className="px-4 py-2 border-t border-border text-xs text-muted-foreground flex items-center justify-between">
            <span>
              {filtered.length} notificación{filtered.length !== 1 ? 'es' : ''}
              {activeFilter !== 'all' && ' filtradas'}
            </span>
            {hasUnread && (
              <span className="flex items-center gap-1 text-blue-600 dark:text-blue-400">
                <Check className="w-3 h-3" />
                {unreadCount} sin leer
              </span>
            )}
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
