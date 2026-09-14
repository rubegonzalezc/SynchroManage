import { betterAuth } from 'better-auth'
import { nextCookies } from 'better-auth/next-js'
import { getAuthDatabasePool } from './db'
import { sendAuthResetPasswordEmail, sendAuthVerificationEmail } from './emails'

async function markEmailVerified(userId: string) {
  const pool = getAuthDatabasePool()
  await pool.query(
    `UPDATE auth_user SET "emailVerified" = TRUE, "updatedAt" = NOW() WHERE id = $1`,
    [userId]
  )
}

const baseURL = process.env.BETTER_AUTH_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

export const auth = betterAuth({
  baseURL,
  secret: process.env.BETTER_AUTH_SECRET,
  database: getAuthDatabasePool(),
  user: {
    modelName: 'auth_user',
    fields: {
      emailVerified: 'emailVerified',
      createdAt: 'createdAt',
      updatedAt: 'updatedAt',
    },
  },
  session: {
    modelName: 'auth_session',
    fields: {
      expiresAt: 'expiresAt',
      createdAt: 'createdAt',
      updatedAt: 'updatedAt',
      ipAddress: 'ipAddress',
      userAgent: 'userAgent',
      userId: 'userId',
    },
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60,
    },
  },
  account: {
    modelName: 'auth_account',
    fields: {
      accountId: 'accountId',
      providerId: 'providerId',
      userId: 'userId',
      accessToken: 'accessToken',
      refreshToken: 'refreshToken',
      idToken: 'idToken',
      accessTokenExpiresAt: 'accessTokenExpiresAt',
      refreshTokenExpiresAt: 'refreshTokenExpiresAt',
      createdAt: 'createdAt',
      updatedAt: 'updatedAt',
    },
  },
  verification: {
    modelName: 'auth_verification',
    fields: {
      expiresAt: 'expiresAt',
      createdAt: 'createdAt',
      updatedAt: 'updatedAt',
    },
  },
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    minPasswordLength: 8,
    sendResetPassword: async ({ user, url }) => {
      await sendAuthResetPasswordEmail(user.email, url, user.name)
    },
    onPasswordReset: async ({ user }) => {
      await markEmailVerified(user.id)
    },
  },
  emailVerification: {
    sendOnSignUp: true,
    autoSignInAfterVerification: true,
    sendVerificationEmail: async ({ user, url }) => {
      await sendAuthVerificationEmail(user.email, url)
    },
  },
  plugins: [nextCookies()],
})

export type Session = typeof auth.$Infer.Session
