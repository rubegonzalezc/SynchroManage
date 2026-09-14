/**
 * Envía un correo de prueba con plantilla auth + logos inline (cid:).
 *
 * Uso:
 *   node --env-file=.env.local scripts/send-test-resend-email.mjs
 */

import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { Resend } from 'resend'

const CID = {
  logo: 'sm-logo',
  icon: 'sm-icon',
  poweredBy: 'sm-powered-by',
}

function loadEnvLocal() {
  try {
    const content = readFileSync(resolve(process.cwd(), '.env.local'), 'utf8')
    for (const line of content.split(/\r?\n/)) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) continue
      const eq = trimmed.indexOf('=')
      if (eq === -1) continue
      const key = trimmed.slice(0, eq).trim()
      let value = trimmed.slice(eq + 1).trim()
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1)
      }
      if (!process.env[key]) process.env[key] = value
    }
  } catch {
    // ignore
  }
}

function getAssetBase() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, '')
  if (supabaseUrl) {
    return `${supabaseUrl}/storage/v1/object/public/uploads/email`
  }
  return (process.env.EMAIL_ASSETS_BASE_URL || 'https://synchrodev.cl').replace(/\/$/, '')
}

async function main() {
  loadEnvLocal()

  const to = process.argv[2] || 'ra.gonzalez.c@hotmail.com'
  const apiKey = process.env.RESEND_API_KEY
  const from = process.env.RESEND_FROM_EMAIL || 'SynchroManage <no-reply@synchrodev.cl>'
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL || 'https://synchrodev.cl').replace(/\/$/, '')
  const base = getAssetBase()

  if (!apiKey) {
    console.error('RESEND_API_KEY no está configurada')
    process.exit(1)
  }

  console.log('Adjuntos inline desde:', base)

  const html = `<!DOCTYPE html>
<html lang="es"><body style="margin:0;background:#eef2f7;font-family:Segoe UI,Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#eef2f7;padding:32px 16px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background:#fff;border-radius:16px;border:1px solid #dbe3ee;overflow:hidden;">
<tr><td align="center" style="background:linear-gradient(135deg,#0f172a,#1e3a5f,#1d4ed8);padding:36px 28px;">
<img src="cid:${CID.logo}" alt="SynchroManage" width="140" style="display:block;margin:0 auto 16px;border:0;" />
<p style="margin:0;color:#cbd5e1;font-size:13px;letter-spacing:.04em;text-transform:uppercase;">Gestión de Proyectos Inteligente</p>
</td></tr>
<tr><td style="padding:36px 32px;">
<table cellpadding="0" cellspacing="0"><tr>
<td style="width:48px;height:48px;background:#eff6ff;border:1px solid #bfdbfe;border-radius:12px;text-align:center;">
<img src="cid:${CID.icon}" width="28" height="28" style="display:block;margin:10px auto;border:0;" />
</td>
<td style="padding-left:14px;">
<p style="margin:0;color:#64748b;font-size:12px;text-transform:uppercase;">SynchroManage</p>
<p style="margin:4px 0 0;color:#0f172a;font-size:22px;font-weight:700;">Correo de prueba</p>
</td></tr></table>
<p style="color:#334155;font-size:16px;">Hola,</p>
<p style="color:#475569;font-size:16px;">Si ves los logos dentro del correo (no solo en adjuntos), el inline cid: funciona correctamente.</p>
<table width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0;"><tr><td align="center" style="background:#2563eb;border-radius:12px;">
<a href="${appUrl}/login" style="display:block;padding:16px 28px;color:#fff;font-weight:700;text-decoration:none;">Ir a SynchroManage</a>
</td></tr></table>
</td></tr>
<tr><td align="center" style="padding:28px;background:#f8fafc;border-top:1px solid #e2e8f0;">
<img src="cid:${CID.poweredBy}" alt="Powered by" width="110" style="display:block;margin:0 auto 14px;border:0;" />
</td></tr>
</table>
</td></tr></table>
</body></html>`

  const resend = new Resend(apiKey)
  const { data, error } = await resend.emails.send({
    from,
    to,
    subject: 'Prueba logos inline (cid) — SynchroManage',
    html,
    attachments: [
      {
        path: `${base}/logotipo-v2.png`,
        filename: 'logotipo-v2.png',
        contentType: 'image/png',
        contentId: CID.logo,
      },
      {
        path: `${base}/isotipo-blanco.png`,
        filename: 'isotipo-blanco.png',
        contentType: 'image/png',
        contentId: CID.icon,
      },
      {
        path: `${base}/powered-by.png`,
        filename: 'powered-by.png',
        contentType: 'image/png',
        contentId: CID.poweredBy,
      },
    ],
  })

  if (error) {
    console.error('Error:', error)
    process.exit(1)
  }

  console.log('Correo enviado:', data?.id)
  console.log('Destinatario:', to)
}

main()
