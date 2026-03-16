const ACCESS_TOKEN_COOKIE = 'sb_lead_access_token'
const REFRESH_TOKEN_COOKIE = 'sb_lead_refresh_token'
const COOKIE_MAX_AGE_ACCESS = 60 * 60 // 1 hour
const COOKIE_MAX_AGE_REFRESH = 60 * 60 * 24 * 7 // 7 days

function cookieOptions(maxAge: number, name: string, value: string) {
  const isProd = process.env.NODE_ENV === 'production'
  const parts = [
    `${name}=${encodeURIComponent(value)}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    `Max-Age=${maxAge}`,
  ]
  if (isProd) parts.push('Secure')
  return parts.join('; ')
}

export function buildSessionCookieValues(session: { access_token: string; refresh_token: string }): string[] {
  return [
    cookieOptions(COOKIE_MAX_AGE_ACCESS, ACCESS_TOKEN_COOKIE, session.access_token),
    cookieOptions(COOKIE_MAX_AGE_REFRESH, REFRESH_TOKEN_COOKIE, session.refresh_token),
  ]
}

export function getAccessTokenFromCookie(cookieHeader: string | null): string | null {
  if (!cookieHeader) return null
  const match = cookieHeader.match(new RegExp(`${ACCESS_TOKEN_COOKIE}=([^;]+)`))
  if (!match) return null
  try {
    return decodeURIComponent(match[1].trim())
  } catch {
    return null
  }
}

export function getRefreshTokenFromCookie(cookieHeader: string | null): string | null {
  if (!cookieHeader) return null
  const match = cookieHeader.match(new RegExp(`${REFRESH_TOKEN_COOKIE}=([^;]+)`))
  if (!match) return null
  try {
    return decodeURIComponent(match[1].trim())
  } catch {
    return null
  }
}

export function getClearSessionCookieValues(): string[] {
  const clear = (name: string) =>
    `${name}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`
  return [clear(ACCESS_TOKEN_COOKIE), clear(REFRESH_TOKEN_COOKIE)]
}

export { ACCESS_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE }

export async function getAuthenticatedUser(cookieHeader: string | null): Promise<{ id: string } | null> {
  if (!cookieHeader) return null
  const accessToken = getAccessTokenFromCookie(cookieHeader)
  if (!accessToken) return null
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!supabaseUrl || !supabaseAnonKey) return null
  const { createClient } = await import('@supabase/supabase-js')
  const supabase = createClient(supabaseUrl, supabaseAnonKey)
  const { data: { user }, error } = await supabase.auth.getUser(accessToken)
  if (error || !user) return null
  return { id: user.id }
}
