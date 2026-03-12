import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function Home() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Obtener rol del usuario
  const { data: profile } = await supabase
    .from('profiles')
    .select('role:roles(name)')
    .eq('id', user.id)
    .single()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const roleName = (profile?.role as any)?.name as string | undefined

  // Redirigir según rol
  switch (roleName) {
    case 'admin':
    case 'pm':
      // Admin y PM usan el dashboard principal
      redirect('/dashboard')
    case 'tech_lead':
      redirect('/tech-lead')
    case 'developer':
      redirect('/developer')
    case 'stakeholder':
      redirect('/stakeholder')
    default:
      redirect('/login')
  }
}
