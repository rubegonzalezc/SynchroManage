'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { resetPassword } from '@/lib/auth/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Lock, Loader2, AlertCircle, CheckCircle, ArrowLeft } from 'lucide-react'

function ResetPasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')
  const errorParam = searchParams.get('error')

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(
    errorParam === 'INVALID_TOKEN' ? 'El enlace es inválido o ha expirado. Solicita uno nuevo.' : null
  )
  const [success, setSuccess] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!token) {
      setError('El enlace es inválido o ha expirado. Solicita uno nuevo.')
      return
    }

    if (password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres')
      return
    }

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden')
      return
    }

    setLoading(true)

    try {
      const { error: resetError } = await resetPassword({
        newPassword: password,
        token,
      })

      if (resetError) {
        setError(resetError.message || 'No se pudo restablecer la contraseña')
        return
      }

      setSuccess(true)
      setTimeout(() => {
        router.push('/login')
      }, 2500)
    } catch {
      setError('Error de conexión. Inténtalo de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  const invalidLink = !token || errorParam === 'INVALID_TOKEN'

  return (
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
            Nueva Contraseña
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            {success
              ? 'Contraseña actualizada correctamente'
              : 'Establece tu nueva contraseña de acceso'}
          </CardDescription>
        </CardHeader>

        <CardContent>
          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400 px-4 py-3 rounded-xl text-sm mb-5">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          {success && (
            <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-600 dark:bg-green-900/20 dark:border-green-800 dark:text-green-400 px-4 py-3 rounded-xl text-sm mb-5">
              <CheckCircle className="w-4 h-4 shrink-0" />
              Redirigiendo al inicio de sesión...
            </div>
          )}

          {invalidLink ? (
            <div className="space-y-4 text-center">
              <p className="text-sm text-muted-foreground">
                Solicita un nuevo enlace de recuperación para continuar.
              </p>
              <Button asChild className="w-full">
                <Link href="/auth/forgot-password">Solicitar nuevo enlace</Link>
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-muted-foreground text-xs ml-1">
                    Nueva contraseña
                  </Label>
                  <div className="relative group">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-foreground transition-colors" />
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={8}
                      placeholder="Mínimo 8 caracteres"
                      disabled={loading || success}
                      className="pl-10 bg-muted/50 border-border text-foreground placeholder:text-muted-foreground focus:border-ring focus:ring-ring transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-muted-foreground text-xs ml-1">
                    Confirmar contraseña
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
                  'Cambiar contraseña'
                )}
              </Button>
            </form>
          )}

          <div className="mt-6 pt-6 border-t border-border text-center">
            <Link
              href="/login"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1"
            >
              <ArrowLeft className="w-3 h-3" />
              Volver al inicio de sesión
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center">
      <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.02)_1px,transparent_1px)] dark:bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:40px_40px]" />
      <div className="absolute top-0 -left-40 w-[500px] h-[500px] bg-blue-100/50 dark:bg-blue-900/20 rounded-full blur-[100px]" />
      <div className="absolute bottom-0 -right-40 w-[500px] h-[500px] bg-indigo-100/50 dark:bg-indigo-900/20 rounded-full blur-[100px]" />

      <Suspense fallback={<div className="text-muted-foreground">Cargando...</div>}>
        <ResetPasswordForm />
      </Suspense>
    </div>
  )
}
