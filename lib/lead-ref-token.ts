import crypto from 'crypto'

const ALGORITHM = 'sha256'
const EXPIRY_HOURS = 24

function getSecret(): string {
  const secret = process.env.INSTAGRAM_REF_SECRET
  if (!secret || secret.length < 16) {
    throw new Error('INSTAGRAM_REF_SECRET が設定されていないか、16文字以上で設定してください')
  }
  return secret
}

function base64UrlEncode(buf: Buffer): string {
  return buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function base64UrlDecode(str: string): Buffer {
  const base64 = str.replace(/-/g, '+').replace(/_/g, '/')
  const pad = base64.length % 4
  const padded = pad ? base64 + '='.repeat(4 - pad) : base64
  return Buffer.from(padded, 'base64')
}

export interface LeadRefPayload {
  lead_id: string
  exp: number
}

/**
 * 診断ツールへ渡す署名付きトークンを発行する。
 * Thanks ページ経由で account-check に渡し、送信時に set-instagram API で検証する。
 */
export function createLeadRefToken(leadId: string): string {
  const secret = getSecret()
  const exp = Math.floor(Date.now() / 1000) + EXPIRY_HOURS * 3600
  const payload: LeadRefPayload = { lead_id: leadId, exp }
  const payloadStr = JSON.stringify(payload)
  const payloadB64 = base64UrlEncode(Buffer.from(payloadStr, 'utf8'))
  const sig = crypto.createHmac(ALGORITHM, secret).update(payloadB64).digest()
  const sigB64 = base64UrlEncode(sig)
  return `${payloadB64}.${sigB64}`
}

/**
 * トークンを検証し、有効なら lead_id を返す。無効・期限切れなら null。
 */
export function verifyLeadRefToken(ref: string): string | null {
  try {
    const secret = process.env.INSTAGRAM_REF_SECRET
    if (!secret || secret.length < 16) return null

    const dot = ref.indexOf('.')
    if (dot === -1) return null
    const payloadB64 = ref.slice(0, dot)
    const sigB64 = ref.slice(dot + 1)
    const sig = base64UrlDecode(sigB64)
    const expectedSig = crypto.createHmac(ALGORITHM, secret).update(payloadB64).digest()
    if (sig.length !== expectedSig.length || !crypto.timingSafeEqual(sig, expectedSig)) {
      return null
    }
    const payloadStr = base64UrlDecode(payloadB64).toString('utf8')
    const payload = JSON.parse(payloadStr) as LeadRefPayload
    if (!payload.lead_id || typeof payload.exp !== 'number') return null
    if (payload.exp < Math.floor(Date.now() / 1000)) return null
    return payload.lead_id
  } catch {
    return null
  }
}
