import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { DashboardLayoutClient } from '@/components/dashboard/DashboardLayoutClient'

export default async function ChangeControlsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select(`*, role:roles(name)`)
    .eq('id', user.id)
    .single()

  const roleName = (profile?.role as unknown as { name: string } | null)?.name

  if (!roleName || !['admin', 'pm', 'tech_lead', 'developer', 'stakeholder'].includes(roleName)) {
    redirect('/')
  }

  return (
    <DashboardLayoutClient
      user={{
        email: user.email || '',
        full_name: profile?.full_name,
        avatar_url: profile?.avatar_url,
        role: roleName,
      }}
    >
      {children}
    </DashboardLayoutClient>
  )
}
