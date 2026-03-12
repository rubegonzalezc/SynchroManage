'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { 
  Settings, Bell, Palette, Shield, Database, 
  Loader2, CheckCircle, Building2, Mail, Globe
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

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
      // Cargar settings desde la API
      const settingsRes = await fetch('/api/dashboard/settings')
      if (settingsRes.ok) {
        const settingsData = await settingsRes.json()
        if (settingsData.settings) {
          setSettings(settingsData.settings)
        }
      }

      // Cargar estadísticas
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Settings className="w-6 h-6" /> Configuración
        </h1>
        <p className="text-muted-foreground">Administra la configuración del sistema</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Información de la Organización */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5" /> Organización
            </CardTitle>
            <CardDescription>Información general de la organización</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="company_name">Nombre de la Organización</Label>
              <Input
                id="company_name"
                value={settings.company_name}
                onChange={(e) => setSettings({ ...settings, company_name: e.target.value })}
                placeholder="Mi Empresa"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="company_email">Email de Contacto</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
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
              <Label htmlFor="company_website">Sitio Web</Label>
              <div className="relative">
                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="company_website"
                  value={settings.company_website || ''}
                  onChange={(e) => setSettings({ ...settings, company_website: e.target.value })}
                  placeholder="https://www.empresa.com"
                  className="pl-9"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Valores por Defecto */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="w-5 h-5" /> Valores por Defecto
            </CardTitle>
            <CardDescription>Configuración predeterminada para nuevos elementos</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
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
          </CardContent>
        </Card>

        {/* Notificaciones */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5" /> Notificaciones
            </CardTitle>
            <CardDescription>Configuración del sistema de notificaciones</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
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
              <p className="text-xs text-muted-foreground">
                Las notificaciones se eliminan automáticamente después de este período
              </p>
            </div>
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <p className="text-sm text-blue-700 dark:text-blue-400">
                <strong>Supabase Realtime</strong> está habilitado para notificaciones y comentarios en tiempo real.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Seguridad */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" /> Seguridad
            </CardTitle>
            <CardDescription>Configuración de seguridad y acceso</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div>
                <p className="font-medium text-foreground">Registro público</p>
                <p className="text-xs text-muted-foreground">Permitir que usuarios se registren solos</p>
              </div>
              <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800">
                Deshabilitado
              </Badge>
            </div>
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div>
                <p className="font-medium text-foreground">Verificación de email</p>
                <p className="text-xs text-muted-foreground">Requerir verificación al registrarse</p>
              </div>
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800">
                Habilitado
              </Badge>
            </div>
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div>
                <p className="font-medium text-foreground">Row Level Security (RLS)</p>
                <p className="text-xs text-muted-foreground">Políticas de seguridad en base de datos</p>
              </div>
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800">
                Activo
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Estadísticas del Sistema */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="w-5 h-5" /> Estadísticas del Sistema
            </CardTitle>
            <CardDescription>Información sobre el uso del sistema</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
              </div>
            ) : stats ? (
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <p className="text-2xl font-bold text-blue-700 dark:text-blue-400">{stats.total_users}</p>
                  <p className="text-xs text-blue-600 dark:text-blue-500">Usuarios</p>
                </div>
                <div className="text-center p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
                  <p className="text-2xl font-bold text-indigo-700 dark:text-indigo-400">{stats.total_projects}</p>
                  <p className="text-xs text-indigo-600 dark:text-indigo-500">Proyectos</p>
                </div>
                <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <p className="text-2xl font-bold text-green-700 dark:text-green-400">{stats.total_tasks}</p>
                  <p className="text-xs text-green-600 dark:text-green-500">Tareas</p>
                </div>
                <div className="text-center p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                  <p className="text-2xl font-bold text-amber-700 dark:text-amber-400">{stats.total_companies}</p>
                  <p className="text-xs text-amber-600 dark:text-amber-500">Empresas</p>
                </div>
                <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                  <p className="text-2xl font-bold text-purple-700 dark:text-purple-400">{stats.total_notifications}</p>
                  <p className="text-xs text-purple-600 dark:text-purple-500">Notificaciones</p>
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>

      {/* Botón Guardar */}
      <div className="flex items-center justify-between">
        {error && (
          <div className="text-sm text-red-600 dark:text-red-400">{error}</div>
        )}
        <div className="flex-1" />
        <Button 
          onClick={saveSettings} 
          disabled={saving}
        >
          {saving ? (
            <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Guardando...</>
          ) : saved ? (
            <><CheckCircle className="w-4 h-4 mr-2" /> Guardado</>
          ) : (
            'Guardar Configuración'
          )}
        </Button>
      </div>
    </div>
  )
}
