import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('id, full_name, avatar_url, role:roles(name)')
      .eq('id', user.id)
      .single()

    return NextResponse.json({ 
      user: {
        id: user.id,
        email: user.email,
        ...profile
      }
    })
  } catch (error) {
    console.error('Error fetching current user:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
