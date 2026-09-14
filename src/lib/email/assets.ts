import { readFileSync } from 'node:fs'
import { join } from 'node:path'

export const DEFAULT_EMAIL_ASSETS_URL = 'https://synchrodev.cl'

/** Content-IDs para imágenes inline (cid:) referenciadas en el HTML. */
export const EMAIL_CID = {
  logo: 'sm-logo',
  icon: 'sm-icon',
  poweredBy: 'sm-powered-by',
} as const

const logoCache = new Map<string, Buffer>()

function readLogoFile(filename: string): Buffer {
  if (logoCache.has(filename)) {
    return logoCache.get(filename)!
  }

  const filePath = join(process.cwd(), 'public', 'logo', filename)
  const buffer = readFileSync(filePath)
  logoCache.set(filename, buffer)
  return buffer
}

export interface ResendInlineImage {
  path?: string
  filename: string
  content?: string
  contentType: string
  contentId: string
}

/** Adjuntos inline para Resend: path remoto + contentId (camelCase). */
export function getResendInlineImages(): ResendInlineImage[] {
  const { logoUrl, iconUrl, poweredByUrl } = getEmailRemoteAssetUrls()

  return [
    {
      path: logoUrl,
      filename: 'logotipo-v2.png',
      contentType: 'image/png',
      contentId: EMAIL_CID.logo,
    },
    {
      path: iconUrl,
      filename: 'isotipo-blanco.png',
      contentType: 'image/png',
      contentId: EMAIL_CID.icon,
    },
    {
      path: poweredByUrl,
      filename: 'powered-by.png',
      contentType: 'image/png',
      contentId: EMAIL_CID.poweredBy,
    },
  ]
}

/** Fallback local (base64) si no hay URLs remotas disponibles. */
export function getResendInlineImagesFromDisk(): ResendInlineImage[] {
  return [
    {
      filename: 'logotipo-v2.png',
      content: readLogoFile('logotipo-v2.png').toString('base64'),
      contentType: 'image/png',
      contentId: EMAIL_CID.logo,
    },
    {
      filename: 'isotipo-blanco.png',
      content: readLogoFile('isotipo-blanco.png').toString('base64'),
      contentType: 'image/png',
      contentId: EMAIL_CID.icon,
    },
    {
      filename: 'powered-by.png',
      content: readLogoFile('powered-by.png').toString('base64'),
      contentType: 'image/png',
      contentId: EMAIL_CID.poweredBy,
    },
  ]
}

export function resolveResendInlineImages(): ResendInlineImage[] {
  const remote = getResendInlineImages()
  if (remote[0]?.path?.startsWith('https://')) {
    return remote
  }

  try {
    return getResendInlineImagesFromDisk()
  } catch {
    return remote
  }
}

/** URLs cid: para el HTML del correo (van junto con resolveResendInlineImages). */
export function getEmailCidUrls() {
  return {
    logoUrl: `cid:${EMAIL_CID.logo}`,
    iconUrl: `cid:${EMAIL_CID.icon}`,
    poweredByUrl: `cid:${EMAIL_CID.poweredBy}`,
    appUrl: getEmailAppUrl(),
  }
}

export function getEmailAppUrl(): string {
  const appUrl =
    process.env.BETTER_AUTH_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    DEFAULT_EMAIL_ASSETS_URL

  if (appUrl.includes('localhost') || appUrl.includes('127.0.0.1')) {
    return DEFAULT_EMAIL_ASSETS_URL
  }

  return appUrl.replace(/\/$/, '')
}

export function getEmailStorageAssetsBaseUrl(): string {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, '')
  if (supabaseUrl) {
    return `${supabaseUrl}/storage/v1/object/public/uploads/email`
  }
  return getEmailAssetsBaseUrl()
}

export function getEmailAssetsBaseUrl(): string {
  const configured =
    process.env.EMAIL_ASSETS_BASE_URL ||
    process.env.NEXT_PUBLIC_EMAIL_ASSETS_URL

  if (configured) {
    return configured.replace(/\/$/, '')
  }

  const appUrl =
    process.env.BETTER_AUTH_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    ''

  if (
    appUrl &&
    !appUrl.includes('localhost') &&
    !appUrl.includes('127.0.0.1')
  ) {
    return appUrl.replace(/\/$/, '')
  }

  return DEFAULT_EMAIL_ASSETS_URL
}

/** URLs públicas remotas (Supabase Storage o CDN). */
export function getEmailRemoteAssetUrls(baseSiteUrl?: string) {
  const base = resolveEmailAssetsBaseUrl(baseSiteUrl)

  return {
    logoUrl: `${base}/logotipo-v2.png`,
    iconUrl: `${base}/isotipo-blanco.png`,
    poweredByUrl: `${base}/powered-by.png`,
    appUrl: getEmailAppUrl(),
  }
}

/**
 * URLs para el HTML: siempre cid: porque sendResendEmail adjunta las imágenes inline.
 */
export function getEmailAssetUrls(_baseSiteUrl?: string) {
  return getEmailCidUrls()
}

/** Base URL para assets de correo (logos). Prioriza Supabase Storage. */
export function resolveEmailAssetsBaseUrl(baseSiteUrl?: string): string {
  const supabaseStorage = getEmailStorageAssetsBaseUrl()
  if (supabaseStorage.startsWith('https://')) {
    return supabaseStorage
  }

  const candidate = (baseSiteUrl || getEmailAssetsBaseUrl()).replace(/\/$/, '')

  if (candidate.includes('localhost') || candidate.includes('127.0.0.1')) {
    return DEFAULT_EMAIL_ASSETS_URL
  }

  return candidate
}

/** @deprecated Usar resolveEmailAssetsBaseUrl */
export function resolveEmailBaseUrl(baseSiteUrl?: string): string {
  return resolveEmailAssetsBaseUrl(baseSiteUrl)
}
