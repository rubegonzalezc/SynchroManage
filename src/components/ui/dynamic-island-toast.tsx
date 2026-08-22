'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { createPortal } from 'react-dom'
import { AlertTriangle, CheckCircle2, GitBranch, Info } from 'lucide-react'
import { cn } from '@/lib/utils'
import { isDependencyBlockedMessage, isOpenBugsBlockedMessage } from '@/lib/utils/api-error'

type ToastVariant = 'error' | 'success' | 'info'

interface ToastState {
  id: number
  message: string
  variant: ToastVariant
  title?: string
}

interface DynamicIslandToastContextValue {
  showToast: (message: string, options?: { variant?: ToastVariant; title?: string }) => void
  showError: (message: string, title?: string) => void
  showSuccess: (message: string, title?: string) => void
}

const DynamicIslandToastContext = createContext<DynamicIslandToastContextValue | null>(null)

function getToastMeta(message: string, variant: ToastVariant, title?: string) {
  if (isDependencyBlockedMessage(message)) {
    return {
      title: title ?? 'Dependencia pendiente',
      Icon: GitBranch,
    }
  }

  if (isOpenBugsBlockedMessage(message)) {
    return {
      title: title ?? 'Bugs abiertos',
      Icon: AlertTriangle,
    }
  }

  if (variant === 'success') {
    return { title: title ?? 'Listo', Icon: CheckCircle2 }
  }

  if (variant === 'error') {
    return { title: title ?? 'No se pudo completar', Icon: AlertTriangle }
  }

  return { title: title ?? 'Aviso', Icon: Info }
}

export function DynamicIslandToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<ToastState | null>(null)
  const [visible, setVisible] = useState(false)
  const [mounted, setMounted] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const idRef = useRef(0)

  useEffect(() => {
    setMounted(true)
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])

  const dismiss = useCallback(() => {
    setVisible(false)
    window.setTimeout(() => setToast(null), 280)
  }, [])

  const showToast = useCallback((
    message: string,
    options?: { variant?: ToastVariant; title?: string }
  ) => {
    if (!message.trim()) return

    if (timerRef.current) clearTimeout(timerRef.current)

    idRef.current += 1
    setToast({
      id: idRef.current,
      message: message.trim(),
      variant: options?.variant ?? 'info',
      title: options?.title,
    })

    requestAnimationFrame(() => setVisible(true))
    timerRef.current = setTimeout(dismiss, 5000)
  }, [dismiss])

  const showError = useCallback((message: string, title?: string) => {
    showToast(message, { variant: 'error', title })
  }, [showToast])

  const showSuccess = useCallback((message: string, title?: string) => {
    showToast(message, { variant: 'success', title })
  }, [showToast])

  const meta = toast ? getToastMeta(toast.message, toast.variant, toast.title) : null
  const Icon = meta?.Icon ?? Info

  return (
    <DynamicIslandToastContext.Provider value={{ showToast, showError, showSuccess }}>
      {children}
      {mounted && toast && createPortal(
        <div
          className="pointer-events-none fixed inset-x-0 top-0 z-[9999] flex justify-center px-4"
          style={{ paddingTop: 'max(12px, env(safe-area-inset-top))' }}
        >
          <div
            role="alert"
            aria-live="assertive"
            className={cn(
              'pointer-events-auto w-full max-w-md transform transition-all duration-300 ease-out',
              visible
                ? 'translate-y-0 scale-100 opacity-100'
                : '-translate-y-3 scale-[0.96] opacity-0'
            )}
          >
            <div
              className={cn(
                'mx-auto flex items-start gap-3 rounded-[28px] px-4 py-3 shadow-2xl backdrop-blur-xl',
                'border border-white/10',
                toast.variant === 'success'
                  ? 'bg-[#101010]/92 text-white'
                  : toast.variant === 'error'
                    ? 'bg-[#101010]/94 text-white'
                    : 'bg-[#101010]/90 text-white'
              )}
            >
              <div
                className={cn(
                  'mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
                  toast.variant === 'success' && 'bg-emerald-500/20 text-emerald-300',
                  toast.variant === 'error' && (
                    isDependencyBlockedMessage(toast.message)
                      ? 'bg-amber-500/20 text-amber-300'
                      : isOpenBugsBlockedMessage(toast.message)
                        ? 'bg-red-500/20 text-red-300'
                        : 'bg-red-500/20 text-red-300'
                  ),
                  toast.variant === 'info' && 'bg-blue-500/20 text-blue-300'
                )}
              >
                <Icon className="h-4 w-4" />
              </div>

              <div className="min-w-0 flex-1 py-0.5">
                {meta?.title && (
                  <p className="text-[12px] font-semibold tracking-wide text-white/70 uppercase">
                    {meta.title}
                  </p>
                )}
                <p className="text-[14px] leading-snug text-white">
                  {toast.message}
                </p>
              </div>

              <button
                type="button"
                onClick={dismiss}
                className="mt-0.5 rounded-full px-2 py-1 text-[12px] font-medium text-white/55 transition-colors hover:text-white"
                aria-label="Cerrar aviso"
              >
                OK
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </DynamicIslandToastContext.Provider>
  )
}

export function useDynamicIslandToast() {
  const context = useContext(DynamicIslandToastContext)
  if (!context) {
    throw new Error('useDynamicIslandToast debe usarse dentro de DynamicIslandToastProvider')
  }
  return context
}
