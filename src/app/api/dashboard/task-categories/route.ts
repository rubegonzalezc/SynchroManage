import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { TASK_CATEGORIES } from '@/lib/constants/categories'

// GET - Obtener todas las categorías de tareas desde la tabla task_categories
export async function GET() {
  try {
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    const { data, error } = await supabaseAdmin
      .from('task_categories')
      .select('*')
      .order('order_index', { ascending: true })

    if (error) {
      // Fallback a constantes si la tabla aún no existe o hay error
      console.warn('Error fetching task_categories from DB, using constants fallback:', error.message)
      return NextResponse.json({ categories: TASK_CATEGORIES })
    }

    // Normalizar el campo order_index del snake_case de la BD al camelCase del tipo
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const categories = (data || []).map((row: any) => ({
      slug: row.slug,
      label: row.label,
      icon: row.icon,
      color: row.color,
      orderIndex: row.order_index,
    }))

    return NextResponse.json({ categories })
  } catch (error) {
    console.error('Error fetching task categories:', error)
    // Fallback a constantes
    return NextResponse.json({ categories: TASK_CATEGORIES })
  }
}
