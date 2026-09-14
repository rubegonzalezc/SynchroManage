/**
 * Crea o actualiza un usuario Better Auth vinculado a un perfil existente.
 *
 * Uso:
 *   node --env-file=.env.local scripts/seed-better-auth-user.mjs
 *   node --env-file=.env.local scripts/seed-better-auth-user.mjs --email otro@correo.com --password MiClave123
 *
 * Variables:
 *   DATABASE_URL  (requerida)
 *   SEED_AUTH_PASSWORD  (opcional si no se pasa --password)
 */

import { randomUUID } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import pg from 'pg'
import { hashPassword } from 'better-auth/crypto'

const { Pool } = pg

function parseArgs(argv) {
  const args = { email: 'ra.gonzalez.c@hotmail.com', password: process.env.SEED_AUTH_PASSWORD }
  for (let i = 2; i < argv.length; i++) {
    if (argv[i] === '--email' && argv[i + 1]) {
      args.email = argv[++i]
    } else if (argv[i] === '--password' && argv[i + 1]) {
      args.password = argv[++i]
    }
  }
  return args
}

function loadEnvLocal() {
  try {
    const envPath = resolve(process.cwd(), '.env.local')
    const content = readFileSync(envPath, 'utf8')
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
    // .env.local opcional si ya están las variables en el entorno
  }
}

async function main() {
  loadEnvLocal()
  const { email, password: cliPassword } = parseArgs(process.argv)

  if (!process.env.DATABASE_URL) {
    console.error('Error: DATABASE_URL no está configurada.')
    process.exit(1)
  }

  const password = cliPassword || `Synchro-${randomUUID().slice(0, 8)}!`
  const normalizedEmail = email.trim().toLowerCase()

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL.includes('localhost')
      ? false
      : { rejectUnauthorized: false },
  })

  const client = await pool.connect()

  try {
    const { rows: profiles } = await client.query(
      `SELECT id, email, full_name, avatar_url
       FROM profiles
       WHERE lower(email) = lower($1)
       LIMIT 1`,
      [normalizedEmail]
    )

    if (!profiles.length) {
      console.error(`No se encontró perfil con email: ${normalizedEmail}`)
      process.exit(1)
    }

    const profile = profiles[0]
    const userId = profile.id
    const now = new Date().toISOString()
    const passwordHash = await hashPassword(password)

    await client.query('BEGIN')

    const { rows: existingUsers } = await client.query(
      `SELECT id FROM auth_user WHERE lower(email) = lower($1) OR id = $2`,
      [normalizedEmail, userId]
    )

    if (existingUsers.length) {
      const existingId = existingUsers[0].id
      if (existingId !== userId) {
        throw new Error(
          `Ya existe auth_user con email ${normalizedEmail} pero id distinto (${existingId} ≠ ${profile.id}). Revisar manualmente.`
        )
      }

      await client.query(
        `UPDATE auth_user
         SET name = $1, email = $2, "emailVerified" = TRUE, image = $3, "updatedAt" = $4
         WHERE id = $5`,
        [profile.full_name || 'Usuario', normalizedEmail, profile.avatar_url, now, userId]
      )
    } else {
      await client.query(
        `INSERT INTO auth_user (id, name, email, "emailVerified", image, "createdAt", "updatedAt")
         VALUES ($1, $2, $3, TRUE, $4, $5, $5)`,
        [userId, profile.full_name || 'Usuario', normalizedEmail, profile.avatar_url, now]
      )
    }

    const accountId = randomUUID()
    const { rows: existingAccounts } = await client.query(
      `SELECT id FROM auth_account WHERE "userId" = $1 AND "providerId" = 'credential'`,
      [userId]
    )

    if (existingAccounts.length) {
      await client.query(
        `UPDATE auth_account
         SET password = $1, "accountId" = $2, "updatedAt" = $3
         WHERE id = $4`,
        [passwordHash, userId, now, existingAccounts[0].id]
      )
    } else {
      await client.query(
        `INSERT INTO auth_account (
           id, "accountId", "providerId", "userId", password, "createdAt", "updatedAt"
         ) VALUES ($1, $2, 'credential', $3, $4, $5, $5)`,
        [accountId, userId, userId, passwordHash, now]
      )
    }

    await client.query('COMMIT')

    console.log('Usuario Better Auth creado/actualizado correctamente.')
    console.log('')
    console.log(`  Email:     ${normalizedEmail}`)
    console.log(`  User ID:   ${userId} (mismo que profiles.id)`)
    console.log(`  Nombre:    ${profile.full_name || 'Usuario'}`)
    console.log(`  Password:  ${password}`)
    console.log('')
    console.log('Puedes iniciar sesión en /login con estas credenciales.')
  } catch (error) {
    await client.query('ROLLBACK')
    console.error('Error:', error instanceof Error ? error.message : error)
    process.exit(1)
  } finally {
    client.release()
    await pool.end()
  }
}

main()
