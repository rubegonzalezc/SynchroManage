'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Calendar, Loader2, CheckCircle, AlertCircle, Camera, Upload } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { createClient } from '@/lib/supabase/client'
import { GlassPanel } from '@/components/ui/glass-panel'

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
  admin: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  pm: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  tech_lead: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  developer: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  stakeholder: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400',
}

export default function ProfilePage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)

  const [fullName, setFullName] = useState('')

  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [avatarError, setAvatarError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

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

    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      setAvatarError('Solo se permiten imágenes (JPG, PNG, GIF, WebP)')
      return
    }

    const maxSize = 2 * 1024 * 1024
    if (file.size > maxSize) {
      setAvatarError('La imagen no puede superar los 2MB')
      return
    }

    setUploadingAvatar(true)
    setAvatarError(null)

    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}.${fileExt}`
      const filePath = `profiles/${profile.id}/${fileName}`

      if (profile.avatar_url) {
        const oldPath = profile.avatar_url.split('/uploads/')[1]
        if (oldPath) {
          await supabase.storage.from('uploads').remove([oldPath])
        }
      }

      const { error: uploadError } = await supabase.storage
        .from('uploads')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true,
        })

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('uploads')
        .getPublicUrl(filePath)

      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          avatar_url: publicUrl,
          updated_at: new Date().toISOString(),
        })
        .eq('id', profile.id)

      if (updateError) throw updateError

      setProfile({ ...profile, avatar_url: publicUrl })
    } catch (err) {
      console.error('Error uploading avatar:', err)
      setAvatarError(err instanceof Error ? err.message : 'Error al subir imagen')
    } finally {
      setUploadingAvatar(false)
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
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: profile!.email,
        password: currentPassword,
      })

      if (signInError) {
        throw new Error('La contraseña actual es incorrecta')
      }

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
      <div className="space-y-5">
        <div>
          <Skeleton className="h-8 w-36 mb-2" />
          <Skeleton className="h-4 w-52" />
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <GlassPanel>
            <div className="flex flex-col items-center gap-3 py-4">
              <Skeleton className="w-24 h-24 rounded-full" />
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-40" />
            </div>
          </GlassPanel>
          <GlassPanel className="md:col-span-2">
            <Skeleton className="h-5 w-40 mb-4" />
            <Skeleton className="h-9 w-full mb-3" />
            <Skeleton className="h-9 w-full" />
          </GlassPanel>
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <GlassPanel>
        <p className="text-[14px] text-red-600 dark:text-red-400">Error al cargar el perfil</p>
      </GlassPanel>
    )
  }

  const roleName = profile.role?.name || ''

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-[28px] font-semibold tracking-tight text-foreground leading-tight">Mi perfil</h1>
          <p className="text-[15px] text-muted-foreground mt-1">Administra tu información personal</p>
        </div>
        <Button onClick={handleSaveProfile} disabled={saving}>
          {saving ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Guardando...</>
          ) : saved ? (
            <><CheckCircle className="w-4 h-4" /> Guardado</>
          ) : (
            'Guardar'
          )}
        </Button>
      </div>

      {error && (
        <GlassPanel padding={2}>
          <p className="text-[13px] text-red-600 dark:text-red-400">{error}</p>
        </GlassPanel>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        <GlassPanel>
          <div className="flex flex-col items-center text-center">
            <div className="relative group mb-4">
              <Avatar className="w-24 h-24">
                <AvatarImage src={profile.avatar_url || undefined} />
                <AvatarFallback className="text-2xl">
                  {getInitials(profile.full_name, profile.email)}
                </AvatarFallback>
              </Avatar>
              <button
                type="button"
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
              <p className="text-[12px] text-red-500 mb-2">{avatarError}</p>
            )}

            <Button
              variant="ghost"
              size="sm"
              onClick={handleAvatarClick}
              disabled={uploadingAvatar}
              className="mb-3 text-muted-foreground rounded-full"
            >
              <Upload className="w-4 h-4" />
              {uploadingAvatar ? 'Subiendo...' : 'Cambiar foto'}
            </Button>

            <h2 className="text-[17px] font-semibold tracking-tight text-foreground">
              {profile.full_name || 'Sin nombre'}
            </h2>
            <p className="text-[13px] text-muted-foreground mt-0.5 mb-3">{profile.email}</p>
            <span className={`text-[11px] font-semibold rounded-full px-2.5 py-0.5 ${roleColors[roleName] || 'bg-muted text-muted-foreground'}`}>
              {roleLabels[roleName] || 'Sin rol'}
            </span>
            <div className="flex items-center gap-1.5 mt-4 text-[12px] text-muted-foreground">
              <Calendar className="w-3.5 h-3.5" />
              Miembro desde {formatDate(profile.created_at)}
            </div>
          </div>
        </GlassPanel>

        <GlassPanel className="md:col-span-2">
          <h3 className="text-[17px] font-semibold tracking-tight text-foreground">Información personal</h3>
          <p className="text-[13px] text-muted-foreground mt-0.5 mb-4">Actualiza tu nombre. El correo y el rol no se pueden cambiar.</p>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Correo electrónico</Label>
              <Input
                id="email"
                type="email"
                value={profile.email}
                disabled
              />
              <p className="text-[12px] text-muted-foreground">El correo no se puede modificar</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="full_name">Nombre completo</Label>
              <Input
                id="full_name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Tu nombre completo"
              />
            </div>

            <div className="space-y-2">
              <Label>Rol</Label>
              <div className="flex items-center gap-2 rounded-2xl px-3 py-3 bg-black/[0.04] dark:bg-white/[0.06]">
                <span className="text-[14px] text-foreground">
                  {roleLabels[roleName] || 'Sin rol'}
                </span>
                <span className="text-[12px] text-muted-foreground">No editable</span>
              </div>
            </div>
          </div>
        </GlassPanel>

        <GlassPanel className="md:col-span-3">
          <h3 className="text-[17px] font-semibold tracking-tight text-foreground">Seguridad</h3>
          <p className="text-[13px] text-muted-foreground mt-0.5 mb-4">Cambia tu contraseña</p>

          {!showPasswordForm ? (
            <Button variant="outline" onClick={() => setShowPasswordForm(true)}>
              Cambiar contraseña
            </Button>
          ) : (
            <div className="space-y-4 max-w-md">
              {passwordError && (
                <div className="flex items-center gap-2 text-[13px] text-red-600 dark:text-red-400">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" /> {passwordError}
                </div>
              )}
              {passwordSuccess && (
                <div className="flex items-center gap-2 text-[13px] text-green-600 dark:text-green-400">
                  <CheckCircle className="w-4 h-4 flex-shrink-0" /> Contraseña actualizada correctamente
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="current_password">Contraseña actual</Label>
                <Input
                  id="current_password"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Tu contraseña actual"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="new_password">Nueva contraseña</Label>
                <Input
                  id="new_password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm_password">Confirmar contraseña</Label>
                <Input
                  id="confirm_password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repite la contraseña"
                />
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowPasswordForm(false)
                    setPasswordError(null)
                    setCurrentPassword('')
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
                    <><Loader2 className="w-4 h-4 animate-spin" /> Cambiando...</>
                  ) : (
                    'Cambiar contraseña'
                  )}
                </Button>
              </div>
            </div>
          )}
        </GlassPanel>
      </div>
    </div>
  )
}
