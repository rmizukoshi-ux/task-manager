import { Hono } from 'hono'
import { cors } from 'hono/cors'

export type Env = {
  DB: D1Database
  STORAGE: R2Bucket
  GOOGLE_CLIENT_ID: string
  GOOGLE_CLIENT_SECRET: string
  JWT_SECRET: string
  ADMIN_EMAILS: string
  UPLOADER_EMAILS: string
  ENVIRONMENT: string
}

const app = new Hono<{ Bindings: Env }>()

app.use('*', cors({
  origin: ['https://tb-pages.acial.com', 'http://localhost:5173'],
  credentials: true,
}))

app.get('/api/health', (c) => {
  return c.json({ status: 'ok', env: c.env.ENVIRONMENT })
})

export default app
