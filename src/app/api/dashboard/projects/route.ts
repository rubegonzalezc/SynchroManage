import { createClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { revalidateTag, unstable_cache } from 'next/cache'
import { NextResponse } from 'next/server'
import { deduplicateRecipients } from '@/lib/utils/email-recipients'

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

// GET - Listar proyectos
export async function GET(request: Request) {
  try {
    const supabaseServer = await createServerClient()
    const { data: { user } } = await supabaseServer.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Obtener rol del usuario
    const { data: profile } = await supabaseServer
      .from('profiles')
      .select('role:roles(name)')
      .eq('id', user.id)
      .single()

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const roleName = (profile?.role as any)?.name

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    // Leer el tipo de la query string (project o change_control)
    const url = new URL(request.url)
    const typeFilter = url.searchParams.get('type') || 'project'

    const projects = await getCachedProjectsList(user.id, roleName, typeFilter)

    return NextResponse.json({ projects })
  } catch (error) {
    console.error('Error fetching projects:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}

async function getCachedProjectsList(userId: string, roleName: string, typeFilter: string) {
  return unstable_cache(
    async () => {
      const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { autoRefreshToken: false, persistSession: false } }
      )

      let query = supabaseAdmin
        .from('projects')
        .select(`
          *,
          company:companies(id, name),
          pm:profiles!projects_pm_id_fkey(id, full_name, email),
          tech_lead:profiles!projects_tech_lead_id_fkey(id, full_name, email),
          members:project_members(
            id,
            role,
            user:profiles(id, full_name, email, role:roles(name))
          )
        `)
        .eq('type', typeFilter)
        .order('created_at', { ascending: false })

      if (roleName === 'pm') {
        query = query.eq('pm_id', userId)
      }

      if (roleName === 'tech_lead') {
        const { data: memberProjects } = await supabaseAdmin
          .from('project_members')
          .select('project_id')
          .eq('user_id', userId)

        const memberProjectIds = memberProjects?.map(p => p.project_id) || []

        if (memberProjectIds.length > 0) {
          query = query.or(`tech_lead_id.eq.${userId},id.in.(${memberProjectIds.join(',')})`)
        } else {
          query = query.eq('tech_lead_id', userId)
        }
      }

      if (roleName === 'developer' || roleName === 'stakeholder') {
        const { data: memberProjects } = await supabaseAdmin
          .from('project_members')
          .select('project_id')
          .eq('user_id', userId)

        const memberProjectIds = memberProjects?.map(p => p.project_id) || []

        if (memberProjectIds.length === 0) return []

        query = query.in('id', memberProjectIds)
      }

      const { data: projects, error } = await query

      if (error) throw new Error(error.message)

      let projectsWithParent: unknown[] = projects || []
      if (typeFilter === 'change_control' && projects && projects.length > 0) {
        const parentIds = [...new Set(projects.map((p: { parent_project_id: string | null }) => p.parent_project_id).filter(Boolean))]
        if (parentIds.length > 0) {
          const { data: parentProjects } = await supabaseAdmin
            .from('projects')
            .select('id, name')
            .in('id', parentIds)
          const parentMap = new Map((parentProjects || []).map((p: { id: string; name: string }) => [p.id, p]))
          projectsWithParent = projects.map((p: { parent_project_id: string | null }) => ({
            ...p,
            parent_project: p.parent_project_id ? (parentMap.get(p.parent_project_id) || null) : null,
          }))
        }
      }

      return projectsWithParent
    },
    [`projects-list-${userId}-${roleName}-${typeFilter}`],
    { tags: [`projects-user-${userId}`, 'projects'], revalidate: 60 }
  )()
}

// POST - Crear proyecto
export async function POST(request: Request) {
  try {
    const supabaseServer = await createServerClient()
    const { data: { user } } = await supabaseServer.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Verificar permisos (admin o PM)
    const { data: profile } = await supabaseServer
      .from('profiles')
      .select('role:roles(name)')
      .eq('id', user.id)
      .single()

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const roleName = (profile?.role as any)?.name
    if (!['admin', 'pm'].includes(roleName)) {
      return NextResponse.json({ error: 'No tienes permisos' }, { status: 403 })
    }

    const body = await request.json()

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    // Si es PM y no se especificó pm_id, asignarse automáticamente
    const pmId = roleName === 'pm' && !body.pm_id ? user.id : body.pm_id

    // Crear proyecto
    const { data: project, error } = await supabaseAdmin
      .from('projects')
      .insert({
        name: body.name,
        description: body.description || null,
        company_id: body.company_id || null,
        pm_id: pmId || null,
        tech_lead_id: body.tech_lead_id || null,
        status: body.status || 'planning',
        start_date: body.start_date || null,
        end_date: body.end_date || null,
        type: body.type || 'project',
        parent_project_id: body.parent_project_id || null,
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    const projectLink = body.type === 'change_control' ? `/change-controls/${project.id}` : `/projects/${project.id}`

    // Notificar al PM asignado (solo si es diferente al creador)
    if (pmId && pmId !== user.id) {
      await createNotification(
        supabaseAdmin,
        pmId,
        user.id,
        'project_assigned',
        'Te asignaron como Project Manager',
        `Has sido asignado como PM del proyecto "${body.name}"`,
        projectLink,
        project.id
      )
    }

    // Notificar al Tech Lead asignado
    if (body.tech_lead_id) {
      await createNotification(
        supabaseAdmin,
        body.tech_lead_id,
        user.id,
        'project_assigned',
        'Te asignaron como Tech Lead',
        `Has sido asignado como Tech Lead del proyecto "${body.name}"`,
        projectLink,
        project.id
      )
    }

    // Agregar miembros si se proporcionaron
    if (body.members && body.members.length > 0) {
      const membersToInsert = body.members.map((m: { user_id: string; role: string }) => ({
        project_id: project.id,
        user_id: m.user_id,
        role: m.role,
      }))

      await supabaseAdmin.from('project_members').insert(membersToInsert)

      // Notificar a cada miembro
      for (const member of body.members) {
        await createNotification(
          supabaseAdmin,
          member.user_id,
          user.id,
          'project_assigned',
          'Te agregaron a un proyecto',
          `Has sido agregado al proyecto "${body.name}" como ${member.role === 'developer' ? 'Desarrollador' : 'Stakeholder'}`,
          projectLink,
          project.id
        )
      }
    }

    // Registrar actividad
    await supabaseAdmin.from('activity_log').insert({
      user_id: user.id,
      action: 'created',
      entity_type: body.type === 'change_control' ? 'change_control' : 'project',
      entity_id: project.id,
      entity_name: body.name,
      details: { project_id: project.id },
    })

    // Enviar emails de asignación de proyecto
    try {
      // Collect all user IDs that need profile info for email
      const profileIds: string[] = []
      if (pmId) profileIds.push(pmId)
      if (body.tech_lead_id) profileIds.push(body.tech_lead_id)
      if (body.members && body.members.length > 0) {
        for (const m of body.members) {
          profileIds.push(m.user_id)
        }
      }

      // Deduplicate profile IDs for a single batch query
      const uniqueProfileIds = [...new Set(profileIds)]

      if (uniqueProfileIds.length > 0) {
        // Batch-fetch all profiles in one query
        const { data: profiles } = await supabaseAdmin
          .from('profiles')
          .select('id, full_name, email')
          .in('id', uniqueProfileIds)

        const profileMap = new Map<string, { full_name: string; email: string }>()
        if (profiles) {
          for (const p of profiles) {
            profileMap.set(p.id, { full_name: p.full_name, email: p.email })
          }
        }

        // Build recipients list with roles
        const rawRecipients: Array<{ userId: string; email: string; fullName: string; role: string }> = []

        if (pmId) {
          const pmProfile = profileMap.get(pmId)
          if (pmProfile?.email) {
            rawRecipients.push({
              userId: pmId,
              email: pmProfile.email,
              fullName: pmProfile.full_name || '',
              role: 'Project Manager',
            })
          }
        }

        if (body.tech_lead_id) {
          const tlProfile = profileMap.get(body.tech_lead_id)
          if (tlProfile?.email) {
            rawRecipients.push({
              userId: body.tech_lead_id,
              email: tlProfile.email,
              fullName: tlProfile.full_name || '',
              role: 'Tech Lead',
            })
          }
        }

        if (body.members && body.members.length > 0) {
          for (const member of body.members) {
            const memberProfile = profileMap.get(member.user_id)
            if (memberProfile?.email) {
              const roleName = member.role === 'developer' ? 'Desarrollador' : 'Stakeholder'
              rawRecipients.push({
                userId: member.user_id,
                email: memberProfile.email,
                fullName: memberProfile.full_name || '',
                role: roleName,
              })
            }
          }
        }

        // Deduplicate and exclude the creator
        const recipients = deduplicateRecipients(rawRecipients, user.id)

        // Send email to each unique recipient
        for (const recipient of recipients) {
          await supabaseAdmin.functions.invoke('send-email', {
            body: {
              to: recipient.email,
              subject: `Asignación a proyecto: ${body.name}`,
              type: 'project_assigned',
              data: {
                recipientName: recipient.fullName,
                projectName: body.name,
                roles: recipient.roles,
                projectUrl: `${process.env.NEXT_PUBLIC_APP_URL}/projects/${project.id}`,
              },
            },
          })
        }
      }
    } catch (emailError) {
      console.error('Error sending project assignment emails:', emailError)
    }

    revalidateTag('projects', 'max')

    return NextResponse.json({ project })
  } catch (error) {
    console.error('Error creating project:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
