import { Hono } from 'hono'
import { requireAuth, requireRole, type AuthVars } from '../middleware/auth'
import { createViewerToken } from '../lib/viewerToken'
import type { Env } from '../index'

type DocRow = {
  id: string
  title: string
  category: string
  description: string | null
  is_public: number
  uploaded_by: string
  created_at: string
  updated_at: string
}

const VALID_CATEGORIES = ['会社説明', '採用資料', '営業資料', 'その他'] as const
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

const docs = new Hono<{ Bindings: Env; Variables: AuthVars }>()
docs.use('*', requireAuth)

// GET /api/documents
docs.get('/', async (c) => {
  const { category, is_public, sort } = c.req.query()

  const conditions: string[] = []
  const params: (string | number)[] = []

  if (category) {
    conditions.push('category = ?')
    params.push(category)
  }
  if (is_public !== undefined && is_public !== '') {
    conditions.push('is_public = ?')
    params.push(Number(is_public))
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''
  const order = sort === 'title' ? 'title ASC' : 'created_at DESC'

  const result = await c.env.DB.prepare(
    `SELECT id, title, category, description, is_public, uploaded_by, created_at, updated_at FROM documents ${where} ORDER BY ${order}`
  ).bind(...params).all<DocRow>()

  return c.json(result.results)
})

// POST /api/documents
docs.post('/', requireRole('ADMIN', 'UPLOADER'), async (c) => {
  let formData: FormData
  try {
    formData = await c.req.formData()
  } catch {
    return c.json({ error: 'multipart/form-dataで送信してください' }, 400)
  }

  const file = formData.get('file') as File | null
  const title = (formData.get('title') as string | null)?.trim()
  const category = formData.get('category') as string | null
  const description = (formData.get('description') as string | null)?.trim() || null

  if (!file) return c.json({ error: 'ファイルは必須です' }, 400)
  if (!title) return c.json({ error: 'タイトルは必須です' }, 400)
  if (!category) return c.json({ error: 'カテゴリは必須です' }, 400)
  if (title.length > 50) return c.json({ error: 'タイトルは50文字以内で入力してください' }, 400)
  if (description && description.length > 200) return c.json({ error: '説明は200文字以内で入力してください' }, 400)
  if (!(VALID_CATEGORIES as readonly string[]).includes(category)) return c.json({ error: '無効なカテゴリです' }, 400)

  const name = file.name.toLowerCase()
  if (!name.endsWith('.html') && !name.endsWith('.htm')) {
    return c.json({ error: 'HTMLファイル（.html）のみアップロードできます' }, 400)
  }
  if (file.size > MAX_FILE_SIZE) {
    return c.json({ error: 'ファイルサイズは10MB以内にしてください' }, 400)
  }

  const content = await file.arrayBuffer()

  // Verify Content-Type from actual bytes (must start with valid HTML/text)
  const firstBytes = new TextDecoder('utf-8', { fatal: false, ignoreBOM: false }).decode(content.slice(0, 512))
  const hasHtmlMarker =
    firstBytes.toLowerCase().includes('<!doctype') ||
    firstBytes.toLowerCase().includes('<html') ||
    firstBytes.toLowerCase().includes('<head') ||
    firstBytes.toLowerCase().includes('<body')

  if (!hasHtmlMarker && !name.endsWith('.html')) {
    return c.json({ error: 'HTMLファイルの内容が確認できませんでした' }, 400)
  }

  const id = crypto.randomUUID()
  const r2Key = `html/${id}.html`
  const now = new Date().toISOString()
  const user = c.get('user')

  await c.env.STORAGE.put(r2Key, content, {
    httpMetadata: { contentType: 'text/html; charset=utf-8' },
  })

  await c.env.DB.prepare(
    `INSERT INTO documents (id, title, category, description, r2_key, is_public, uploaded_by, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, 0, ?, ?, ?)`
  ).bind(id, title, category, description, r2Key, user.sub, now, now).run()

  return c.json({ id, title, category }, 201)
})

// GET /api/documents/:id/download
docs.get('/:id/download', async (c) => {
  const { id } = c.req.param()
  const doc = await c.env.DB.prepare(
    'SELECT title, r2_key FROM documents WHERE id = ?'
  ).bind(id).first<{ title: string; r2_key: string }>()

  if (!doc) return c.json({ error: 'Not Found' }, 404)

  const object = await c.env.STORAGE.get(doc.r2_key)
  if (!object) return c.json({ error: 'File not found' }, 404)

  const filename = encodeURIComponent(`${doc.title}.html`)
  return new Response(object.body, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Content-Disposition': `attachment; filename*=UTF-8''${filename}`,
      'Access-Control-Allow-Origin': c.req.header('Origin') ?? '*',
      'Access-Control-Allow-Credentials': 'true',
    },
  })
})

// PUT /api/documents/:id/file
docs.put('/:id/file', requireRole('ADMIN', 'UPLOADER'), async (c) => {
  const { id } = c.req.param()
  const user = c.get('user')

  const doc = await c.env.DB.prepare(
    'SELECT id, r2_key, uploaded_by FROM documents WHERE id = ?'
  ).bind(id).first<{ id: string; r2_key: string; uploaded_by: string }>()
  if (!doc) return c.json({ error: 'Not Found' }, 404)

  if (user.role !== 'ADMIN' && doc.uploaded_by !== user.sub) {
    return c.json({ error: 'Forbidden' }, 403)
  }

  let formData: FormData
  try {
    formData = await c.req.formData()
  } catch {
    return c.json({ error: 'multipart/form-dataで送信してください' }, 400)
  }

  const file = formData.get('file') as File | null
  if (!file) return c.json({ error: 'ファイルは必須です' }, 400)

  const name = file.name.toLowerCase()
  if (!name.endsWith('.html') && !name.endsWith('.htm')) {
    return c.json({ error: 'HTMLファイル（.html）のみアップロードできます' }, 400)
  }
  if (file.size > MAX_FILE_SIZE) {
    return c.json({ error: 'ファイルサイズは10MB以内にしてください' }, 400)
  }

  const content = await file.arrayBuffer()
  const now = new Date().toISOString()

  await c.env.STORAGE.put(doc.r2_key, content, {
    httpMetadata: { contentType: 'text/html; charset=utf-8' },
  })
  await c.env.DB.prepare('UPDATE documents SET updated_at = ? WHERE id = ?')
    .bind(now, id).run()

  return c.json({ ok: true })
})

// GET /api/documents/:id
docs.get('/:id', async (c) => {
  const { id } = c.req.param()
  const doc = await c.env.DB.prepare(
    'SELECT id, title, category, description, is_public, uploaded_by, created_at, updated_at FROM documents WHERE id = ?'
  ).bind(id).first<DocRow>()

  if (!doc) return c.json({ error: 'Not Found' }, 404)
  return c.json(doc)
})

// GET /api/documents/:id/viewer-token
docs.get('/:id/viewer-token', async (c) => {
  const { id } = c.req.param()
  const exists = await c.env.DB.prepare('SELECT id FROM documents WHERE id = ?').bind(id).first()
  if (!exists) return c.json({ error: 'Not Found' }, 404)

  const token = await createViewerToken(id, c.env.JWT_SECRET)
  return c.json({ token })
})

// PATCH /api/documents/:id
docs.patch('/:id', async (c) => {
  const { id } = c.req.param()
  const user = c.get('user')

  const doc = await c.env.DB.prepare(
    'SELECT id, uploaded_by FROM documents WHERE id = ?'
  ).bind(id).first<{ id: string; uploaded_by: string }>()
  if (!doc) return c.json({ error: 'Not Found' }, 404)

  if (user.role !== 'ADMIN' && doc.uploaded_by !== user.sub) {
    return c.json({ error: 'Forbidden' }, 403)
  }

  const body = await c.req.json<{ title?: string; description?: string; is_public?: number }>()

  if (body.is_public !== undefined && user.role !== 'ADMIN') {
    return c.json({ error: '公開範囲の変更はADMINのみ可能です' }, 403)
  }
  if (body.title !== undefined && body.title.trim().length === 0) {
    return c.json({ error: 'タイトルは必須です' }, 400)
  }
  if (body.title && body.title.length > 50) {
    return c.json({ error: 'タイトルは50文字以内で入力してください' }, 400)
  }
  if (body.description && body.description.length > 200) {
    return c.json({ error: '説明は200文字以内で入力してください' }, 400)
  }

  const now = new Date().toISOString()
  const setClauses: string[] = ['updated_at = ?']
  const params: (string | number | null)[] = [now]

  if (body.title !== undefined) { setClauses.push('title = ?'); params.push(body.title.trim()) }
  if (body.description !== undefined) { setClauses.push('description = ?'); params.push(body.description.trim() || null) }
  if (body.is_public !== undefined) { setClauses.push('is_public = ?'); params.push(body.is_public) }

  params.push(id)
  await c.env.DB.prepare(`UPDATE documents SET ${setClauses.join(', ')} WHERE id = ?`).bind(...params).run()

  return c.json({ ok: true })
})

// DELETE /api/documents/:id
docs.delete('/:id', async (c) => {
  const { id } = c.req.param()
  const user = c.get('user')

  const doc = await c.env.DB.prepare(
    'SELECT id, r2_key, uploaded_by FROM documents WHERE id = ?'
  ).bind(id).first<{ id: string; r2_key: string; uploaded_by: string }>()
  if (!doc) return c.json({ error: 'Not Found' }, 404)

  if (user.role !== 'ADMIN' && doc.uploaded_by !== user.sub) {
    return c.json({ error: 'Forbidden' }, 403)
  }

  await c.env.STORAGE.delete(doc.r2_key)
  await c.env.DB.prepare('DELETE FROM documents WHERE id = ?').bind(id).run()

  return c.json({ ok: true })
})

export default docs
