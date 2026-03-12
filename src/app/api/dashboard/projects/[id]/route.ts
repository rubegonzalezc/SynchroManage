import { createClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// Función para crear notificación
async function createNotification(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabaseAdmin: any,
  userId: string,
  fromUserId: string,
  type: string,
  title: string,
  message: string,
  link: string,
  projectId: string
) {
  if (userId === fromUserId) return // No notificar al mismo usuario
  
  await supabaseAdmin.from('notifications').insert({
    user_id: userId,
    from_user_id: fromUserId,
    type,
    title,
    message,
    link,
    project_id: projectId,
  })
}

// GET - Obtener proyecto por ID
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabaseServer = await createServerClient()
    const { data: { user } } = await supabaseServer.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    const { data: project, error } = await supabaseAdmin
      .from('projects')
      .select(`
        *,
        company:companies(id, name),
        pm:profiles!projects_pm_id_fkey(id, full_name, email, avatar_url),
        tech_lead:profiles!projects_tech_lead_id_fkey(id, full_name, email, avatar_url),
        members:project_members(
          id,
          role,
          user:profiles(id, full_name, email, avatar_url, role:roles(name))
        ),
        tasks(
          id, task_number, title, description, status, priority, category, position, due_date, created_at,
          assignee:profiles(id, full_name, avatar_url)
        )
      `)
      .eq('id', id)
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ project })
  } catch (error) {
    console.error('Error fetching project:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}

// PUT - Actualizar proyecto
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabaseServer = await createServerClient()
    const { data: { user } } = await supabaseServer.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await request.json()

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    // Obtener proyecto actual para comparar cambios
    const { data: currentProject } = await supabaseAdmin
      .from('projects')
      .select('pm_id, tech_lead_id, name')
      .eq('id', id)
      .single()

    // Obtener miembros actuales
    const { data: currentMembers } = await supabaseAdmin
      .from('project_members')
      .select('user_id, role')
      .eq('project_id', id)

    const { data, error } = await supabaseAdmin
      .from('projects')
      .update({
        name: body.name,
        description: body.description || null,
        company_id: body.company_id || null,
        pm_id: body.pm_id || null,
        tech_lead_id: body.tech_lead_id || null,
        status: body.status,
        start_date: body.start_date || null,
        end_date: body.end_date || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    const projectLink = `/projects/${id}`
    const projectName = body.name || currentProject?.name

    // Notificar si cambió el PM
    if (body.pm_id && body.pm_id !== currentProject?.pm_id) {
      await createNotification(
        supabaseAdmin,
        body.pm_id,
        user.id,
        'project_assigned',
        'Te asignaron como Project Manager',
        `Has sido asignado como PM del proyecto "${projectName}"`,
        projectLink,
        id
      )
    }

    // Notificar si cambió el Tech Lead
    if (body.tech_lead_id && body.tech_lead_id !== currentProject?.tech_lead_id) {
      await createNotification(
        supabaseAdmin,
        body.tech_lead_id,
        user.id,
        'project_assigned',
        'Te asignaron como Tech Lead',
        `Has sido asignado como Tech Lead del proyecto "${projectName}"`,
        projectLink,
        id
      )
    }

    // Actualizar miembros si se proporcionaron
    if (body.members !== undefined) {
      // Eliminar miembros actuales
      await supabaseAdmin.from('project_members').delete().eq('project_id', id)
      
      // Insertar nuevos miembros
      if (body.members.length > 0) {
        const membersToInsert = body.members.map((m: { user_id: string; role: string }) => ({
          project_id: id,
          user_id: m.user_id,
          role: m.role,
        }))
        await supabaseAdmin.from('project_members').insert(membersToInsert)

        // Notificar a nuevos miembros (que no estaban antes)
        const currentMemberIds = currentMembers?.map(m => m.user_id) || []
        for (const member of body.members) {
          if (!currentMemberIds.includes(member.user_id)) {
            await createNotification(
              supabaseAdmin,
              member.user_id,
              user.id,
              'project_assigned',
              'Te agregaron a un proyecto',
              `Has sido agregado al proyecto "${projectName}" como ${member.role === 'developer' ? 'Desarrollador' : 'Stakeholder'}`,
              projectLink,
              id
            )
          }
        }
      }
    }

    // Registrar actividad
    await supabaseAdmin.from('activity_log').insert({
      user_id: user.id,
      action: 'updated',
      entity_type: 'project',
      entity_id: id,
      entity_name: projectName,
      details: { project_id: id },
    })

    return NextResponse.json({ project: data })
  } catch (error) {
    console.error('Error updating project:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}

// DELETE - Eliminar proyecto
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabaseServer = await createServerClient()
    const { data: { user } } = await supabaseServer.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Verificar que sea admin
    const { data: profile } = await supabaseServer
      .from('profiles')
      .select('role:roles(name)')
      .eq('id', user.id)
      .single()

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((profile?.role as any)?.name !== 'admin') {
      return NextResponse.json({ error: 'No tienes permisos' }, { status: 403 })
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    // Obtener nombre del proyecto antes de eliminar
    const { data: projectData } = await supabaseAdmin
      .from('projects')
      .select('name')
      .eq('id', id)
      .single()

    const { error } = await supabaseAdmin
      .from('projects')
      .delete()
      .eq('id', id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    // Registrar actividad
    await supabaseAdmin.from('activity_log').insert({
      user_id: user.id,
      action: 'deleted',
      entity_type: 'project',
      entity_id: id,
      entity_name: projectData?.name || 'Proyecto',
      details: { project_id: id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting project:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
