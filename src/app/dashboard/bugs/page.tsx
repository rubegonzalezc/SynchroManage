import { redirect } from 'next/navigation'
import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { BugsTableClient } from '@/components/dashboard/bugs/BugsTableClient'
import BugsLoading from './loading'

const TRIAGE_ROLES = new Set(['admin', 'pm', 'tech_lead'])

export default async function BugsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role:roles(name)')
    .eq('id', user.id)
    .single()

  const roleName = (profile?.role as unknown as { name: string } | null)?.name

  if (!roleName || !TRIAGE_ROLES.has(roleName)) {
    redirect('/dashboard')
  }

  return (
    <Suspense fallback={<BugsLoading />}>
      <BugsTableClient currentUserId={user.id} />
    </Suspense>
  )
}
