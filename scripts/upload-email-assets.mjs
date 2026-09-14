/**
 * Sube los logos de correo a Supabase Storage (bucket uploads/email/).
 * Útil para la Edge Function send-email y como fallback con URLs públicas.
 *
 * Uso: node --env-file=.env.local scripts/upload-email-assets.mjs
 */

import { readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { createClient } from '@supabase/supabase-js'

const FILES = [
  'logotipo-v2.png',
  'isotipo-blanco.png',
  'powered-by.png',
]

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

async function main() {
  loadEnvLocal()

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !key) {
    console.error('Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY')
    process.exit(1)
  }

  const admin = createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const publicBase = `${url.replace(/\/$/, '')}/storage/v1/object/public/uploads/email`

  for (const filename of FILES) {
    const filePath = join(process.cwd(), 'public', 'logo', filename)
    const buffer = readFileSync(filePath)
    const storagePath = `email/${filename}`

    const { error } = await admin.storage
      .from('uploads')
      .upload(storagePath, buffer, {
        contentType: 'image/png',
        cacheControl: '31536000',
        upsert: true,
      })

    if (error) {
      console.error(`Error subiendo ${filename}:`, error.message)
      process.exit(1)
    }

    console.log(`✓ ${filename} → ${publicBase}/${filename}`)
  }

  console.log('')
  console.log('Assets públicos listos. Puedes usar:')
  console.log(`EMAIL_ASSETS_BASE_URL=${publicBase}`)
}

main()
