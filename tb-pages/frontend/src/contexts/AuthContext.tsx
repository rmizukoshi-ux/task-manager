import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'

export type Role = 'ADMIN' | 'UPLOADER' | 'VIEWER'

export interface User {
  email: string
  name: string
  picture?: string
  role: Role
}

interface AuthContextValue {
  user: User | null
  loading: boolean
  logout: () => Promise<void>
  setUser: (user: User | null) => void
  authFetch: (input: RequestInfo, init?: RequestInit) => Promise<Response>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  const API = import.meta.env.VITE_API_BASE_URL ?? ''

  useEffect(() => {
    fetch(`${API}/api/auth/me`, { credentials: 'include' })
      .then(r => r.ok ? (r.json() as Promise<User>) : null)
      .then(data => setUser(data))
      .catch(() => setUser(null))
      .finally(() => setLoading(false))
  }, [])

  const logout = async () => {
    await fetch(`${API}/api/auth/logout`, { method: 'POST', credentials: 'include' })
    setUser(null)
  }

  // Fetch wrapper that auto-redirects to /login on 401 (session expired)
  const authFetch = useCallback(async (input: RequestInfo, init?: RequestInit): Promise<Response> => {
    const res = await fetch(input, { credentials: 'include', ...init })
    if (res.status === 401) {
      setUser(null)
      window.location.href = '/login'
    }
    return res
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading, logout, setUser, authFetch }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
