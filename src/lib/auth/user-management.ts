import { randomUUID } from 'node:crypto'

import { generateId } from '@better-auth/core/utils/id'

import { getAuthDatabasePool } from './db'



const INVITE_TOKEN_TTL_SEC = 24 * 60 * 60



function getAppUrl(): string {

  return (

    process.env.BETTER_AUTH_URL ||

    process.env.NEXT_PUBLIC_APP_URL ||

    'http://localhost:3000'

  ).replace(/\/$/, '')

}



export function buildPasswordSetupUrl(token: string): string {

  const appUrl = getAppUrl()

  const callbackURL = encodeURIComponent(`${appUrl}/auth/reset-password`)

  return `${appUrl}/api/auth/reset-password/${token}?callbackURL=${callbackURL}`

}



async function createPasswordSetupToken(userId: string): Promise<string> {

  const pool = getAuthDatabasePool()

  const token = generateId(24)

  const expiresAt = new Date(Date.now() + INVITE_TOKEN_TTL_SEC * 1000).toISOString()



  await pool.query(

    `INSERT INTO auth_verification (id, identifier, value, "expiresAt", "createdAt", "updatedAt")

     VALUES ($1, $2, $3, $4, $5, $5)`,

    [

      randomUUID(),

      `reset-password:${token}`,

      userId,

      expiresAt,

      new Date().toISOString(),

    ]

  )



  return token

}



export async function createPasswordSetupLink(userId: string): Promise<string> {

  const token = await createPasswordSetupToken(userId)

  return buildPasswordSetupUrl(token)

}



export interface InviteUserParams {

  email: string

  fullName: string

  primaryRoleId: number

  roleIds: number[]

  companyId?: string | null

}



export async function inviteUserWithBetterAuth(

  params: InviteUserParams

): Promise<{ userId: string; inviteUrl: string }> {

  const pool = getAuthDatabasePool()

  const email = params.email.trim().toLowerCase()

  const now = new Date().toISOString()

  const userId = randomUUID()



  const { rows: existing } = await pool.query(

    `SELECT id FROM auth_user WHERE lower(email) = lower($1)

     UNION

     SELECT id::text FROM profiles WHERE lower(email) = lower($1)

     LIMIT 1`,

    [email]

  )



  if (existing.length > 0) {

    throw new Error('Ya existe un usuario con este correo')

  }



  const client = await pool.connect()



  try {

    await client.query('BEGIN')



    await client.query(

      `INSERT INTO profiles (id, email, full_name, role_id, company_id, created_at, updated_at)

       VALUES ($1, $2, $3, $4, $5, $6, $6)`,

      [userId, email, params.fullName, params.primaryRoleId, params.companyId || null, now]

    )



    await client.query(

      `INSERT INTO auth_user (id, name, email, "emailVerified", image, "createdAt", "updatedAt")

       VALUES ($1, $2, $3, FALSE, NULL, $4, $4)`,

      [userId, params.fullName, email, now]

    )



    for (const roleId of params.roleIds) {

      await client.query(

        `INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2)
         ON CONFLICT (user_id, role_id) DO NOTHING`,

        [userId, roleId]

      )

    }



    await client.query('COMMIT')

  } catch (error) {

    await client.query('ROLLBACK')

    throw error

  } finally {

    client.release()

  }



  const inviteUrl = await createPasswordSetupLink(userId)

  return { userId, inviteUrl }

}



export async function getAuthUsersMetadata(
  userIds: string[]
): Promise<
  Record<
    string,
    { email: string | null; emailVerified: boolean; lastSignIn: string | null }
  >
> {
  if (!userIds.length) return {}

  const pool = getAuthDatabasePool()
  const { rows } = await pool.query(
    `SELECT u.id, u.email, u."emailVerified",
            (SELECT MAX(s."createdAt") FROM auth_session s WHERE s."userId" = u.id) AS last_sign_in
     FROM auth_user u
     WHERE u.id = ANY($1::text[])`,
    [userIds]
  )

  const map: Record<
    string,
    { email: string | null; emailVerified: boolean; lastSignIn: string | null }
  > = {}

  for (const row of rows) {
    map[row.id as string] = {
      email: row.email as string,
      emailVerified: Boolean(row.emailVerified),
      lastSignIn: row.last_sign_in
        ? new Date(row.last_sign_in as string).toISOString()
        : null,
    }
  }

  return map
}

export async function getAuthUserStatus(userId: string): Promise<{

  email: string | null

  emailVerified: boolean

  lastSignIn: string | null

} | null> {

  const pool = getAuthDatabasePool()



  const { rows } = await pool.query(

    `SELECT u.email, u."emailVerified",

            (SELECT MAX(s."createdAt") FROM auth_session s WHERE s."userId" = u.id) AS last_sign_in

     FROM auth_user u

     WHERE u.id = $1`,

    [userId]

  )



  if (!rows.length) return null



  return {

    email: rows[0].email as string,

    emailVerified: Boolean(rows[0].emailVerified),

    lastSignIn: rows[0].last_sign_in

      ? new Date(rows[0].last_sign_in as string).toISOString()

      : null,

  }

}



export async function deleteUserWithBetterAuth(userId: string): Promise<void> {

  const pool = getAuthDatabasePool()

  const client = await pool.connect()



  try {

    await client.query('BEGIN')

    await client.query('DELETE FROM user_roles WHERE user_id = $1', [userId])

    await client.query('DELETE FROM profiles WHERE id = $1', [userId])

    await client.query('DELETE FROM auth_user WHERE id = $1', [userId])

    await client.query('COMMIT')

  } catch (error) {

    await client.query('ROLLBACK')

    throw error

  } finally {

    client.release()

  }

}


