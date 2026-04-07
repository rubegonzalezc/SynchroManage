'use client'

import { useEffect, useRef } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Home, ArrowLeft } from 'lucide-react'

export default function NotFound() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const COL_W = 18
    const FONT_SIZE = 14
    const chars = '404NOTFOUND01アイウエオカキクケコサシスセソ'

    let cols = Math.floor(window.innerWidth / COL_W)
    let drops: number[] = Array.from({ length: cols }, () => -Math.floor(Math.random() * 40))

    const handleResize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
      cols = Math.floor(canvas.width / COL_W)
      drops = Array.from({ length: cols }, () => -Math.floor(Math.random() * 40))
    }
    handleResize()
    window.addEventListener('resize', handleResize)

    // Speed
    const START_FPS = 60
    const END_FPS = 30
    const EASE_DURATION = 3000
    const startTime = performance.now()

    let last = 0
    let animId: number

    const draw = (ts: number) => {
      animId = requestAnimationFrame(draw)

      // Dynamic interval: fast start → smooth cruise
      const elapsed = Math.min(ts - startTime, EASE_DURATION)
      const t = elapsed / EASE_DURATION
      const fps = START_FPS + (END_FPS - START_FPS) * t
      const interval = 1000 / fps

      if (ts - last < interval) return
      last = ts

      const isDark = document.documentElement.classList.contains('dark')

      // Soft trail: semi-transparent fill creates natural motion blur
      ctx.fillStyle = isDark ? 'rgba(13,13,13,0.18)' : 'rgba(248,248,248,0.18)'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      ctx.font = `${FONT_SIZE}px "Geist Mono", monospace`
      ctx.textAlign = 'left'
      ctx.textBaseline = 'top'

      for (let i = 0; i < cols; i++) {
        const char = chars[Math.floor(Math.random() * chars.length)]
        const x = i * COL_W
        const y = drops[i] * FONT_SIZE

        // Head character: bright
        if (isDark) {
          ctx.fillStyle = 'rgba(240,240,240,0.95)'
        } else {
          ctx.fillStyle = 'rgba(30,30,30,0.90)'
        }
        ctx.fillText(char, x, y)

        // Advance drop
        drops[i]++
        if (drops[i] * FONT_SIZE > canvas.height && Math.random() > 0.975) {
          drops[i] = -Math.floor(Math.random() * 20)
        }
      }
    }

    animId = requestAnimationFrame(draw)

    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-background flex items-center justify-center">
      {/* Matrix canvas background */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none"
        style={{ filter: 'blur(1.3px)' }}
        aria-hidden="true"
      />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center text-center px-6 gap-6 max-w-md w-full">
        {/* Magnifier + 404 */}
        <div className="flex flex-col items-center gap-2 select-none">
          <div className="relative">
            {/* Magnifier SVG */}
            <svg
              width="96"
              height="96"
              viewBox="0 0 96 96"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="text-foreground opacity-90 animate-float-slow"
              aria-hidden="true"
            >
              <circle
                cx="40"
                cy="40"
                r="26"
                stroke="currentColor"
                strokeWidth="6"
                fill="none"
              />
              <line
                x1="59"
                y1="59"
                x2="82"
                y2="82"
                stroke="currentColor"
                strokeWidth="6"
                strokeLinecap="round"
              />
              {/* Question mark inside lens */}
              <text
                x="40"
                y="47"
                textAnchor="middle"
                fontSize="22"
                fontWeight="700"
                fill="currentColor"
                fontFamily="Geist Sans, sans-serif"
              >
                ?
              </text>
            </svg>
          </div>

          <h1 className="text-8xl font-bold tracking-tighter text-foreground leading-none">
            404
          </h1>
        </div>

        {/* Text */}
        <div className="flex flex-col gap-2">
          <p className="text-xl font-semibold text-foreground">
            Página no encontrada
          </p>
          <p className="text-sm text-muted-foreground">
            La ruta que buscas no existe o fue movida. Verifica la URL o regresa al inicio.
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <Button asChild variant="default" className="gap-2">
            <Link href="/dashboard">
              <Home className="size-4" />
              Ir al Dashboard
            </Link>
          </Button>
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => window.history.back()}
          >
            <ArrowLeft className="size-4" />
            Volver atrás
          </Button>
        </div>
      </div>
    </div>
  )
}
