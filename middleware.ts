import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getAccessTokenFromCookie } from '@/lib/auth'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (!pathname.startsWith('/admin')) {
    return NextResponse.next()
  }

  if (pathname === '/admin/login') {
    return NextResponse.next()
  }

  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.redirect(new URL('/admin/login', request.url))
  }

  const cookieHeader = request.headers.get('cookie')
  const accessToken = getAccessTokenFromCookie(cookieHeader)

  if (!accessToken) {
    return NextResponse.redirect(new URL('/admin/login', request.url))
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey)
  const { data: { user }, error } = await supabase.auth.getUser(accessToken)

  if (error || !user) {
    const loginUrl = new URL('/admin/login', request.url)
    const response = NextResponse.redirect(loginUrl)
    response.headers.append('Set-Cookie', 'sb_lead_access_token=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0')
    response.headers.append('Set-Cookie', 'sb_lead_refresh_token=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0')
    return response
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin', '/admin/:path*'],
}
