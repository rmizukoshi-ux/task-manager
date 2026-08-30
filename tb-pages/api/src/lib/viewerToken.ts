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

async function getKey(secret: string, usage: 'sign' | 'verify'): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    [usage]
  )
}

// Creates a short-lived HMAC token: "<expiry>.<signature>"
export async function createViewerToken(docId: string, secret: string, ttlSeconds = 300): Promise<string> {
  const expiry = Math.floor(Date.now() / 1000) + ttlSeconds
  const message = `${docId}:${expiry}`
  const key = await getKey(secret, 'sign')
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(message))
  return `${expiry}.${b64uEncode(new Uint8Array(sig))}`
}

export async function verifyViewerToken(token: string, docId: string, secret: string): Promise<boolean> {
  const dotIdx = token.indexOf('.')
  if (dotIdx === -1) return false
  const expiryStr = token.slice(0, dotIdx)
  const sig = token.slice(dotIdx + 1)

  const expiry = parseInt(expiryStr, 10)
  if (isNaN(expiry) || expiry < Math.floor(Date.now() / 1000)) return false

  const key = await getKey(secret, 'verify')
  return crypto.subtle.verify('HMAC', key, b64uDecode(sig), new TextEncoder().encode(`${docId}:${expiry}`))
}
