import useSWR from 'swr'

interface CurrentUser {
  id: string
  email: string
  full_name: string
  avatar_url: string | null
  role: { name: string } | { name: string }[] | null
}

interface UseCurrentUserReturn {
  currentUser: CurrentUser | undefined
  currentUserId: string
  currentUserRole: string
  isLoading: boolean
  error: Error | undefined
}

export function useCurrentUser(): UseCurrentUserReturn {
  const { data, error, isLoading } = useSWR<{ user: CurrentUser }>('/api/dashboard/me')

  const currentUser = data?.user
  const roleData = currentUser?.role
  const roleName = Array.isArray(roleData) ? roleData[0]?.name : (roleData as { name: string } | null)?.name

  return {
    currentUser,
    currentUserId: currentUser?.id ?? '',
    currentUserRole: roleName ?? '',
    isLoading,
    error,
  }
}
