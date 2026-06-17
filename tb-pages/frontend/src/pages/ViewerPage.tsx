import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import styles from './ViewerPage.module.css'

const SANDBOX_BASE = import.meta.env.VITE_SANDBOX_BASE_URL ?? 'http://localhost:8788'

type Doc = {
  id: string
  title: string
  category: string
  description: string | null
  is_public: number
  uploaded_by: string
  created_at: string
}

export function ViewerPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user, authFetch } = useAuth()
  const iframeRef = useRef<HTMLIFrameElement>(null)

  const [doc, setDoc] = useState<Doc | null>(null)
  const [sandboxUrl, setSandboxUrl] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showPublicConfirm, setShowPublicConfirm] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const isOwnerOrAdmin = user?.role === 'ADMIN' || doc?.uploaded_by === user?.email
  const canManage = user?.role === 'ADMIN' || user?.role === 'UPLOADER'

  useEffect(() => {
    if (!id) return

    Promise.all([
      authFetch(`/api/documents/${id}`),
      authFetch(`/api/documents/${id}/viewer-token`),
    ])
      .then(async ([docRes, tokenRes]) => {
        if (!docRes.ok) { setError('資料が見つかりません'); return }
        const [docData, tokenData] = await Promise.all([
          docRes.json() as Promise<Doc>,
          tokenRes.ok ? tokenRes.json() as Promise<{ token: string }> : Promise.resolve(null),
        ])
        setDoc(docData)
        const tokenParam = tokenData?.token ? `?t=${encodeURIComponent(tokenData.token)}` : ''
        setSandboxUrl(`${SANDBOX_BASE}/view/${id}${tokenParam}`)
      })
      .catch(() => setError('読み込みに失敗しました'))
      .finally(() => setLoading(false))
  }, [id])

  const togglePublic = async () => {
    if (!doc || !id) return
    const newValue = doc.is_public ? 0 : 1
    const res = await authFetch(`/api/documents/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_public: newValue }),
    })
    if (res.ok) setDoc({ ...doc, is_public: newValue })
    setShowPublicConfirm(false)
  }

  const handleDelete = async () => {
    if (!id) return
    const res = await authFetch(`/api/documents/${id}`, { method: 'DELETE' })
    if (res.ok) navigate('/gallery')
    setShowDeleteConfirm(false)
  }

  if (loading) return <div className={styles.center}>読み込み中...</div>
  if (error || !doc) return <div className={styles.center}>{error || '資料が見つかりません'}</div>

  return (
    <div className={styles.page}>
      <div className={styles.topBar}>
        <button className={styles.back} onClick={() => navigate('/gallery')}>← ギャラリーに戻る</button>
        <div className={styles.docMeta}>
          <span className={styles.docTitle}>{doc.title}</span>
          <span className={styles.categoryBadge}>{doc.category}</span>
          <span className={`${styles.visibilityBadge} ${doc.is_public ? styles.badgePublic : styles.badgePrivate}`}>
            {doc.is_public ? '外部公開' : '社内限定'}
          </span>
        </div>
        {canManage && isOwnerOrAdmin && (
          <div className={styles.actions}>
            {user?.role === 'ADMIN' && (
              <button
                className={doc.is_public ? styles.btnDanger : styles.btnPrimary}
                onClick={() => setShowPublicConfirm(true)}
              >
                {doc.is_public ? '社内限定に戻す' : '外部公開する'}
              </button>
            )}
            <button className={styles.btnSecondary} onClick={() => navigate(`/edit/${id}`)}>
              編集
            </button>
            <button className={styles.btnDanger} onClick={() => setShowDeleteConfirm(true)}>
              削除
            </button>
          </div>
        )}
      </div>

      <div className={styles.iframeContainer}>
        {sandboxUrl && (
          <iframe
            ref={iframeRef}
            src={sandboxUrl}
            sandbox="allow-scripts allow-same-origin"
            loading="lazy"
            className={styles.iframe}
            title={doc.title}
          />
        )}
      </div>

      {/* 公開範囲変更確認ダイアログ */}
      {showPublicConfirm && (
        <div className={styles.overlay} onClick={() => setShowPublicConfirm(false)}>
          <div className={styles.dialog} onClick={e => e.stopPropagation()}>
            <h3 className={styles.dialogTitle}>
              {doc.is_public ? '社内限定に戻しますか？' : '外部公開しますか？'}
            </h3>
            <p className={styles.dialogBody}>
              {doc.is_public
                ? 'この資料を社内限定に戻します。外部からのアクセスができなくなります。'
                : 'この資料を外部公開します。社外から誰でも閲覧可能になります。よろしいですか？'}
            </p>
            <div className={styles.dialogActions}>
              <button className={styles.btnSecondary} onClick={() => setShowPublicConfirm(false)}>キャンセル</button>
              <button className={doc.is_public ? styles.btnSecondary : styles.btnPrimary} onClick={togglePublic}>
                {doc.is_public ? '社内限定に戻す' : '外部公開する'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 削除確認ダイアログ */}
      {showDeleteConfirm && (
        <div className={styles.overlay} onClick={() => setShowDeleteConfirm(false)}>
          <div className={styles.dialog} onClick={e => e.stopPropagation()}>
            <h3 className={styles.dialogTitle}>資料を削除しますか？</h3>
            <p className={styles.dialogBody}>「{doc.title}」を削除します。この操作は取り消せません。</p>
            <div className={styles.dialogActions}>
              <button className={styles.btnSecondary} onClick={() => setShowDeleteConfirm(false)}>キャンセル</button>
              <button className={styles.btnDanger} onClick={handleDelete}>削除する</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
