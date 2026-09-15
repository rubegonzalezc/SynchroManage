import { revalidateTag } from 'next/cache'
import { NextResponse } from 'next/server'
import { requireAppAdmin } from '@/lib/auth/require-app-admin'
import { deleteUserWithBetterAuth } from '@/lib/auth/user-management'

export async function DELETE(request: Request) {
  try {
    const auth = await requireAppAdmin()
    if (auth.error) return auth.error

    const { user } = auth
    const { userId } = await request.json()

    if (!userId) {
      return NextResponse.json({ error: 'ID de usuario requerido' }, { status: 400 })
    }

    if (userId === user.id) {
      return NextResponse.json({ error: 'No puedes eliminarte a ti mismo' }, { status: 400 })
    }

    try {
      await deleteUserWithBetterAuth(userId)
      revalidateTag('users', 'max')
      revalidateTag(`user-${userId}`, 'max')
    } catch (deleteError) {
      const message =
        deleteError instanceof Error ? deleteError.message : 'Error al eliminar usuario'
      return NextResponse.json({ error: message }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting user:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

