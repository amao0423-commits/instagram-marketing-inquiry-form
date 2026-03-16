import { NextResponse } from 'next/server'
import { getClearSessionCookieValues } from '@/lib/auth'

export async function POST() {
  const response = NextResponse.json({ success: true })
  getClearSessionCookieValues().forEach((value) => response.headers.append('Set-Cookie', value))
  return response
}
