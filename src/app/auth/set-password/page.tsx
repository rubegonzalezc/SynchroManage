'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Lock, Loader2, AlertCircle, CheckCircle } from 'lucide-react'

export default function SetPasswordPage() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [mounted, setMounted] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    setMounted(true)
    
    // Procesar el token de invitación del hash
    const processInviteToken = async () => {
      const hash = window.location.hash
      if (hash && hash.includes('access_token')) {
        // Extraer el access_token del hash
        const params = new URLSearchParams(hash.substring(1))
        const accessToken = params.get('access_token')
        const refreshToken = params.get('refresh_token')

        if (accessToken && refreshToken) {
          // Establecer la sesión con los tokens
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          })

          if (error) {
            setError('Error al procesar la invitación. Por favor, solicita una nueva.')
          }
        }
      }
    }

    processInviteToken()
  }, [supabase])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden')
      return
    }

    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres')
      return
    }

    setLoading(true)

    const { error } = await supabase.auth.updateUser({ password })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    // Obtener el rol del usuario para redirigir
    const { data: { user } } = await supabase.auth.getUser()
    
    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role:roles(name)')
        .eq('id', user.id)
        .single()

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const roleName = (profile?.role as any)?.name as string | undefined

      setSuccess(true)
      setTimeout(() => {
        // Redirigir según el rol
        switch (roleName) {
          case 'admin':
            router.push('/admin')
            break
          case 'pm':
            router.push('/pm')
            break
          case 'tech_lead':
            router.push('/tech-lead')
            break
          case 'developer':
            router.push('/developer')
            break
          case 'stakeholder':
            router.push('/stakeholder')
            break
          default:
            router.push('/')
        }
        router.refresh()
      }, 2000)
    } else {
      setSuccess(true)
      setTimeout(() => {
        router.push('/')
        router.refresh()
      }, 2000)
    }
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-slate-50 via-white to-gray-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 flex items-center justify-center">
      <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.02)_1px,transparent_1px)] dark:bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:40px_40px]" />
      
      <div className="absolute top-0 -left-40 w-[500px] h-[500px] bg-blue-100/50 dark:bg-blue-900/20 rounded-full blur-[100px]" />
      <div className="absolute bottom-0 -right-40 w-[500px] h-[500px] bg-indigo-100/50 dark:bg-indigo-900/20 rounded-full blur-[100px]" />

      <div 
        className={`relative z-10 w-full max-w-md mx-4 transition-all duration-1000 ${
          mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`}
      >
        <div className="absolute -inset-[1px] bg-gradient-to-r from-slate-200 via-slate-300 to-slate-200 dark:from-slate-700 dark:via-slate-600 dark:to-slate-700 rounded-2xl opacity-50 blur-sm" />
        
        <Card className="relative bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-slate-200/50 dark:border-slate-700/50 shadow-xl shadow-slate-200/50 dark:shadow-slate-950/50">
          <CardHeader className="text-center pt-8 pb-4">
            <div className="relative w-32 h-32 mx-auto mb-4">
              <Image
                src="/logo/logotipo-v2.png"
                alt="SynchroManage"
                fill
                className="object-contain drop-shadow-sm"
              />
            </div>
            <CardTitle className="text-2xl font-bold text-foreground">
              Establece tu Contraseña
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              Crea una contraseña segura para tu cuenta
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400 px-4 py-3 rounded-xl text-sm">
                  <AlertCircle className="w-4 h-4" />
                  {error}
                </div>
              )}

              {success && (
                <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-600 dark:bg-green-900/20 dark:border-green-800 dark:text-green-400 px-4 py-3 rounded-xl text-sm">
                  <CheckCircle className="w-4 h-4" />
                  Contraseña establecida. Redirigiendo...
                </div>
              )}

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-muted-foreground text-xs ml-1">
                    Nueva Contraseña
                  </Label>
                  <div className="relative group">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-foreground transition-colors" />
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={6}
                      placeholder="Mínimo 6 caracteres"
                      disabled={loading || success}
                      className="pl-10 bg-muted/50 border-border text-foreground placeholder:text-muted-foreground focus:border-ring focus:ring-ring transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-muted-foreground text-xs ml-1">
                    Confirmar Contraseña
                  </Label>
                  <div className="relative group">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-foreground transition-colors" />
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      placeholder="Repite tu contraseña"
                      disabled={loading || success}
                      className="pl-10 bg-muted/50 border-border text-foreground placeholder:text-muted-foreground focus:border-ring focus:ring-ring transition-all"
                    />
                  </div>
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading || success}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium shadow-lg shadow-primary/20 transition-all hover:shadow-xl hover:shadow-primary/30"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  'Establecer Contraseña'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
