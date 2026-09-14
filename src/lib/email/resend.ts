import { Resend } from 'resend'
import { resolveResendInlineImages } from './assets'

let client: Resend | null = null

export function getResendClient(): Resend | null {
  if (!process.env.RESEND_API_KEY) return null
  if (!client) client = new Resend(process.env.RESEND_API_KEY)
  return client
}

export function getFromEmail(): string {
  return process.env.RESEND_FROM_EMAIL || 'SynchroManage <no-reply@synchrodev.cl>'
}

export function getAppBaseUrl(): string {
  return process.env.BETTER_AUTH_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
}

export async function sendResendEmail(params: {
  to: string
  subject: string
  html: string
  /** Adjuntar logos como imágenes inline (cid:). Activado por defecto. */
  inlineImages?: boolean
}) {
  const resend = getResendClient()
  if (!resend) {
    throw new Error('RESEND_API_KEY no está configurada')
  }

  const inlineImages = params.inlineImages !== false
  const attachments = inlineImages ? resolveResendInlineImages() : undefined

  const { data, error } = await resend.emails.send({
    from: getFromEmail(),
    to: params.to,
    subject: params.subject,
    html: params.html,
    attachments,
  })

  if (error) {
    throw new Error(error.message || 'Error al enviar correo con Resend')
  }

  return data
}
