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
import { Mail, Lock, ArrowRight, Loader2, AlertCircle, Clock, RefreshCw } from 'lucide-react'

// Generar partículas una sola vez fuera del componente
const generateParticles = () => {
  return [...Array(15)].map((_, i) => ({
    id: i,
    left: `${Math.random() * 100}%`,
    top: `${Math.random() * 100}%`,
    delay: `${Math.random() * 5}s`,
    duration: `${5 + Math.random() * 10}s`,
  }))
}

const PARTICLES = generateParticles()

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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-gray-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  // Mostrar página de enlace expirado
  if (linkExpired) {
    return (
      <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-slate-50 via-white to-gray-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 flex items-center justify-center">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.02)_1px,transparent_1px)] dark:bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:40px_40px]" />
        <div className="absolute top-0 -left-40 w-[500px] h-[500px] bg-amber-100/50 dark:bg-amber-900/20 rounded-full blur-[100px]" />
        <div className="absolute bottom-0 -right-40 w-[500px] h-[500px] bg-orange-100/50 dark:bg-orange-900/20 rounded-full blur-[100px]" />

        <div className="relative z-10 w-full max-w-md mx-4">
          <div className="absolute -inset-[1px] bg-gradient-to-r from-amber-200 via-orange-300 to-amber-200 dark:from-amber-700 dark:via-orange-600 dark:to-amber-700 rounded-2xl opacity-50 blur-sm" />
          <Card className="relative bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-slate-200/50 dark:border-slate-700/50 shadow-xl">
            <CardHeader className="text-center pt-8 pb-4">
              <div className="relative w-44 h-44 mx-auto mb-4">
                <Image
                  src="/logo/logotipo-v2.png"
                  alt="SynchroManage"
                  fill
                  className="object-contain drop-shadow-sm"
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
              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 text-sm text-amber-700 dark:text-amber-300">
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
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-slate-50 via-white to-gray-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 flex items-center justify-center">
      {/* Grid sutil */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.02)_1px,transparent_1px)] dark:bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:40px_40px]" />
      
      {/* Orbes de luz suaves */}
      <div className="absolute top-0 -left-40 w-[500px] h-[500px] bg-blue-100/50 dark:bg-blue-900/20 rounded-full blur-[100px]" />
      <div className="absolute bottom-0 -right-40 w-[500px] h-[500px] bg-indigo-100/50 dark:bg-indigo-900/20 rounded-full blur-[100px]" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-cyan-50/50 dark:bg-cyan-900/10 rounded-full blur-[120px]" />

      {/* Partículas sutiles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {mounted && PARTICLES.map((particle) => (
          <div
            key={particle.id}
            className="absolute w-1.5 h-1.5 bg-slate-300/50 dark:bg-slate-600/50 rounded-full animate-float"
            style={{
              left: particle.left,
              top: particle.top,
              animationDelay: particle.delay,
              animationDuration: particle.duration,
            }}
          />
        ))}
      </div>

      {/* Card principal */}
      <div 
        className={`relative z-10 w-full max-w-md mx-4 transition-all duration-1000 ${
          mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`}
      >
        {/* Sombra y borde sutil */}
        <div className="absolute -inset-[1px] bg-gradient-to-r from-slate-200 via-slate-300 to-slate-200 dark:from-slate-700 dark:via-slate-600 dark:to-slate-700 rounded-2xl opacity-50 blur-sm" />
        
        <Card className="relative bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-slate-200/50 dark:border-slate-700/50 shadow-xl shadow-slate-200/50 dark:shadow-slate-950/50">
          <CardHeader className="text-center pt-8 pb-4">
            {/* Logo */}
            <div className="relative w-44 h-44 mx-auto mb-4 animate-float-slow">
              <Image
                src="/logo/logotipo-v2.png"
                alt="SynchroManage"
                fill
                className="object-contain drop-shadow-sm"
              />
            </div>
            <CardTitle className="text-2xl font-bold text-foreground">
              SynchroManage
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              Gestión de Proyectos Inteligente
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleLogin} className="space-y-5">
              {error && (
                <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400 px-4 py-3 rounded-xl text-sm animate-shake">
                  <AlertCircle className="w-4 h-4" />
                  {error}
                </div>
              )}

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-muted-foreground text-xs ml-1">
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
                      className="pl-10 bg-background border-border text-foreground placeholder:text-muted-foreground focus:border-ring focus:ring-ring"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-muted-foreground text-xs ml-1">
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
                      className="pl-10 bg-background border-border text-foreground placeholder:text-muted-foreground focus:border-ring focus:ring-ring"
                    />
                  </div>
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium shadow-lg shadow-primary/20 transition-all hover:shadow-xl hover:shadow-primary/30"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Iniciando sesión...
                  </>
                ) : (
                  <>
                    Iniciar Sesión
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </form>

            <div className="mt-3 text-center">
              <Link
                href="/auth/forgot-password"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                ¿Olvidaste tu contraseña?
              </Link>
            </div>

            <div className="mt-6 pt-6 border-t border-border text-center">
              <div className="flex items-center justify-center gap-2">
                <Image
                  src="/logo/powered-by.png"
                  alt="Powered By"
                  width={120}
                  height={32}
                  className="opacity-70 hover:opacity-100 transition-opacity dark:invert"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Líneas decorativas sutiles */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-slate-300/50 dark:via-slate-700/50 to-transparent" />
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-slate-200/50 dark:via-slate-800/50 to-transparent" />
    </div>
  )
}
