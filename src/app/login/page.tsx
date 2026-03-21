'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Mail, Lock, ArrowRight, Loader2, AlertCircle, Clock, RefreshCw, Sun, Moon, Monitor } from 'lucide-react'
import { useTheme } from '@/components/theme-provider'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [checkingSession, setCheckingSession] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)
  const [linkExpired, setLinkExpired] = useState(false)
  const router = useRouter()
  const supabase = createClient()
  const { theme, setTheme, resolvedTheme } = useTheme()

  useEffect(() => {
    setMounted(true)
    
    // Verificar si hay un token de invitación en el hash
    const handleInviteToken = async () => {
      const hash = window.location.hash

      // Detectar enlace expirado o inválido
      if (hash && (hash.includes('error_code=otp_expired') || hash.includes('error=access_denied'))) {
        setLinkExpired(true)
        setCheckingSession(false)
        return
      }

      if (hash && hash.includes('access_token') && hash.includes('type=invite')) {
        // Hay un token de invitación, redirigir a establecer contraseña
        router.push(`/auth/set-password${hash}`)
        return
      }

      // Verificar si ya hay sesión activa
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        // Ya tiene sesión, redirigir según rol
        const { data: profile } = await supabase
          .from('profiles')
          .select('role:roles(name)')
          .eq('id', session.user.id)
          .single()

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const roleName = (profile?.role as any)?.name as string | undefined
        redirectByRole(roleName)
        return
      }

      setCheckingSession(false)
    }

    handleInviteToken()
  }, [router, supabase])

  const redirectByRole = (roleName: string | undefined) => {
    // Todos los roles van al dashboard
    if (['admin', 'pm', 'tech_lead', 'developer', 'stakeholder'].includes(roleName || '')) {
      router.push('/dashboard')
    } else {
      router.push('/')
    }
    router.refresh()
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setError('Credenciales incorrectas')
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
      redirectByRole(roleName)
    } else {
      router.push('/')
      router.refresh()
    }
  }

  // Mostrar loading mientras verifica sesión
  if (checkingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  // Mostrar página de enlace expirado
  if (linkExpired) {
    return (
      <div className="min-h-screen relative flex items-center justify-center bg-background">
        {/* Theme Toggle - Posición fija */}
        <div className="fixed top-6 right-6 z-50">
          <div className="flex items-center gap-2 bg-card border border-border rounded-lg p-1 shadow-sm">
            <Button
              variant={theme === 'light' ? 'secondary' : 'ghost'}
              size="icon"
              className="h-8 w-8"
              onClick={() => setTheme('light')}
            >
              <Sun className="h-4 w-4" />
            </Button>
            <Button
              variant={theme === 'dark' ? 'secondary' : 'ghost'}
              size="icon"
              className="h-8 w-8"
              onClick={() => setTheme('dark')}
            >
              <Moon className="h-4 w-4" />
            </Button>
            <Button
              variant={theme === 'system' ? 'secondary' : 'ghost'}
              size="icon"
              className="h-8 w-8"
              onClick={() => setTheme('system')}
            >
              <Monitor className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="relative z-10 w-full max-w-md mx-4">
          <Card className="border-border shadow-lg">
            <CardHeader className="text-center pt-8 pb-4">
              <div className="relative w-32 h-32 mx-auto mb-4 transition-opacity duration-500">
                <Image
                  src={resolvedTheme === 'dark' ? '/logo/sm-icon-blanco.png' : '/logo/sm-icon-negro.png'}
                  alt="SynchroManage"
                  fill
                  className="object-contain"
                />
              </div>
              <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                <Clock className="w-8 h-8 text-amber-600 dark:text-amber-400" />
              </div>
              <CardTitle className="text-2xl font-bold text-foreground">
                Enlace Expirado
              </CardTitle>
              <CardDescription className="text-muted-foreground mt-2">
                El enlace de invitación ha expirado o ya no es válido. Los enlaces de invitación expiran después de 24 horas.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pb-8">
              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4 text-sm text-amber-700 dark:text-amber-300">
                <p className="font-medium mb-1">¿Qué puedes hacer?</p>
                <p>Contacta al administrador de tu equipo para que te reenvíe la invitación desde el panel de gestión de usuarios.</p>
              </div>
              <Button
                onClick={() => {
                  window.location.hash = ''
                  setLinkExpired(false)
                }}
                className="w-full"
                variant="outline"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Ir al inicio de sesión
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen relative flex items-center justify-center bg-background">
      {/* Grid sutil de fondo */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.02)_1px,transparent_1px)] dark:bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:40px_40px]" />
      
      {/* Theme Toggle - Posición fija */}
      <div className="fixed top-6 right-6 z-50">
        <div className="flex items-center gap-2 bg-card border border-border rounded-lg p-1 shadow-sm">
          <Button
            variant={theme === 'light' ? 'secondary' : 'ghost'}
            size="icon"
            className="h-8 w-8"
            onClick={() => setTheme('light')}
          >
            <Sun className="h-4 w-4" />
          </Button>
          <Button
            variant={theme === 'dark' ? 'secondary' : 'ghost'}
            size="icon"
            className="h-8 w-8"
            onClick={() => setTheme('dark')}
          >
            <Moon className="h-4 w-4" />
          </Button>
          <Button
            variant={theme === 'system' ? 'secondary' : 'ghost'}
            size="icon"
            className="h-8 w-8"
            onClick={() => setTheme('system')}
          >
            <Monitor className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Card principal */}
      <div 
        className={`relative z-10 w-full max-w-md mx-4 transition-all duration-700 ease-out ${
          mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        }`}
      >
        <Card className="border-border shadow-lg">
          <CardHeader className="text-center pt-8 pb-6 space-y-4">
            {/* Logo */}
            <div 
              className={`relative w-32 h-32 mx-auto transition-all duration-700 ease-out ${
                mounted ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
              }`}
            >
              <Image
                src={resolvedTheme === 'dark' ? '/logo/sm-icon-blanco.png' : '/logo/sm-icon-negro.png'}
                alt="SynchroManage"
                fill
                className="object-contain transition-opacity duration-300"
                priority
              />
            </div>
            <div 
              className={`transition-all duration-700 ease-out delay-100 ${
                mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
              }`}
            >
              <CardTitle className="text-2xl font-bold text-foreground">
                SynchroManage
              </CardTitle>
              <CardDescription className="text-muted-foreground mt-2">
                Gestión de Proyectos Inteligente
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="pb-8">
            <form onSubmit={handleLogin} className="space-y-6">
              <div 
                className={`space-y-5 transition-all duration-700 ease-out delay-200 ${
                  mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
                }`}
              >
                {error && (
                  <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400 px-4 py-3 rounded-lg text-sm animate-in fade-in slide-in-from-top-2 duration-300">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-medium text-foreground">
                      Correo electrónico
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                      <Input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        placeholder="tu@email.com"
                        className="pl-10 h-11 bg-background border-border transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-sm font-medium text-foreground">
                      Contraseña
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                      <Input
                        id="password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        placeholder="••••••••"
                        className="pl-10 h-11 bg-background border-border transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                      />
                    </div>
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full h-11 bg-primary hover:bg-primary/90 text-primary-foreground font-medium transition-all duration-200 hover:shadow-md"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Iniciando sesión...
                    </>
                  ) : (
                    <>
                      Iniciar Sesión
                      <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" />
                    </>
                  )}
                </Button>
              </div>
            </form>

              <div 
                className={`mt-4 text-center transition-all duration-700 ease-out delay-300 ${
                  mounted ? 'opacity-100' : 'opacity-0'
                }`}
              >
                <Link
                  href="/auth/forgot-password"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-200"
                >
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>

              <div 
                className={`mt-8 pt-6 border-t border-border transition-all duration-700 ease-out delay-400 ${
                  mounted ? 'opacity-100' : 'opacity-0'
                }`}
              >
                <div className="flex items-center justify-center">
                  <Image
                    src={resolvedTheme === 'dark' ? '/logo/powered-by-blanco.png' : '/logo/powered-by-negro.png'}
                    alt="Powered By"
                    width={180}
                    height={46}
                    className="opacity-60 hover:opacity-100 transition-opacity duration-300"
                  />
                </div>
              </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
