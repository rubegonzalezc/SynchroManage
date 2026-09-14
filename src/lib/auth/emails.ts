import { sendResendEmail } from '@/lib/email/resend'
import { renderAuthActionEmail } from '@/lib/email/auth-templates'

const APP_NAME = 'SynchroManage'

export async function sendAuthVerificationEmail(email: string, url: string) {
  const html = renderAuthActionEmail({
    title: 'Verifica tu correo',
    body: `Confirma tu dirección de correo para activar tu cuenta en ${APP_NAME} y acceder a tus proyectos.`,
    actionUrl: url,
    actionLabel: 'Verificar correo',
    footerNote: 'Este enlace expira en breve. Si no creaste una cuenta, ignora este mensaje.',
  })

  await sendResendEmail({
    to: email,
    subject: `Verifica tu correo en ${APP_NAME}`,
    html,
  })
}

export async function sendAuthResetPasswordEmail(
  email: string,
  url: string,
  recipientName?: string | null
) {
  const html = renderAuthActionEmail({
    title: 'Restablecer contraseña',
    greeting: recipientName ? `Hola ${recipientName},` : 'Hola,',
    body: 'Recibimos una solicitud para restablecer tu contraseña. Usa el botón de abajo para elegir una nueva. El enlace expira en 1 hora.',
    actionUrl: url,
    actionLabel: 'Restablecer contraseña',
    footerNote: 'Si no solicitaste este cambio, tu contraseña actual seguirá siendo válida.',
  })

  await sendResendEmail({
    to: email,
    subject: `Restablece tu contraseña en ${APP_NAME}`,
    html,
  })
}
