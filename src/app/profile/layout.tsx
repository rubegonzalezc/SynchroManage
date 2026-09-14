import { getLayoutUserOrRedirect } from '@/lib/auth/get-layout-user'
import { DashboardLayoutClient } from '@/components/dashboard/DashboardLayoutClient'

export default async function ProfileLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getLayoutUserOrRedirect()

  return (
    <DashboardLayoutClient user={user}>
      {children}
    </DashboardLayoutClient>
  )
}
