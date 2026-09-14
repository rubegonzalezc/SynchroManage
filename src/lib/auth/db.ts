import { Pool } from 'pg'

let pool: Pool | null = null

export function getAuthDatabasePool(): Pool {
  if (!pool) {
    const connectionString =
      process.env.DATABASE_URL ||
      (process.env.NEXT_PHASE === 'phase-production-build'
        ? 'postgresql://build:build@127.0.0.1:5432/build'
        : undefined)

    if (!connectionString) {
      throw new Error('DATABASE_URL no está configurada')
    }

    pool = new Pool({
      connectionString,
      ssl: connectionString.includes('localhost')
        ? false
        : { rejectUnauthorized: false },
      max: 5,
    })
  }

  return pool
}
