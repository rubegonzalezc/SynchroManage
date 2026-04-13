import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname

  // Rutas públicas que no requieren autenticación
  const publicRoutes = ['/login', '/auth/callback', '/auth/set-password', '/auth/forgot-password']
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route))
  
  // Las rutas de API manejan su propia autenticación
  const isApiRoute = pathname.startsWith('/api/')

  if (!user && !isPublicRoute && !isApiRoute) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  if (user && pathname === '/login') {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  // Proteger rutas del dashboard y projects por rol
  // Solo hacer la query de rol cuando realmente se necesita (rutas protegidas)
  const needsRoleCheck = user && (
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/projects') ||
    pathname.startsWith('/my-tasks') ||
    pathname.startsWith('/change-controls') ||
    pathname.startsWith('/profile')
  )

  if (needsRoleCheck) {
    // Leer rol desde cookie cacheada para evitar query en cada request
    const cachedRole = request.cookies.get('user_role')?.value

    if (cachedRole) {
      if (!['admin', 'pm', 'tech_lead', 'developer', 'stakeholder'].includes(cachedRole)) {
        const url = request.nextUrl.clone()
        url.pathname = '/'
        return NextResponse.redirect(url)
      }
    } else {
      // Solo consultar DB si no hay cookie cacheada
      const { data: profile } = await supabase
        .from('profiles')
        .select('role:roles(name)')
        .eq('id', user!.id)
        .single()

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const roleName = (profile?.role as any)?.name as string | undefined

      if (!['admin', 'pm', 'tech_lead', 'developer', 'stakeholder'].includes(roleName || '')) {
        const url = request.nextUrl.clone()
        url.pathname = '/'
        return NextResponse.redirect(url)
      }

      // Cachear el rol en una cookie (1 hora) para evitar queries repetidas
      if (roleName) {
        supabaseResponse.cookies.set('user_role', roleName, {
          httpOnly: true,
          sameSite: 'lax',
          maxAge: 3600,
          path: '/',
        })
      }
    }
  }

  return supabaseResponse
}
