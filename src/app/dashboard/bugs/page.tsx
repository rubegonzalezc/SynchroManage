import { redirect } from 'next/navigation'
import { Suspense } from 'react'
import { getServerSession } from '@/lib/auth/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { BugsTableClient } from '@/components/dashboard/bugs/BugsTableClient'
import BugsLoading from './loading'

const TRIAGE_ROLES = new Set(['admin', 'pm', 'tech_lead'])

export default async function BugsPage() {
  const session = await getServerSession()
  if (!session?.user) redirect('/login')

  const supabase = createAdminClient()
  const { data: profile } = await supabase
    .from('profiles')
    .select('role:roles(name)')
    .eq('id', session.user.id)
    .single()

  const roleName = (profile?.role as unknown as { name: string } | null)?.name

  if (!roleName || !TRIAGE_ROLES.has(roleName)) {
    redirect('/dashboard')
  }

  return (
    <Suspense fallback={<BugsLoading />}>
      <BugsTableClient currentUserId={session.user.id} />
    </Suspense>
  )
}
