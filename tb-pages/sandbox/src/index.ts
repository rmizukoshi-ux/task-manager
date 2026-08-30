import { verifyViewerToken } from './lib/viewerToken'

export type Env = {
  DB: D1Database
  STORAGE: R2Bucket
  JWT_SECRET: string
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url)
    const match = url.pathname.match(/^\/view\/([0-9a-f-]{36})$/)

    if (!match) {
      return new Response('Not Found', { status: 404 })
    }

    const id = match[1]

    const doc = await env.DB.prepare(
      'SELECT r2_key, is_public FROM documents WHERE id = ?'
    ).bind(id).first<{ r2_key: string; is_public: number }>()

    if (!doc) return new Response('Not Found', { status: 404 })

    // Private documents require a valid viewer token
    if (doc.is_public === 0) {
      const token = url.searchParams.get('t')
      if (!token) return new Response('Unauthorized', { status: 401 })
      const valid = await verifyViewerToken(token, id, env.JWT_SECRET)
      if (!valid) return new Response('Unauthorized', { status: 401 })
    }

    const object = await env.STORAGE.get(doc.r2_key)
    if (!object) return new Response('Not Found', { status: 404 })

    return new Response(object.body, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Security-Policy':
          "default-src 'self' 'unsafe-inline' 'unsafe-eval' data: blob:; frame-ancestors https://tb-pages-frontend.pages.dev https://*.tb-pages-frontend.pages.dev http://localhost:5173",
        'Cache-Control': 'no-store',
      },
    })
  },
}
