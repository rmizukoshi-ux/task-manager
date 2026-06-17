import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import styles from './PublicViewerPage.module.css'

const SANDBOX_BASE = import.meta.env.VITE_SANDBOX_BASE_URL ?? 'http://localhost:8788'

type Doc = {
  id: string
  title: string
  category: string
  description: string | null
  created_at: string
}

export function PublicViewerPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [doc, setDoc] = useState<Doc | null>(null)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    if (!id) return
    fetch(`/api/public/documents/${id}`)
      .then(r => {
        if (r.status === 404) { setNotFound(true); return null }
        return r.ok ? r.json() as Promise<Doc> : null
      })
      .then(data => { if (data) setDoc(data) })
      .catch(() => setNotFound(true))
  }, [id])

  if (notFound) {
    return (
      <div className={styles.notFound}>
        <div className={styles.notFoundInner}>
          <p className={styles.notFoundCode}>404</p>
          <h1 className={styles.notFoundTitle}>ページが見つかりません</h1>
          <p className={styles.notFoundDesc}>お探しの資料は存在しないか、公開が終了しています。</p>
          <button className={styles.notFoundBtn} onClick={() => navigate('/')}>
            トップへ戻る
          </button>
        </div>
      </div>
    )
  }

  if (!doc) {
    return <div className={styles.loading}>読み込み中...</div>
  }

  return (
    <div className={styles.page}>
      <div className={styles.topBar}>
        <button className={styles.back} onClick={() => navigate('/')}>
          ← 一覧に戻る
        </button>
        <div className={styles.meta}>
          <span className={styles.title}>{doc.title}</span>
          <span className={styles.categoryBadge}>{doc.category}</span>
        </div>
      </div>

      <div className={styles.iframeContainer}>
        <iframe
          src={`${SANDBOX_BASE}/view/${id}`}
          sandbox="allow-scripts allow-same-origin"
          loading="lazy"
          className={styles.iframe}
          title={doc.title}
        />
      </div>
    </div>
  )
}
