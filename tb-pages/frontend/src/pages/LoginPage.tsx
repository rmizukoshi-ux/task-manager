import { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import styles from './LoginPage.module.css'

const ERROR_MESSAGES: Record<string, string> = {
  domain_not_allowed: '@a-cial.comのアカウントでログインしてください',
  email_not_verified: 'メールアドレスが確認されていません',
  token_exchange: '認証に失敗しました。もう一度お試しください',
  oauth_denied: 'ログインがキャンセルされました',
  invalid_token: '認証トークンが無効です',
}

export function LoginPage() {
  const { user, loading } = useAuth()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const error = params.get('error')

  useEffect(() => {
    if (!loading && user) navigate('/gallery', { replace: true })
  }, [user, loading, navigate])

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1 className={styles.title}>T&amp;B Pages</h1>
        <p className={styles.subtitle}>社内資料管理システム</p>
        {error && (
          <p className={styles.error}>
            {ERROR_MESSAGES[error] ?? 'エラーが発生しました'}
          </p>
        )}
        <a href={`${import.meta.env.VITE_API_BASE_URL ?? ''}/api/auth/google`} className={styles.button}>
          <GoogleIcon />
          Googleでログイン
        </a>
        <p className={styles.note}>@a-cial.comアカウント専用</p>
      </div>
    </div>
  )
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path fill="#4285F4" d="M16.51 8H8.98v3h4.3c-.18 1-.74 1.48-1.6 2.04v2.01h2.6a7.8 7.8 0 0 0 2.38-5.88c0-.57-.05-.66-.15-1.18z" />
      <path fill="#34A853" d="M8.98 17c2.16 0 3.97-.72 5.3-1.94l-2.6-2.04a4.8 4.8 0 0 1-7.18-2.54H1.83v2.07A8 8 0 0 0 8.98 17z" />
      <path fill="#FBBC05" d="M4.5 10.52a4.8 4.8 0 0 1 0-3.04V5.41H1.83a8 8 0 0 0 0 7.18l2.67-2.07z" />
      <path fill="#EA4335" d="M8.98 4.18c1.17 0 2.23.4 3.06 1.2l2.3-2.3A8 8 0 0 0 1.83 5.4L4.5 7.49a4.77 4.77 0 0 1 4.48-3.31z" />
    </svg>
  )
}
