import { createClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// Días que debe estar un bug en "resolved" antes de cerrarse automáticamente
const AUTO_CLOSE_DAYS = 7

function getAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

// POST - Cerrar bugs que llevan más de AUTO_CLOSE_DAYS días en estado "resolved"
// Accesible para admin, pm y tech_lead
export async function POST() {
  try {
    const supabaseServer = await createServerClient()
    const { data: { user } } = await supabaseServer.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const admin = getAdmin()

    // Verificar rol
    const { data: profile } = await admin
      .from('profiles')
      .select('role:roles(name)')
      .eq('id', user.id)
      .single()

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const roleName = (profile?.role as any)?.name as string | undefined
    if (!roleName || !['admin', 'pm', 'tech_lead'].includes(roleName)) {
      return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
    }

    // Calcular el umbral: bugs resueltos hace más de AUTO_CLOSE_DAYS días
    const threshold = new Date()
    threshold.setDate(threshold.getDate() - AUTO_CLOSE_DAYS)

    // Obtener bugs elegibles para cierre
    const { data: bugsToClose, error: fetchError } = await admin
      .from('bugs')
      .select('id, title, project_id, assignee_id, reporter_id')
      .eq('status', 'resolved')
      .lt('resolved_at', threshold.toISOString())

    if (fetchError) {
      return NextResponse.json({ error: fetchError.message }, { status: 400 })
    }

    if (!bugsToClose || bugsToClose.length === 0) {
      return NextResponse.json({
        success: true,
        closed: 0,
        message: 'No hay bugs elegibles para cierre automático',
      })
    }

    const bugIds = bugsToClose.map(b => b.id)
    const now = new Date().toISOString()

    // Cerrar todos los bugs elegibles
    const { error: updateError } = await admin
      .from('bugs')
      .update({ status: 'closed', updated_at: now })
      .in('id', bugIds)

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 400 })
    }

    // Registrar actividad y notificar a los involucrados
    const activityLogs = bugsToClose.map(bug => ({
      user_id: user.id,
      action: 'status_changed',
      entity_type: 'bug',
      entity_id: bug.id,
      entity_name: bug.title,
      details: {
        project_id: bug.project_id,
        from: 'resolved',
        to: 'closed',
        auto_closed: true,
        days_threshold: AUTO_CLOSE_DAYS,
      },
    }))

    await admin.from('activity_log').insert(activityLogs)

    return NextResponse.json({
      success: true,
      closed: bugsToClose.length,
      message: `${bugsToClose.length} bug${bugsToClose.length !== 1 ? 's' : ''} cerrado${bugsToClose.length !== 1 ? 's' : ''} automáticamente`,
    })
  } catch (error) {
    console.error('Error closing resolved bugs:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
