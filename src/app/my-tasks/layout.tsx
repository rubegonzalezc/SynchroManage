import { getLayoutUserOrRedirect } from '@/lib/auth/get-layout-user'
import { DashboardLayoutClient } from '@/components/dashboard/DashboardLayoutClient'

export default async function MyTasksLayout({
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
