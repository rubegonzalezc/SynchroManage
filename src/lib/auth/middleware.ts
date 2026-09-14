import { createClient } from '@supabase/supabase-js'
import { getCookieCache, getSessionCookie } from 'better-auth/cookies'
import { NextResponse, type NextRequest } from 'next/server'

const VALID_ROLES = ['admin', 'pm', 'tech_lead', 'developer', 'stakeholder'] as const

const PRIVATE_ROUTES = [
  '/dashboard',
  '/projects',
  '/my-tasks',
  '/change-controls',
  '/profile',
]

const PUBLIC_ROUTES = [
  '/login',
  '/auth/callback',
  '/auth/set-password',
  '/auth/forgot-password',
  '/auth/reset-password',
  '/api/auth',
]

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request })
  const pathname = request.nextUrl.pathname

  const isPublicRoute = PUBLIC_ROUTES.some((route) => pathname.startsWith(route))
  const isPrivateRoute = PRIVATE_ROUTES.some((route) => pathname.startsWith(route))
  const isApiRoute = pathname.startsWith('/api/')

  const sessionCookie = getSessionCookie(request)
  const session = await getCookieCache(request)
  const userId = session?.user?.id

  if (!sessionCookie && isPrivateRoute) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  if (sessionCookie && pathname === '/login') {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  if (sessionCookie && isPrivateRoute && !isApiRoute && userId) {
    const cachedRole = request.cookies.get('user_role')?.value

    if (cachedRole) {
      if (!VALID_ROLES.includes(cachedRole as typeof VALID_ROLES[number])) {
        const url = request.nextUrl.clone()
        url.pathname = '/'
        return NextResponse.redirect(url)
      }
    } else {
      const admin = getSupabaseAdmin()
      const { data: profile } = await admin
        .from('profiles')
        .select('role:roles(name)')
        .eq('id', userId)
        .single()

      const roleName = (profile?.role as { name?: string } | null)?.name

      if (!VALID_ROLES.includes(roleName as typeof VALID_ROLES[number])) {
        const url = request.nextUrl.clone()
        url.pathname = '/'
        return NextResponse.redirect(url)
      }

      if (roleName) {
        response.cookies.set('user_role', roleName, {
          httpOnly: true,
          sameSite: 'lax',
          maxAge: 3600,
          path: '/',
        })
      }
    }
  }

  return response
}
