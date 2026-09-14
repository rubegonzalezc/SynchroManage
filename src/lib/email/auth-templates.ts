import { renderEmailLayout } from './layout'

interface AuthActionEmailParams {
  title: string
  greeting?: string
  body: string
  actionUrl: string
  actionLabel: string
  footerNote?: string
  baseSiteUrl?: string
}

export function renderAuthActionEmail({
  title,
  greeting = 'Hola,',
  body,
  actionUrl,
  actionLabel,
  footerNote = 'Si no solicitaste este correo, puedes ignorarlo con seguridad.',
  baseSiteUrl,
}: AuthActionEmailParams): string {
  return renderEmailLayout({
    title,
    greeting,
    body,
    actionUrl,
    actionLabel,
    footerNote,
    showFallbackLink: true,
    showNotice: true,
    disclaimerText:
      'Este es un correo automático de seguridad. No respondas a este mensaje.',
    baseSiteUrl,
  })
}
