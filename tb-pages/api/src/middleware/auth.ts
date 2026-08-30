import { createMiddleware } from 'hono/factory'
import { verifyJWT, type JWTPayload } from '../lib/jwt'
import type { Env } from '../index'

export type AuthVars = { user: JWTPayload }

function extractToken(cookieHeader: string): string | null {
  const match = cookieHeader.match(/(?:^|;\s*)auth_token=([^;]+)/)
  return match ? match[1] : null
}

export const requireAuth = createMiddleware<{ Bindings: Env; Variables: AuthVars }>(
  async (c, next) => {
    const token =
      extractToken(c.req.header('Cookie') ?? '') ??
      c.req.header('Authorization')?.replace('Bearer ', '')

    if (!token) return c.json({ error: 'Unauthorized' }, 401)
    const payload = await verifyJWT(token, c.env.JWT_SECRET)
    if (!payload) return c.json({ error: 'Unauthorized' }, 401)

    c.set('user', payload)
    await next()
  }
)

export const requireRole = (...roles: string[]) =>
  createMiddleware<{ Bindings: Env; Variables: AuthVars }>(async (c, next) => {
    const user = c.get('user')
    if (!roles.includes(user.role)) return c.json({ error: 'Forbidden' }, 403)
    await next()
  })
