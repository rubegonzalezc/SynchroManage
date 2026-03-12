'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Mail, Lock, ArrowRight, ArrowLeft, Loader2, AlertCircle, CheckCircle, KeyRound } from 'lucide-react'

type Step = 1 | 2 | 3

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<Step>(1)
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [mounted, setMounted] = useState(false)
  const router = useRouter()

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleRequestCode = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const res = await fetch('/api/auth/password-reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Error al enviar el código de verificación')
        setLoading(false)
        return
      }

      setStep(2)
    } catch {
      setError('Error de conexión. Inténtalo de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const res = await fetch('/api/auth/password-reset/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Código inválido o expirado')
        setLoading(false)
        return
      }

      setStep(3)
    } catch {
      setError('Error de conexión. Inténtalo de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  const handleResetPassword = async (e: React.FormEvent) => {
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

    try {
      const res = await fetch('/api/auth/password-reset/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code, password }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Error al cambiar la contraseña')
        setLoading(false)
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

  const stepTitles: Record<Step, string> = {
    1: 'Recuperar Contraseña',
    2: 'Verificar Código',
    3: 'Nueva Contraseña',
  }

  const stepDescriptions: Record<Step, string> = {
    1: 'Ingresa tu correo electrónico para recibir un código de verificación',
    2: `Ingresa el código de 6 dígitos enviado a ${email}`,
    3: 'Establece tu nueva contraseña',
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
              {stepTitles[step]}
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              {stepDescriptions[step]}
            </CardDescription>

            {/* Step indicator */}
            <div className="flex items-center justify-center gap-2 mt-4">
              {([1, 2, 3] as Step[]).map((s) => (
                <div
                  key={s}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    s === step
                      ? 'w-8 bg-primary'
                      : s < step
                        ? 'w-4 bg-primary/50'
                        : 'w-4 bg-muted'
                  }`}
                />
              ))}
            </div>
          </CardHeader>

          <CardContent>
            {error && (
              <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400 px-4 py-3 rounded-xl text-sm mb-5 animate-shake">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {error}
              </div>
            )}

            {success && (
              <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-600 dark:bg-green-900/20 dark:border-green-800 dark:text-green-400 px-4 py-3 rounded-xl text-sm mb-5">
                <CheckCircle className="w-4 h-4 shrink-0" />
                Contraseña actualizada correctamente. Redirigiendo al inicio de sesión...
              </div>
            )}

            {/* Step 1: Email form */}
            {step === 1 && (
              <form onSubmit={handleRequestCode} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-muted-foreground text-xs ml-1">
                    Correo electrónico
                  </Label>
                  <div className="relative group">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-foreground transition-colors" />
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      placeholder="tu@email.com"
                      disabled={loading}
                      className="pl-10 bg-muted/50 border-border text-foreground placeholder:text-muted-foreground focus:border-ring focus:ring-ring transition-all"
                    />
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
                      Enviando código...
                    </>
                  ) : (
                    <>
                      Enviar Código
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
              </form>
            )}

            {/* Step 2: Verification code form */}
            {step === 2 && (
              <form onSubmit={handleVerifyCode} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="code" className="text-muted-foreground text-xs ml-1">
                    Código de verificación
                  </Label>
                  <div className="relative group">
                    <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-foreground transition-colors" />
                    <Input
                      id="code"
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]{6}"
                      maxLength={6}
                      value={code}
                      onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      required
                      placeholder="000000"
                      disabled={loading}
                      className="pl-10 bg-muted/50 border-border text-foreground placeholder:text-muted-foreground focus:border-ring focus:ring-ring transition-all text-center text-lg tracking-[0.3em] font-mono"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={loading || code.length !== 6}
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium shadow-lg shadow-primary/20 transition-all hover:shadow-xl hover:shadow-primary/30"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Verificando...
                    </>
                  ) : (
                    <>
                      Verificar Código
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>

                <button
                  type="button"
                  onClick={() => { setStep(1); setError(null); setCode('') }}
                  className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center justify-center gap-1"
                >
                  <ArrowLeft className="w-3 h-3" />
                  Volver a ingresar correo
                </button>
              </form>
            )}

            {/* Step 3: New password form */}
            {step === 3 && (
              <form onSubmit={handleResetPassword} className="space-y-5">
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
                      Cambiando contraseña...
                    </>
                  ) : (
                    'Cambiar Contraseña'
                  )}
                </Button>
              </form>
            )}

            {/* Link back to login */}
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

      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-slate-300/50 dark:via-slate-700/50 to-transparent" />
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-slate-200/50 dark:via-slate-800/50 to-transparent" />
    </div>
  )
}
