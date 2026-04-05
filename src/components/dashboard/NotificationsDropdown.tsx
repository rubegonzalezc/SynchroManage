'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Bell, Check, MessageSquare, UserPlus, FolderPlus } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { createClient } from '@/lib/supabase/client'

interface Notification {
  id: string
  type: 'mention' | 'task_assigned' | 'project_assigned'
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

export function NotificationsDropdown() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)

  // Evitar problemas de hidratación
  useEffect(() => {
    setMounted(true)
  }, [])

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

  // Obtener usuario y configurar realtime
  useEffect(() => {
    if (!mounted) return

    const controller = new AbortController()
    const supabase = createClient()

    // Obtener usuario actual
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (controller.signal.aborted) return
      if (user) {
        setUserId(user.id)
        // Cargar notificaciones iniciales
        fetchNotifications(controller.signal)
      }
    }

    getUser()
    return () => controller.abort()
  }, [mounted])

  // Suscribirse a cambios en tiempo real
  useEffect(() => {
    if (!userId) return

    const supabase = createClient()

    // Suscribirse a nuevas notificaciones para este usuario
    const channel = supabase
      .channel('notifications-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        async (payload) => {
          // Nueva notificación recibida - recargar para obtener datos completos con from_user
          fetchNotifications()
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          // Notificación actualizada (marcada como leída)
          const updated = payload.new as { id: string; read: boolean }
          setNotifications(prev =>
            prev.map(n => n.id === updated.id ? { ...n, read: updated.read } : n)
          )
          if (updated.read) {
            setUnreadCount(prev => Math.max(0, prev - 1))
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId])

  const markAsRead = async (notificationIds: string[]) => {
    try {
      await fetch('/api/dashboard/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationIds }),
      })
      setNotifications(prev =>
        prev.map(n => notificationIds.includes(n.id) ? { ...n, read: true } : n)
      )
      setUnreadCount(prev => Math.max(0, prev - notificationIds.length))
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

  const getInitials = (name: string | null) => {
    if (!name) return '??'
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  const formatTime = (date: string) => {
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

  const getIcon = (type: string) => {
    switch (type) {
      case 'mention': return <MessageSquare className="w-4 h-4 text-blue-500" />
      case 'task_assigned': return <UserPlus className="w-4 h-4 text-green-500" />
      case 'project_assigned': return <FolderPlus className="w-4 h-4 text-purple-500" />
      default: return <Bell className="w-4 h-4 text-muted-foreground" />
    }
  }

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read) {
      markAsRead([notification.id])
    }
    setOpen(false)
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="w-5 h-5 text-muted-foreground" />
          {mounted && unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-medium">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <h3 className="font-semibold text-foreground">Notificaciones</h3>
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 flex items-center gap-1"
            >
              <Check className="w-3 h-3" /> Marcar todas
            </button>
          )}
        </div>

        <div className="max-h-96 overflow-y-auto">
          {loading ? (
            <div className="space-y-1 p-1">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex gap-3 px-3 py-3">
                  <Skeleton className="w-8 h-8 rounded-full flex-shrink-0" />
                  <div className="flex-1 space-y-2 pt-0.5">
                    <Skeleton className="h-3.5 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : notifications.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground text-sm">
              No tienes notificaciones
            </div>
          ) : (
            notifications.map((notification) => (
              <div key={notification.id}>
                {notification.link ? (
                  <Link
                    href={notification.link}
                    onClick={() => handleNotificationClick(notification)}
                    className={`flex gap-3 px-4 py-3 hover:bg-muted/50 transition-colors ${!notification.read ? 'bg-blue-50/50 dark:bg-blue-900/20' : ''
                      }`}
                  >
                    <NotificationContent notification={notification} getIcon={getIcon} getInitials={getInitials} formatTime={formatTime} />
                  </Link>
                ) : (
                  <div
                    onClick={() => handleNotificationClick(notification)}
                    className={`flex gap-3 px-4 py-3 hover:bg-muted/50 transition-colors cursor-pointer ${!notification.read ? 'bg-blue-50/50 dark:bg-blue-900/20' : ''
                      }`}
                  >
                    <NotificationContent notification={notification} getIcon={getIcon} getInitials={getInitials} formatTime={formatTime} />
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function NotificationContent({
  notification,
  getIcon,
  getInitials,
  formatTime
}: {
  notification: Notification
  getIcon: (type: string) => React.ReactNode
  getInitials: (name: string | null) => string
  formatTime: (date: string) => string
}) {
  return (
    <>
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
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-medium text-foreground line-clamp-1">
            {notification.title}
          </p>
          <span className="text-xs text-muted-foreground flex-shrink-0">
            {formatTime(notification.created_at)}
          </span>
        </div>
        <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
          {notification.message}
        </p>
      </div>
      {!notification.read && (
        <div className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0 mt-2" />
      )}
    </>
  )
}
