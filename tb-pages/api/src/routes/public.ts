import { Hono } from 'hono'
import type { Env } from '../index'

type PublicDoc = {
  id: string
  title: string
  category: string
  description: string | null
  uploaded_by: string
  created_at: string
}

const pub = new Hono<{ Bindings: Env }>()

// No auth required on all routes in this file

// GET /api/public/documents
pub.get('/documents', async (c) => {
  const { category, sort } = c.req.query()

  const conditions = ['is_public = 1']
  const params: (string | number)[] = []

  if (category) {
    conditions.push('category = ?')
    params.push(category)
  }

  const order = sort === 'title' ? 'title ASC' : 'created_at DESC'

  const result = await c.env.DB.prepare(
    `SELECT id, title, category, description, uploaded_by, created_at
     FROM documents
     WHERE ${conditions.join(' AND ')}
     ORDER BY ${order}`
  ).bind(...params).all<PublicDoc>()

  return c.json(result.results)
})

// GET /api/public/documents/:id
pub.get('/documents/:id', async (c) => {
  const { id } = c.req.param()

  const doc = await c.env.DB.prepare(
    `SELECT id, title, category, description, uploaded_by, created_at
     FROM documents
     WHERE id = ? AND is_public = 1`
  ).bind(id).first<PublicDoc>()

  // Return 404 whether not found OR private — never reveal the document exists
  if (!doc) return c.json({ error: 'Not Found' }, 404)

  return c.json(doc)
})

export default pub
