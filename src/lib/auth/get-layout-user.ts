import { redirect } from 'next/navigation'
import { getSessionUserProfile } from './server'

export interface LayoutUser {
  email: string
  full_name: string | null
  avatar_url: string | null
  role: string | undefined
}

export async function getLayoutUserOrRedirect(): Promise<LayoutUser> {
  const data = await getSessionUserProfile()
  if (!data?.session?.user) {
    redirect('/login')
  }

  return {
    email: data.session.user.email,
    full_name: data.profile?.full_name ?? data.session.user.name ?? null,
    avatar_url: data.profile?.avatar_url ?? data.session.user.image ?? null,
    role: data.profile?.role,
  }
}
