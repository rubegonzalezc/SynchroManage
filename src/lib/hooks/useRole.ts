'use client'

import { useEffect, useState } from 'react'
import { useSession } from '@/lib/auth/client'
import { Profile, RoleName, Permission, PERMISSIONS } from '@/lib/types/roles'

export function useRole() {
  const { data: session, isPending } = useSession()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [roleName, setRoleName] = useState<RoleName | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchProfile() {
      if (isPending) return

      if (!session?.user) {
        setProfile(null)
        setRoleName(null)
        setLoading(false)
        return
      }

      try {
        const response = await fetch('/api/dashboard/me')
        if (!response.ok) {
          setLoading(false)
          return
        }

        const data = await response.json()
        const user = data.user
        if (user) {
          setProfile(user as Profile)
          const role = user.role as { name?: string } | null
          setRoleName((role?.name as RoleName) ?? null)
        }
      } catch (error) {
        console.error('Error fetching profile:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchProfile()
  }, [session?.user?.id, isPending])

  const hasPermission = (permission: Permission): boolean => {
    if (!roleName) return false
    return (PERMISSIONS[permission] as readonly string[]).includes(roleName)
  }

  const isAdmin = () => roleName === 'admin'
  const isPM = () => roleName === 'pm'
  const isTechLead = () => roleName === 'tech_lead'
  const isDeveloper = () => roleName === 'developer'

  return {
    profile,
    roleName,
    loading: loading || isPending,
    hasPermission,
    isAdmin,
    isPM,
    isTechLead,
    isDeveloper,
  }
}
