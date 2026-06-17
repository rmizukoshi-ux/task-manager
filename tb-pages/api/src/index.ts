import { Hono } from 'hono'
import { cors } from 'hono/cors'
import authRoutes from './routes/auth'
import documentRoutes from './routes/documents'
import publicRoutes from './routes/public'

export type Env = {
  DB: D1Database
  STORAGE: R2Bucket
  GOOGLE_CLIENT_ID: string
  GOOGLE_CLIENT_SECRET: string
  JWT_SECRET: string
  ADMIN_EMAILS: string
  UPLOADER_EMAILS: string
  ALLOWED_DOMAIN: string
  ENVIRONMENT: string
}

const app = new Hono<{ Bindings: Env }>()

app.use('*', cors({
  origin: (origin) => {
    if (!origin) return null
    const allowed = ['http://localhost:5173', 'https://tb-pages.a-cial.com']
    return allowed.includes(origin) ? origin : null
  },
  credentials: true,
}))

app.get('/api/health', (c) => c.json({ status: 'ok', env: c.env.ENVIRONMENT }))

app.route('/api/auth', authRoutes)
app.route('/api/documents', documentRoutes)
app.route('/api/public', publicRoutes)

export default app
