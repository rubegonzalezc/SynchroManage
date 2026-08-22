import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { UsersTableClient } from '@/components/dashboard/users/UsersTableClient'
import UsersLoading from './loading'

export default async function UsersPage() {
  const supabase = await createClient()

  const { data: roles } = await supabase
    .from('roles')
    .select('*')
    .order('id')

  return (
    <Suspense fallback={<UsersLoading />}>
      <UsersTableClient roles={roles || []} />
    </Suspense>
  )
}
