export type Env = {
  DB: D1Database
  STORAGE: R2Bucket
  JWT_SECRET: string
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url)
    const match = url.pathname.match(/^\/view\/([a-zA-Z0-9-]+)$/)

    if (!match) {
      return new Response('Not Found', { status: 404 })
    }

    const id = match[1]

    const doc = await env.DB.prepare(
      'SELECT r2_key, is_public FROM documents WHERE id = ?'
    ).bind(id).first<{ r2_key: string; is_public: number }>()

    if (!doc) {
      return new Response('Not Found', { status: 404 })
    }

    // Public documents don't require auth; private ones will be gated in Phase 2
    if (doc.is_public === 0) {
      // TODO: JWT auth check (Phase 2)
    }

    const object = await env.STORAGE.get(doc.r2_key)
    if (!object) {
      return new Response('Not Found', { status: 404 })
    }

    const html = await object.text()

    return new Response(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Security-Policy':
          "default-src 'self' 'unsafe-inline' 'unsafe-eval' data: blob:;",
        'X-Frame-Options': 'SAMEORIGIN',
        'Cache-Control': 'no-store',
      },
    })
  },
}
