'use client'

import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { 
  User, Mail, Shield, Calendar, Loader2, CheckCircle, 
  Key, AlertCircle, Camera, Upload
} from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { createClient } from '@/lib/supabase/client'

interface Profile {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  role: { name: string } | null
  created_at: string
}

const roleLabels: Record<string, string> = {
  admin: 'Administrador',
  pm: 'Project Manager',
  tech_lead: 'Tech Lead',
  developer: 'Desarrollador',
  stakeholder: 'Stakeholder',
}

const roleColors: Record<string, string> = {
  admin: 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800',
  pm: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800',
  tech_lead: 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800',
  developer: 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800',
  stakeholder: 'bg-cyan-100 text-cyan-700 border-cyan-200 dark:bg-cyan-900/30 dark:text-cyan-400 dark:border-cyan-800',
}

export default function ProfilePage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  
  // Form data
  const [fullName, setFullName] = useState('')
  
  // Avatar upload
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [avatarError, setAvatarError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  // Password change
  const [showPasswordForm, setShowPasswordForm] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [passwordSuccess, setPasswordSuccess] = useState(false)
  const [changingPassword, setChangingPassword] = useState(false)

  const supabase = createClient()

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: profileData } = await supabase
        .from('profiles')
        .select('*, role:roles(name)')
        .eq('id', user.id)
        .single()

      if (profileData) {
        setProfile({
          ...profileData,
          email: user.email || '',
        })
        setFullName(profileData.full_name || '')
      }
    } catch (err) {
      console.error('Error fetching profile:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveProfile = async () => {
    if (!profile) return
    setSaving(true)
    setError(null)

    try {
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          full_name: fullName,
          updated_at: new Date().toISOString(),
        })
        .eq('id', profile.id)

      if (updateError) throw updateError

      setProfile({ ...profile, full_name: fullName })
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  const handleAvatarClick = () => {
    fileInputRef.current?.click()
  }

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !profile) return

    // Validar tipo de archivo
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      setAvatarError('Solo se permiten imágenes (JPG, PNG, GIF, WebP)')
      return
    }

    // Validar tamaño (máximo 2MB)
    const maxSize = 2 * 1024 * 1024
    if (file.size > maxSize) {
      setAvatarError('La imagen no puede superar los 2MB')
      return
    }

    setUploadingAvatar(true)
    setAvatarError(null)

    try {
      // Generar nombre único para el archivo
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}.${fileExt}`
      const filePath = `profiles/${profile.id}/${fileName}`

      // Si ya tiene avatar, eliminar el anterior
      if (profile.avatar_url) {
        const oldPath = profile.avatar_url.split('/uploads/')[1]
        if (oldPath) {
          await supabase.storage.from('uploads').remove([oldPath])
        }
      }

      // Subir nueva imagen
      const { error: uploadError } = await supabase.storage
        .from('uploads')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true,
        })

      if (uploadError) throw uploadError

      // Obtener URL pública
      const { data: { publicUrl } } = supabase.storage
        .from('uploads')
        .getPublicUrl(filePath)

      // Actualizar perfil con nueva URL
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          avatar_url: publicUrl,
          updated_at: new Date().toISOString(),
        })
        .eq('id', profile.id)

      if (updateError) throw updateError

      // Actualizar estado local
      setProfile({ ...profile, avatar_url: publicUrl })
    } catch (err) {
      console.error('Error uploading avatar:', err)
      setAvatarError(err instanceof Error ? err.message : 'Error al subir imagen')
    } finally {
      setUploadingAvatar(false)
      // Limpiar input para permitir subir la misma imagen de nuevo
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleChangePassword = async () => {
    setPasswordError(null)
    setPasswordSuccess(false)

    if (!currentPassword) {
      setPasswordError('Debes ingresar tu contraseña actual')
      return
    }

    if (newPassword.length < 6) {
      setPasswordError('La nueva contraseña debe tener al menos 6 caracteres')
      return
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('Las contraseñas no coinciden')
      return
    }

    setChangingPassword(true)

    try {
      // Primero verificar la contraseña actual re-autenticando
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: profile!.email,
        password: currentPassword,
      })

      if (signInError) {
        throw new Error('La contraseña actual es incorrecta')
      }

      // Si la contraseña actual es correcta, actualizar a la nueva
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword
      })

      if (updateError) throw updateError

      setPasswordSuccess(true)
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setTimeout(() => {
        setShowPasswordForm(false)
        setPasswordSuccess(false)
      }, 2000)
    } catch (err) {
      setPasswordError(err instanceof Error ? err.message : 'Error al cambiar contraseña')
    } finally {
      setChangingPassword(false)
    }
  }

  const getInitials = (name: string | null, email: string) => {
    if (name) {
      return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    }
    return email.slice(0, 2).toUpperCase()
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('es-CL', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    })
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-8 w-36 mb-1" />
          <Skeleton className="h-4 w-52" />
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {/* Avatar card skeleton */}
          <div className="bg-card border border-border rounded-xl p-6">
            <div className="flex flex-col items-center gap-3">
              <Skeleton className="w-24 h-24 rounded-full" />
              <Skeleton className="h-8 w-28" />
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-6 w-24 rounded-full" />
              <Skeleton className="h-4 w-36 mt-2" />
            </div>
          </div>
          {/* Form card skeleton */}
          <div className="bg-card border border-border rounded-xl p-6 md:col-span-2 space-y-4">
            <Skeleton className="h-6 w-40 mb-1" />
            <Skeleton className="h-4 w-56" />
            <div className="space-y-2 pt-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-9 w-full" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-9 w-full" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-12" />
              <Skeleton className="h-10 w-full rounded-lg" />
            </div>
            <div className="flex justify-end pt-2">
              <Skeleton className="h-9 w-28 rounded-md" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-lg">
        Error al cargar el perfil
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <User className="w-6 h-6" /> Mi Perfil
        </h1>
        <p className="text-muted-foreground">Administra tu información personal</p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Tarjeta de perfil */}
        <Card className="md:col-span-1">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center">
              {/* Avatar con botón de upload */}
              <div className="relative group mb-4">
                <Avatar className="w-24 h-24">
                  <AvatarImage src={profile.avatar_url || undefined} />
                  <AvatarFallback className="bg-muted text-muted-foreground text-2xl">
                    {getInitials(profile.full_name, profile.email)}
                  </AvatarFallback>
                </Avatar>
                <button
                  onClick={handleAvatarClick}
                  disabled={uploadingAvatar}
                  className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer disabled:cursor-not-allowed"
                >
                  {uploadingAvatar ? (
                    <Loader2 className="w-6 h-6 text-white animate-spin" />
                  ) : (
                    <Camera className="w-6 h-6 text-white" />
                  )}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/gif,image/webp"
                  onChange={handleAvatarChange}
                  className="hidden"
                />
              </div>
              
              {avatarError && (
                <p className="text-xs text-red-500 dark:text-red-400 mb-2">{avatarError}</p>
              )}
              
              <Button
                variant="ghost"
                size="sm"
                onClick={handleAvatarClick}
                disabled={uploadingAvatar}
                className="mb-3 text-muted-foreground hover:text-foreground"
              >
                <Upload className="w-4 h-4 mr-2" />
                {uploadingAvatar ? 'Subiendo...' : 'Cambiar foto'}
              </Button>
              
              <h2 className="text-xl font-semibold text-foreground">
                {profile.full_name || 'Sin nombre'}
              </h2>
              <p className="text-sm text-muted-foreground mb-3">{profile.email}</p>
              <Badge variant="outline" className={roleColors[profile.role?.name || ''] || ''}>
                {roleLabels[profile.role?.name || ''] || 'Sin rol'}
              </Badge>
              <div className="flex items-center gap-2 mt-4 text-sm text-muted-foreground">
                <Calendar className="w-4 h-4" />
                Miembro desde {formatDate(profile.created_at)}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Formulario de edición */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="w-5 h-5" /> Información Personal
            </CardTitle>
            <CardDescription>Actualiza tu información de perfil</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Correo Electrónico</Label>
              <Input
                id="email"
                type="email"
                value={profile.email}
                disabled
                className="bg-muted"
              />
              <p className="text-xs text-muted-foreground">El correo no se puede modificar</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="full_name">Nombre Completo</Label>
              <Input
                id="full_name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Tu nombre completo"
              />
            </div>

            <div className="space-y-2">
              <Label>Rol</Label>
              <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                <Shield className="w-4 h-4 text-muted-foreground" />
                <span className="text-foreground">
                  {roleLabels[profile.role?.name || ''] || 'Sin rol'}
                </span>
                <span className="text-xs text-muted-foreground">(No editable)</span>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button 
                onClick={handleSaveProfile} 
                disabled={saving}
              >
                {saving ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Guardando...</>
                ) : saved ? (
                  <><CheckCircle className="w-4 h-4 mr-2" /> Guardado</>
                ) : (
                  'Guardar Cambios'
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Cambiar contraseña */}
        <Card className="md:col-span-3">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="w-5 h-5" /> Seguridad
            </CardTitle>
            <CardDescription>Gestiona tu contraseña</CardDescription>
          </CardHeader>
          <CardContent>
            {!showPasswordForm ? (
              <Button 
                variant="outline" 
                onClick={() => setShowPasswordForm(true)}
              >
                <Key className="w-4 h-4 mr-2" /> Cambiar Contraseña
              </Button>
            ) : (
              <div className="space-y-4 max-w-md">
                {passwordError && (
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" /> {passwordError}
                  </div>
                )}
                {passwordSuccess && (
                  <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-600 dark:text-green-400 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" /> Contraseña actualizada correctamente
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="current_password">Contraseña Actual</Label>
                  <Input
                    id="current_password"
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Tu contraseña actual"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="new_password">Nueva Contraseña</Label>
                  <Input
                    id="new_password"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirm_password">Confirmar Contraseña</Label>
                  <Input
                    id="confirm_password"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repite la contraseña"
                  />
                </div>

                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowPasswordForm(false)
                      setPasswordError(null)
                      setNewPassword('')
                      setConfirmPassword('')
                    }}
                    disabled={changingPassword}
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleChangePassword}
                    disabled={changingPassword || !currentPassword || !newPassword || !confirmPassword}
                  >
                    {changingPassword ? (
                      <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Cambiando...</>
                    ) : (
                      'Cambiar Contraseña'
                    )}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
