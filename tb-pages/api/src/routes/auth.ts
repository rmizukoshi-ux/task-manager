import { Hono } from 'hono'
import { signJWT, verifyJWT } from '../lib/jwt'
import { getRole } from '../lib/roles'
import type { Env } from '../index'
import { requireAuth, type AuthVars } from '../middleware/auth'

const auth = new Hono<{ Bindings: Env; Variables: AuthVars }>()

function cookieStr(token: string, isHttps: boolean, maxAge = 28800): string {
  const flags = ['HttpOnly', 'SameSite=Lax', 'Path=/', `Max-Age=${maxAge}`]
  if (isHttps) flags.push('Secure')
  return `auth_token=${token}; ${flags.join('; ')}`
}

// Step 1: redirect browser to Google
auth.get('/google', (c) => {
  const url = new URL(c.req.url)
  const callbackUrl = `${url.protocol}//${url.host}/api/auth/callback`
  const params = new URLSearchParams({
    client_id: c.env.GOOGLE_CLIENT_ID,
    redirect_uri: callbackUrl,
    response_type: 'code',
    scope: 'openid email profile',
    hd: c.env.ALLOWED_DOMAIN,
    access_type: 'online',
    prompt: 'select_account',
  })
  return c.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params}`)
})

// Step 2: Google redirects back here with ?code=
auth.get('/callback', async (c) => {
  const code = c.req.query('code')
  const url = new URL(c.req.url)
  const frontendOrigin = c.env.FRONTEND_URL || (url.hostname === 'localhost' ? 'http://localhost:5173' : `https://tb-pages.${c.env.ALLOWED_DOMAIN}`)
  if (!code || c.req.query('error')) return c.redirect(`${frontendOrigin}/login?error=oauth_denied`)

  const callbackUrl = `${url.protocol}//${url.host}/api/auth/callback`

  // Exchange code for tokens
  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: c.env.GOOGLE_CLIENT_ID,
      client_secret: c.env.GOOGLE_CLIENT_SECRET,
      redirect_uri: callbackUrl,
      grant_type: 'authorization_code',
    }),
  })
  if (!tokenRes.ok) {
    const errText = await tokenRes.text()
    console.error('Token exchange failed:', tokenRes.status, errText)
    return c.redirect(`${frontendOrigin}/login?error=token_exchange`)
  }

  const tokenData = await tokenRes.json<{ id_token?: string; access_token?: string }>()
  const { id_token } = tokenData
  console.log('id_token present:', !!id_token)

  if (!id_token) return c.redirect(`${frontendOrigin}/login?error=token_exchange`)

  // Verify via Google's tokeninfo endpoint (validates signature + expiry)
  const infoRes = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${id_token}`)
  if (!infoRes.ok) {
    const errText = await infoRes.text()
    console.error('Tokeninfo failed:', infoRes.status, errText)
    return c.redirect(`${frontendOrigin}/login?error=invalid_token`)
  }

  const info = await infoRes.json<{
    email: string
    name: string
    picture: string
    hd?: string
    email_verified: string
    aud: string
  }>()

  console.log('Token aud:', info.aud)
  console.log('Expected client_id:', c.env.GOOGLE_CLIENT_ID.trim())
  console.log('aud matches:', info.aud === c.env.GOOGLE_CLIENT_ID.trim())

  // Security: verify audience matches our client ID
  if (info.aud !== c.env.GOOGLE_CLIENT_ID.trim()) return c.redirect(`${frontendOrigin}/login?error=invalid_token`)

  // Security: backend domain check — MUST NOT rely on frontend hd param alone
  if (info.hd !== c.env.ALLOWED_DOMAIN) return c.redirect(`${frontendOrigin}/login?error=domain_not_allowed`)
  if (info.email_verified !== 'true') return c.redirect(`${frontendOrigin}/login?error=email_not_verified`)

  const role = getRole(info.email, c.env.ADMIN_EMAILS, c.env.UPLOADER_EMAILS)
  const jwt = await signJWT(
    { sub: info.email, name: info.name, picture: info.picture, role },
    c.env.JWT_SECRET
  )

  return c.redirect(`${frontendOrigin}/auth/callback?token=${encodeURIComponent(jwt)}`)
})

// Step 3: frontend calls this (through proxy) to set the HttpOnly cookie
auth.post('/finalize', async (c) => {
  const { token } = await c.req.json<{ token: string }>()
  if (!token) return c.json({ error: 'Missing token' }, 400)

  const payload = await verifyJWT(token, c.env.JWT_SECRET)
  if (!payload) return c.json({ error: 'Invalid token' }, 401)

  const isHttps = new URL(c.req.url).protocol === 'https:'
  const res = c.json({
    ok: true,
    user: { email: payload.sub, name: payload.name, picture: payload.picture, role: payload.role },
  })
  res.headers.set('Set-Cookie', cookieStr(token, isHttps))
  return res
})

auth.post('/logout', (c) => {
  const isHttps = new URL(c.req.url).protocol === 'https:'
  const res = c.json({ ok: true })
  res.headers.set('Set-Cookie', cookieStr('', isHttps, 0))
  return res
})

auth.get('/me', requireAuth, (c) => {
  const u = c.get('user')
  return c.json({ email: u.sub, name: u.name, picture: u.picture, role: u.role })
})

export default auth
