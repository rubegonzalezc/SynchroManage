'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Mail, Globe, CheckCircle, Loader2 } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { createClient } from '@/lib/supabase/client'
import { RegistroTitle } from '@/components/dashboard/catalog/RegistroTitle'

interface SystemSettings {
  id: string
  company_name: string
  company_email: string | null
  company_website: string | null
  default_project_status: string
  default_task_priority: string
  notifications_retention_days: number
  allow_user_registration: boolean
  require_email_verification: boolean
}

interface SystemStats {
  total_users: number
  total_projects: number
  total_tasks: number
  total_companies: number
  total_notifications: number
}

export default function SettingsPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [stats, setStats] = useState<SystemStats | null>(null)

  const [settings, setSettings] = useState<SystemSettings>({
    id: '',
    company_name: 'SynchroManage',
    company_email: '',
    company_website: '',
    default_project_status: 'planning',
    default_task_priority: 'medium',
    notifications_retention_days: 15,
    allow_user_registration: false,
    require_email_verification: true,
  })

  const supabase = createClient()

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const settingsRes = await fetch('/api/dashboard/settings')
      if (settingsRes.ok) {
        const settingsData = await settingsRes.json()
        if (settingsData.settings) {
          setSettings(settingsData.settings)
        }
      }

      const [users, projects, tasks, companies, notifications] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('projects').select('*', { count: 'exact', head: true }),
        supabase.from('tasks').select('*', { count: 'exact', head: true }),
        supabase.from('companies').select('*', { count: 'exact', head: true }),
        supabase.from('notifications').select('*', { count: 'exact', head: true }),
      ])

      setStats({
        total_users: users.count || 0,
        total_projects: projects.count || 0,
        total_tasks: tasks.count || 0,
        total_companies: companies.count || 0,
        total_notifications: notifications.count || 0,
      })
    } catch (err) {
      console.error('Error fetching data:', err)
    } finally {
      setLoading(false)
    }
  }

  const saveSettings = async () => {
    setSaving(true)
    setError(null)
    try {
      const response = await fetch('/api/dashboard/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Error al guardar')
      }

      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar configuración')
    } finally {
      setSaving(false)
    }
  }

  const systemTiles = stats ? [
    { title: 'Usuarios', value: stats.total_users, tint: 'border-sky-200 bg-sky-50 text-sky-800 dark:border-sky-800 dark:bg-sky-950/40 dark:text-sky-100' },
    { title: 'Proyectos', value: stats.total_projects, tint: 'border-violet-200 bg-violet-50 text-violet-800 dark:border-violet-800 dark:bg-violet-950/40 dark:text-violet-100' },
    { title: 'Tareas', value: stats.total_tasks, tint: 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-100' },
    { title: 'Empresas', value: stats.total_companies, tint: 'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100' },
    { title: 'Notificaciones', value: stats.total_notifications, tint: 'border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-100' },
  ] : []

  return (
    <div className="space-y-5">
      <RegistroTitle
        title="Configuración"
        subtitle="Organización, valores por defecto y seguridad."
        action={
          <Button onClick={saveSettings} disabled={saving} className="rounded-xl">
            {saving ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Guardando...</>
            ) : saved ? (
              <><CheckCircle className="w-4 h-4" /> Guardado</>
            ) : (
              'Guardar'
            )}
          </Button>
        }
      />

      {error && (
        <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-[13px] text-rose-700 dark:border-rose-800 dark:bg-rose-950/30 dark:text-rose-200">{error}</p>
      )}

      <div className="grid gap-3 grid-cols-2 lg:grid-cols-5">
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="rounded-2xl border border-border bg-card px-4 py-4">
              <Skeleton className="mb-2 h-3 w-16" />
              <Skeleton className="h-7 w-10" />
            </div>
          ))
        ) : (
          systemTiles.map((tile) => (
            <div key={tile.title} className={`rounded-2xl border px-4 py-4 ${tile.tint}`}>
              <p className="text-[12px] font-medium opacity-80">{tile.title}</p>
              <p className="mt-2 text-[28px] font-semibold leading-none">{tile.value}</p>
            </div>
          ))
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <section className="rounded-2xl border border-sky-200 bg-sky-50/70 p-4 dark:border-sky-800 dark:bg-sky-950/20 sm:p-5">
          <h3 className="text-[17px] font-semibold tracking-tight text-foreground">Organización</h3>
          <p className="text-[13px] text-muted-foreground mt-0.5 mb-4">Información general de la organización</p>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="company_name">Nombre de la organización</Label>
              <Input
                id="company_name"
                value={settings.company_name}
                onChange={(e) => setSettings({ ...settings, company_name: e.target.value })}
                placeholder="Mi Empresa"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="company_email">Email de contacto</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground z-10" />
                <Input
                  id="company_email"
                  type="email"
                  value={settings.company_email || ''}
                  onChange={(e) => setSettings({ ...settings, company_email: e.target.value })}
                  placeholder="contacto@empresa.com"
                  className="pl-9"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="company_website">Sitio web</Label>
              <div className="relative">
                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground z-10" />
                <Input
                  id="company_website"
                  value={settings.company_website || ''}
                  onChange={(e) => setSettings({ ...settings, company_website: e.target.value })}
                  placeholder="https://www.empresa.com"
                  className="pl-9"
                />
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-violet-200 bg-violet-50/70 p-4 dark:border-violet-800 dark:bg-violet-950/20 sm:p-5">
          <h3 className="text-[17px] font-semibold tracking-tight text-foreground">Valores por defecto</h3>
          <p className="text-[13px] text-muted-foreground mt-0.5 mb-4">Configuración predeterminada para nuevos elementos</p>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Estado inicial de proyectos</Label>
              <Select
                value={settings.default_project_status}
                onValueChange={(v) => setSettings({ ...settings, default_project_status: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="planning">Planificación</SelectItem>
                  <SelectItem value="in_progress">En Progreso</SelectItem>
                  <SelectItem value="paused">Pausado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Prioridad inicial de tareas</Label>
              <Select
                value={settings.default_task_priority}
                onValueChange={(v) => setSettings({ ...settings, default_task_priority: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Baja</SelectItem>
                  <SelectItem value="medium">Media</SelectItem>
                  <SelectItem value="high">Alta</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-amber-200 bg-amber-50/70 p-4 dark:border-amber-800 dark:bg-amber-950/20 sm:p-5">
          <h3 className="text-[17px] font-semibold tracking-tight text-foreground">Notificaciones</h3>
          <p className="text-[13px] text-muted-foreground mt-0.5 mb-4">Retención y tiempo real</p>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="retention_days">Retención de notificaciones (días)</Label>
              <Input
                id="retention_days"
                type="number"
                min={1}
                max={90}
                value={settings.notifications_retention_days}
                onChange={(e) => setSettings({ ...settings, notifications_retention_days: parseInt(e.target.value) || 15 })}
              />
              <p className="text-[12px] text-muted-foreground">
                Las notificaciones se eliminan automáticamente después de este período
              </p>
            </div>
            <div className="rounded-2xl px-3 py-3 bg-blue-50/80 dark:bg-blue-900/20">
              <p className="text-[13px] text-blue-700 dark:text-blue-400">
                Supabase Realtime está habilitado para notificaciones y comentarios.
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4 dark:border-emerald-800 dark:bg-emerald-950/20 sm:p-5">
          <h3 className="text-[17px] font-semibold tracking-tight text-foreground">Seguridad</h3>
          <p className="text-[13px] text-muted-foreground mt-0.5 mb-4">Acceso y políticas del sistema</p>
          <div className="space-y-1">
            {[
              { title: 'Registro público', description: 'Permitir que usuarios se registren solos', status: 'Deshabilitado', on: false },
              { title: 'Verificación de email', description: 'Requerir verificación al registrarse', status: 'Habilitado', on: true },
              { title: 'Row Level Security (RLS)', description: 'Políticas de seguridad en base de datos', status: 'Activo', on: true },
            ].map((item) => (
              <div key={item.title} className="flex items-center justify-between gap-3 rounded-2xl px-3 py-3">
                <div className="min-w-0">
                  <p className="text-[14px] font-medium text-foreground">{item.title}</p>
                  <p className="text-[12px] text-muted-foreground mt-0.5">{item.description}</p>
                </div>
                <span className={`text-[11px] font-semibold rounded-full px-2.5 py-0.5 flex-shrink-0 ${
                  item.on
                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                    : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                }`}>
                  {item.status}
                </span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
