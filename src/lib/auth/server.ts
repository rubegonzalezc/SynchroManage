import { createClient } from '@supabase/supabase-js'
import { headers } from 'next/headers'
import { auth, type Session } from './auth'

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

export async function getServerSession(): Promise<Session | null> {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  return session
}

export async function requireSession(): Promise<Session> {
  const session = await getServerSession()
  if (!session) {
    throw new Error('No autorizado')
  }
  return session
}

export interface SessionProfile {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  role: string | undefined
}

export async function getSessionUserProfile(): Promise<{
  session: Session
  profile: SessionProfile | null
} | null> {
  const session = await getServerSession()
  if (!session?.user) return null

  const admin = getSupabaseAdmin()
  const { data: profile } = await admin
    .from('profiles')
    .select('id, full_name, avatar_url, role:roles(name)')
    .eq('id', session.user.id)
    .single()

  const roleName = (profile?.role as { name?: string } | null)?.name

  return {
    session,
    profile: profile
      ? {
          id: profile.id,
          email: session.user.email,
          full_name: profile.full_name,
          avatar_url: profile.avatar_url,
          role: roleName,
        }
      : null,
  }
}

/** Helper para API routes: devuelve userId o null */
export async function getAuthenticatedUserId(): Promise<string | null> {
  const session = await getServerSession()
  return session?.user?.id ?? null
}

export interface ApiAuthUser {
  id: string
  email: string
  name: string
}

/** Usuario autenticado para API routes (reemplaza supabase.auth.getUser) */
export async function getApiUser(): Promise<ApiAuthUser | null> {
  const session = await getServerSession()
  if (!session?.user) return null

  return {
    id: session.user.id,
    email: session.user.email,
    name: session.user.name,
  }
}
