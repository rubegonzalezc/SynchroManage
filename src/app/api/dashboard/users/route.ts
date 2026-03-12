import { createClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // Verificar que el usuario actual está autenticado
    const supabaseServer = await createServerClient()
    const { data: { user } } = await supabaseServer.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { data: profile } = await supabaseServer
      .from('profiles')
      .select('role:roles(name)')
      .eq('id', user.id)
      .single()

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const roleName = (profile?.role as any)?.name
    const isAdmin = roleName === 'admin'

    // Crear cliente admin con service_role key
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    // Obtener todos los user_roles con sus nombres de rol para enriquecer la respuesta
    const { data: allUserRoles } = await supabaseAdmin
      .from('user_roles')
      .select('user_id, role:roles(name)')

    // Construir mapa de user_id -> roles[]
    const userRolesMap: Record<string, string[]> = {}
    if (allUserRoles) {
      for (const ur of allUserRoles) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const urRoleName = (ur.role as any)?.name
        if (urRoleName) {
          if (!userRolesMap[ur.user_id]) {
            userRolesMap[ur.user_id] = []
          }
          userRolesMap[ur.user_id].push(urRoleName)
        }
      }
    }

    // Si es admin, obtener datos completos incluyendo estado de auth
    if (isAdmin) {
      const { data: authUsers, error: authError } = await supabaseAdmin.auth.admin.listUsers()

      if (authError) {
        return NextResponse.json({ error: authError.message }, { status: 400 })
      }

      const { data: profiles, error: profilesError } = await supabaseAdmin
        .from('profiles')
        .select(`
          *,
          role:roles(id, name, description),
          company:companies(id, name)
        `)
        .order('created_at', { ascending: false })

      if (profilesError) {
        return NextResponse.json({ error: profilesError.message }, { status: 400 })
      }

      // Combinar datos de auth con perfiles y agregar roles[]
      const usersWithStatus = profiles?.map(p => {
        const authUser = authUsers.users.find(u => u.id === p.id)
        // Fallback: si no hay registros en user_roles, usar role_id del perfil (Req 1.6)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const fallbackRole = (p.role as any)?.name
        const roles = userRolesMap[p.id] ?? (fallbackRole ? [fallbackRole] : [])
        return {
          ...p,
          roles,
          email_confirmed: authUser?.email_confirmed_at ? true : false,
          last_sign_in: authUser?.last_sign_in_at || null,
        }
      })

      return NextResponse.json({ users: usersWithStatus })
    }

    // Para PM y otros roles, solo datos básicos (para asignar tareas, menciones, etc.)
    const { data: profiles, error: profilesError } = await supabaseAdmin
      .from('profiles')
      .select(`
        id,
        full_name,
        email,
        avatar_url,
        role:roles(name)
      `)
      .order('full_name', { ascending: true })

    if (profilesError) {
      return NextResponse.json({ error: profilesError.message }, { status: 400 })
    }

    // Agregar roles[] a cada perfil
    const usersWithRoles = profiles?.map(p => {
      // Fallback: si no hay registros en user_roles, usar role del perfil (Req 1.6)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const fallbackRole = (p.role as any)?.name
      const roles = userRolesMap[p.id] ?? (fallbackRole ? [fallbackRole] : [])
      return {
        ...p,
        roles,
      }
    })

    return NextResponse.json({ users: usersWithRoles })
  } catch (error) {
    console.error('Error fetching users:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

