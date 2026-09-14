import { getEmailAssetUrls } from './assets'

const FONT = "'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif"

export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export interface EmailLayoutParams {
  title: string
  greeting?: string
  body: string
  actionUrl?: string
  actionLabel?: string
  extraContentHtml?: string
  footerNote?: string
  showFallbackLink?: boolean
  showNotice?: boolean
  disclaimerText?: string
  baseSiteUrl?: string
}

export function renderEmailLayout({
  title,
  greeting = 'Hola,',
  body,
  actionUrl,
  actionLabel,
  extraContentHtml = '',
  footerNote,
  showFallbackLink = Boolean(actionUrl),
  showNotice = Boolean(footerNote),
  disclaimerText = 'Este es un correo automático de SynchroManage. No respondas a este mensaje.',
  baseSiteUrl,
}: EmailLayoutParams): string {
  const { logoUrl, iconUrl, poweredByUrl, appUrl } = getEmailAssetUrls(baseSiteUrl)
  const year = new Date().getFullYear()

  const ctaBlock =
    actionUrl && actionLabel
      ? `
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 24px 0;">
                      <tr>
                        <td align="center" style="border-radius:12px;background-color:#2563eb;background-image:linear-gradient(135deg,#2563eb,#1d4ed8);">
                          <a href="${actionUrl}" target="_blank" style="display:block;padding:16px 28px;font-size:16px;font-weight:700;color:#ffffff;text-decoration:none;font-family:${FONT};border-radius:12px;">
                            ${actionLabel}
                          </a>
                        </td>
                      </tr>
                    </table>`
      : ''

  const fallbackBlock =
    showFallbackLink && actionUrl
      ? `
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 24px 0;background-color:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;">
                      <tr>
                        <td style="padding:16px 18px;">
                          <p style="margin:0 0 8px 0;font-size:13px;line-height:1.5;color:#64748b;font-family:${FONT};">
                            Si el botón no funciona, copia y pega este enlace en tu navegador:
                          </p>
                          <p style="margin:0;font-size:12px;line-height:1.6;color:#2563eb;word-break:break-all;font-family:${FONT};">
                            <a href="${actionUrl}" style="color:#2563eb;text-decoration:underline;">${actionUrl}</a>
                          </p>
                        </td>
                      </tr>
                    </table>`
      : ''

  const noticeBlock =
    showNotice && footerNote
      ? `
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#fffbeb;border:1px solid #fde68a;border-radius:12px;">
                      <tr>
                        <td style="padding:14px 16px;">
                          <p style="margin:0;font-size:13px;line-height:1.6;color:#92400e;font-family:${FONT};">
                            ${footerNote}
                          </p>
                        </td>
                      </tr>
                    </table>`
      : ''

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="light">
  <meta name="supported-color-schemes" content="light">
  <title>${escapeHtml(title)} — SynchroManage</title>
</head>
<body style="margin:0;padding:0;background-color:#eef2f7;font-family:${FONT};">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#eef2f7;margin:0;padding:0;">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;border-collapse:separate;">
          <tr>
            <td style="font-size:0;line-height:0;height:8px;">&nbsp;</td>
          </tr>
          <tr>
            <td style="background-color:#ffffff;border-radius:16px;border:1px solid #dbe3ee;box-shadow:0 12px 40px rgba(15,23,42,0.08);overflow:hidden;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="center" style="background-color:#0f172a;background-image:linear-gradient(135deg,#0f172a 0%,#1e3a5f 55%,#1d4ed8 100%);padding:36px 28px 32px 28px;">
                    <img src="${logoUrl}" alt="SynchroManage" width="140" style="display:block;margin:0 auto 18px auto;max-width:140px;width:140px;height:auto;border:0;" />
                    <p style="margin:0;font-size:13px;line-height:1.5;color:#cbd5e1;font-family:${FONT};letter-spacing:0.04em;text-transform:uppercase;">Gestión de Proyectos Inteligente</p>
                  </td>
                </tr>
              </table>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="padding:36px 32px 8px 32px;">
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:20px;">
                      <tr>
                        <td style="width:48px;height:48px;border-radius:12px;background-color:#eff6ff;border:1px solid #bfdbfe;text-align:center;vertical-align:middle;">
                          <img src="${iconUrl}" alt="" width="28" height="28" style="display:block;margin:10px auto;border:0;" />
                        </td>
                        <td style="padding-left:14px;vertical-align:middle;">
                          <p style="margin:0;font-size:12px;line-height:1.4;color:#64748b;font-family:${FONT};text-transform:uppercase;letter-spacing:0.06em;">SynchroManage</p>
                          <p style="margin:4px 0 0 0;font-size:22px;line-height:1.25;color:#0f172a;font-weight:700;font-family:${FONT};">${title}</p>
                        </td>
                      </tr>
                    </table>
                    <p style="margin:0 0 14px 0;font-size:16px;line-height:1.6;color:#334155;font-family:${FONT};">${greeting}</p>
                    <p style="margin:0 0 28px 0;font-size:16px;line-height:1.7;color:#475569;font-family:${FONT};">${body}</p>
                    ${extraContentHtml}
                    ${ctaBlock}
                    ${fallbackBlock}
                    ${noticeBlock}
                  </td>
                </tr>
              </table>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="center" style="padding:28px 32px 32px 32px;background-color:#f8fafc;border-top:1px solid #e2e8f0;">
                    <img src="${poweredByUrl}" alt="Powered by SynchroDev" width="110" style="display:block;margin:0 auto 14px auto;max-width:110px;width:110px;height:auto;border:0;" />
                    <p style="margin:0 0 6px 0;font-size:12px;line-height:1.5;color:#94a3b8;font-family:${FONT};">
                      &copy; ${year} SynchroManage. Todos los derechos reservados.
                    </p>
                    <p style="margin:0;font-size:12px;line-height:1.5;color:#94a3b8;font-family:${FONT};">
                      <a href="${appUrl}" style="color:#64748b;text-decoration:none;">${appUrl.replace(/^https?:\/\//, '')}</a>
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:16px 8px 0 8px;text-align:center;">
              <p style="margin:0;font-size:11px;line-height:1.5;color:#94a3b8;font-family:${FONT};">
                ${disclaimerText}
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}
