import useSWR from 'swr'

export interface UserBasic {
  id: string
  full_name: string
  email: string
  avatar_url: string | null
  role?: { name: string } | null
  roles?: string[]
}

interface UseUsersReturn {
  users: UserBasic[]
  isLoading: boolean
  error: Error | undefined
}

export function useUsers(): UseUsersReturn {
  const { data, error, isLoading } = useSWR<{ users: UserBasic[] }>('/api/dashboard/users')

  return {
    users: data?.users ?? [],
    isLoading,
    error,
  }
}
