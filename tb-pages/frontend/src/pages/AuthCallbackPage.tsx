import { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import type { User } from '../contexts/AuthContext'

export function AuthCallbackPage() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const { setUser } = useAuth()

  useEffect(() => {
    const token = params.get('token')
    if (!token) {
      navigate('/login?error=invalid_token', { replace: true })
      return
    }

    fetch('/api/auth/finalize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ token }),
    })
      .then(r => r.ok ? (r.json() as Promise<{ ok: boolean; user: User }>) : null)
      .then(data => {
        if (data?.ok && data.user) {
          setUser(data.user)
          navigate('/gallery', { replace: true })
        } else {
          navigate('/login?error=invalid_token', { replace: true })
        }
      })
      .catch(() => navigate('/login?error=invalid_token', { replace: true }))
  }, [])

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ color: '#666', fontSize: 16 }}>ログイン中...</p>
    </div>
  )
}
