import { NextResponse } from 'next/server'

/** @deprecated Supabase Auth callback — redirige al login (Better Auth). */
export async function GET(request: Request) {
  const { origin } = new URL(request.url)
  return NextResponse.redirect(`${origin}/login`)
}
