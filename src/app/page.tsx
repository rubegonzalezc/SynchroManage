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

  // Redirigir según rol — todos los roles van al dashboard unificado
  if (roleName && ['admin', 'pm', 'tech_lead', 'developer', 'stakeholder'].includes(roleName)) {
    redirect('/dashboard')
  } else {
    redirect('/login')
  }
}
