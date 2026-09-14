import { getSessionUserProfile } from '@/lib/auth/server'
import { redirect } from 'next/navigation'

export default async function Home() {
  const data = await getSessionUserProfile()

  if (!data?.session?.user) {
    redirect('/login')
  }

  const roleName = data.profile?.role

  if (roleName && ['admin', 'pm', 'tech_lead', 'developer', 'stakeholder'].includes(roleName)) {
    redirect('/dashboard')
  }

  redirect('/login')
}
