import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Roles válidos para acceder a rutas privadas
const VALID_ROLES = ['admin', 'pm', 'tech_lead', 'developer', 'stakeholder'] as const

// Rutas que requieren autenticación y rol válido
const PRIVATE_ROUTES = [
  '/dashboard',
  '/projects',
  '/my-tasks',
  '/change-controls',
  '/profile',
]

// Rutas públicas que no requieren autenticación
const PUBLIC_ROUTES = [
  '/login',
  '/auth/callback',
  '/auth/set-password',
  '/auth/forgot-password',
]

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

  const isPublicRoute = PUBLIC_ROUTES.some(route => pathname.startsWith(route))
  const isPrivateRoute = PRIVATE_ROUTES.some(route => pathname.startsWith(route))
  // Las rutas de API manejan su propia autenticación
  const isApiRoute = pathname.startsWith('/api/')

  // 1. Usuario no autenticado intentando acceder a ruta privada → redirigir a login
  if (!user && isPrivateRoute) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // 2. Usuario autenticado en login → redirigir al dashboard
  if (user && pathname === '/login') {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  // 3. Validación de rol para todas las rutas privadas
  //    Solo se ejecuta si el usuario está autenticado y está en una ruta privada
  if (user && isPrivateRoute && !isApiRoute) {
    // Leer rol desde cookie cacheada para evitar query en cada request
    const cachedRole = request.cookies.get('user_role')?.value

    if (cachedRole) {
      // Rol en cache: validar directamente sin tocar la DB
      if (!VALID_ROLES.includes(cachedRole as typeof VALID_ROLES[number])) {
        const url = request.nextUrl.clone()
        url.pathname = '/'
        return NextResponse.redirect(url)
      }
    } else {
      // Sin cache: consultar DB y cachear el resultado
      const { data: profile } = await supabase
        .from('profiles')
        .select('role:roles(name)')
        .eq('id', user.id)
        .single()

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const roleName = (profile?.role as any)?.name as string | undefined

      if (!VALID_ROLES.includes(roleName as typeof VALID_ROLES[number])) {
        const url = request.nextUrl.clone()
        url.pathname = '/'
        return NextResponse.redirect(url)
      }

      // Cachear el rol en cookie httpOnly (1 hora) para evitar queries repetidas
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
