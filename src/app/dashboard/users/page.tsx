import { createClient } from '@/lib/supabase/server'
import { UsersTableClient } from '@/components/dashboard/users/UsersTableClient'

export default async function UsersPage() {
  const supabase = await createClient()

  const { data: roles } = await supabase
    .from('roles')
    .select('*')
    .order('id')

  return (
    <div className="space-y-6">
      <UsersTableClient roles={roles || []} />
    </div>
  )
}
