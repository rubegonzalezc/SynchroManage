import { headers } from 'next/headers'

import { auth } from './auth'
import { getAuthDatabasePool } from './db'

export interface GithubConnectionStatus {
  github_connected: boolean
  github_username: string | null
}

async function fetchGithubUsername(accessToken: string): Promise<string | null> {
  try {
    const response = await fetch('https://api.github.com/user', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/vnd.github+json',
        'User-Agent': 'SynchroManage',
      },
      next: { revalidate: 300 },
    })

    if (!response.ok) return null

    const data = (await response.json()) as { login?: string }
    return data.login ?? null
  } catch {
    return null
  }
}

export async function getGithubConnectionForUser(
  userId: string
): Promise<GithubConnectionStatus> {
  const pool = getAuthDatabasePool()
  const { rows } = await pool.query<{ id: string }>(
    `SELECT id FROM auth_account WHERE "userId" = $1 AND "providerId" = 'github' LIMIT 1`,
    [userId]
  )

  if (!rows[0]) {
    return { github_connected: false, github_username: null }
  }

  let username: string | null = null

  try {
    const tokenResult = await auth.api.getAccessToken({
      body: { accountId: rows[0].id },
      headers: await headers(),
    })

    if (tokenResult?.accessToken) {
      username = await fetchGithubUsername(tokenResult.accessToken)
    }
  } catch {
    // Cuenta vinculada aunque no se pueda resolver el username ahora
  }

  return {
    github_connected: true,
    github_username: username,
  }
}
