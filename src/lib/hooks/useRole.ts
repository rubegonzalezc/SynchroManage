'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Profile, RoleName, Permission, PERMISSIONS } from '@/lib/types/roles'

export function useRole() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [roleName, setRoleName] = useState<RoleName | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function fetchProfile() {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        setLoading(false)
        return
      }

      const { data } = await supabase
        .from('profiles')
        .select(`
          *,
          role:roles(*)
        `)
        .eq('id', user.id)
        .single()

      if (data) {
        setProfile(data as Profile)
        setRoleName(data.role?.name as RoleName)
      }
      setLoading(false)
    }

    fetchProfile()
  }, [supabase])

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
    loading,
    hasPermission,
    isAdmin,
    isPM,
    isTechLead,
    isDeveloper,
  }
}
