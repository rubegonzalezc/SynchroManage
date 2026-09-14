import { NextResponse } from 'next/server'
import { revalidateTag } from 'next/cache'
import { getApiUser } from '@/lib/auth/server'
import { createAdminClient } from '@/lib/supabase/admin'

const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/gif', 'image/webp'])
const MAX_SIZE = 2 * 1024 * 1024

export async function POST(request: Request) {
  try {
    const user = await getApiUser()
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file')

    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'Archivo requerido' }, { status: 400 })
    }

    if (!ALLOWED_TYPES.has(file.type)) {
      return NextResponse.json(
        { error: 'Solo se permiten imágenes (JPG, PNG, GIF, WebP)' },
        { status: 400 }
      )
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: 'La imagen no puede superar los 2MB' }, { status: 400 })
    }

    const admin = createAdminClient()
    const { data: profile } = await admin
      .from('profiles')
      .select('avatar_url')
      .eq('id', user.id)
      .single()

    const fileExt = file.name.split('.').pop() || 'jpg'
    const filePath = `profiles/${user.id}/${Date.now()}.${fileExt}`

    if (profile?.avatar_url) {
      const oldPath = profile.avatar_url.split('/uploads/')[1]
      if (oldPath) {
        await admin.storage.from('uploads').remove([oldPath])
      }
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const { error: uploadError } = await admin.storage
      .from('uploads')
      .upload(filePath, buffer, {
        contentType: file.type,
        cacheControl: '3600',
        upsert: true,
      })

    if (uploadError) {
      return NextResponse.json({ error: uploadError.message }, { status: 400 })
    }

    const { data: { publicUrl } } = admin.storage.from('uploads').getPublicUrl(filePath)

    const { error: updateError } = await admin
      .from('profiles')
      .update({
        avatar_url: publicUrl,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id)

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 400 })
    }

    revalidateTag(`user-${user.id}`, 'max')

    return NextResponse.json({ avatar_url: publicUrl })
  } catch (error) {
    console.error('Error uploading avatar:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
