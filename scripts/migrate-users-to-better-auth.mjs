/**
 * Migra perfiles existentes a auth_user (Better Auth).
 *
 * Los hashes de Supabase Auth (bcrypt) no son compatibles con Better Auth (scrypt),
 * por lo que los usuarios migrados deben usar "Olvidé mi contraseña" una vez.
 *
 * Uso:
 *   node --env-file=.env.local scripts/migrate-users-to-better-auth.mjs
 *   node --env-file=.env.local scripts/migrate-users-to-better-auth.mjs --dry-run
 */

import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import pg from 'pg'

const { Pool } = pg

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
  const dryRun = process.argv.includes('--dry-run')

  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL no está configurada')
    process.exit(1)
  }

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL.includes('localhost')
      ? false
      : { rejectUnauthorized: false },
  })

  const { rows: pending } = await pool.query(
    `SELECT p.id, p.email, p.full_name, p.avatar_url,
            au.email_confirmed_at IS NOT NULL AS supabase_confirmed
     FROM profiles p
     LEFT JOIN auth_user ba ON ba.id = p.id::text
     LEFT JOIN auth.users au ON au.id = p.id
     WHERE ba.id IS NULL
     ORDER BY p.full_name`
  )

  if (!pending.length) {
    console.log('No hay perfiles pendientes de migrar.')
    await pool.end()
    return
  }

  console.log(`Perfiles pendientes: ${pending.length}`)
  if (dryRun) {
    for (const row of pending) {
      console.log(`  - ${row.full_name} <${row.email}> (verified: ${row.supabase_confirmed})`)
    }
    console.log('\nEjecuta sin --dry-run para migrar.')
    await pool.end()
    return
  }

  const now = new Date().toISOString()
  let migrated = 0

  for (const row of pending) {
    const userId = row.id
    const email = (row.email || '').trim().toLowerCase()
    const name = row.full_name || 'Usuario'

    if (!email) {
      console.warn(`  ⚠ Omitido ${userId}: sin email en profiles`)
      continue
    }

    await pool.query(
      `INSERT INTO auth_user (id, name, email, "emailVerified", image, "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, $6, $6)
       ON CONFLICT (id) DO NOTHING`,
      [userId, name, email, Boolean(row.supabase_confirmed), row.avatar_url, now]
    )

    console.log(`  ✓ ${name} <${email}> — emailVerified: ${Boolean(row.supabase_confirmed)}`)
    migrated++
  }

  console.log('')
  console.log(`Migrados: ${migrated}/${pending.length}`)
  console.log('')
  console.log(
    'Nota: las contraseñas de Supabase Auth no se migran. Cada usuario debe usar'
  )
  console.log('"/auth/forgot-password" una vez para definir su contraseña en Better Auth.')

  await pool.end()
}

main().catch((error) => {
  console.error('Error:', error)
  process.exit(1)
})
