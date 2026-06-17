export interface JWTPayload {
  sub: string
  name: string
  picture?: string
  role: 'ADMIN' | 'UPLOADER' | 'VIEWER'
  iat: number
  exp: number
}

function b64uEncode(data: Uint8Array): string {
  let binary = ''
  for (let i = 0; i < data.length; i++) binary += String.fromCharCode(data[i])
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
}

function b64uDecode(str: string): Uint8Array {
  str = str.replace(/-/g, '+').replace(/_/g, '/')
  while (str.length % 4) str += '='
  const binary = atob(str)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return bytes
}

async function getKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  )
}

export async function signJWT(
  payload: Omit<JWTPayload, 'iat' | 'exp'>,
  secret: string,
  expiresInSeconds = 28800
): Promise<string> {
  const now = Math.floor(Date.now() / 1000)
  const full: JWTPayload = { ...payload, iat: now, exp: now + expiresInSeconds }

  const header = b64uEncode(new TextEncoder().encode(JSON.stringify({ alg: 'HS256', typ: 'JWT' })))
  const body = b64uEncode(new TextEncoder().encode(JSON.stringify(full)))
  const sigInput = `${header}.${body}`

  const key = await getKey(secret)
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(sigInput))
  return `${sigInput}.${b64uEncode(new Uint8Array(sig))}`
}

export async function verifyJWT(token: string, secret: string): Promise<JWTPayload | null> {
  const parts = token.split('.')
  if (parts.length !== 3) return null

  const [header, body, sig] = parts
  const key = await getKey(secret)

  const valid = await crypto.subtle.verify(
    'HMAC',
    key,
    b64uDecode(sig),
    new TextEncoder().encode(`${header}.${body}`)
  )
  if (!valid) return null

  try {
    const payload: JWTPayload = JSON.parse(new TextDecoder().decode(b64uDecode(body)))
    if (payload.exp < Math.floor(Date.now() / 1000)) return null
    return payload
  } catch {
    return null
  }
}
