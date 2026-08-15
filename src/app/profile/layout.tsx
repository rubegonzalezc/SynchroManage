import { createClient } from '@/lib/supabase/server'
import { DashboardLayoutClient } from '@/components/dashboard/DashboardLayoutClient'

// La autenticación y validación de rol están centralizadas en src/middleware.ts
// Este layout solo obtiene los datos del perfil para renderizar la UI

export default async function ProfileLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select(`
      *,
      role:roles(name)
    `)
    .eq('id', user!.id)
    .single()

  const roleName = (profile?.role as unknown as { name: string } | null)?.name

  return (
    <DashboardLayoutClient
      user={{
        email: user!.email || '',
        full_name: profile?.full_name,
        avatar_url: profile?.avatar_url,
        role: roleName,
      }}
    >
      {children}
    </DashboardLayoutClient>
  )
}
