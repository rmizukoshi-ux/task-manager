import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import styles from './GalleryPage.module.css'

type Doc = {
  id: string
  title: string
  category: string
  description: string | null
  is_public: number
  uploaded_by: string
  created_at: string
}

const CATEGORIES = ['すべて', '会社説明', '採用資料', '営業資料', 'その他']

export function GalleryPage() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [docs, setDocs] = useState<Doc[]>([])
  const [loading, setLoading] = useState(true)
  const [category, setCategory] = useState('すべて')
  const [visibility, setVisibility] = useState<'all' | '0' | '1'>('all')
  const [sort, setSort] = useState<'created_at' | 'title'>('created_at')

  useEffect(() => {
    const params = new URLSearchParams()
    if (category !== 'すべて') params.set('category', category)
    if (visibility !== 'all') params.set('is_public', visibility)
    params.set('sort', sort)

    setLoading(true)
    fetch(`/api/documents?${params}`, { credentials: 'include' })
      .then(r => r.ok ? r.json() as Promise<Doc[]> : [])
      .then(setDocs)
      .catch(() => setDocs([]))
      .finally(() => setLoading(false))
  }, [category, visibility, sort])

  const canUpload = user?.role === 'ADMIN' || user?.role === 'UPLOADER'

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <span className={styles.logo}>T&amp;B Pages</span>
        <div className={styles.headerRight}>
          {canUpload && (
            <button className={styles.uploadBtn} onClick={() => navigate('/upload')}>
              + アップロード
            </button>
          )}
          <div className={styles.userMenu}>
            {user?.picture && <img src={user.picture} alt="" className={styles.avatar} />}
            <span className={styles.userName}>{user?.name}</span>
            <button onClick={logout} className={styles.logoutBtn}>ログアウト</button>
          </div>
        </div>
      </header>

      <div className={styles.filterBar}>
        <div className={styles.filterGroup}>
          <label className={styles.filterLabel}>カテゴリ</label>
          <div className={styles.tabs}>
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                className={`${styles.tab} ${category === cat ? styles.tabActive : ''}`}
                onClick={() => setCategory(cat)}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
        <div className={styles.filterGroup}>
          <label className={styles.filterLabel}>公開範囲</label>
          <div className={styles.tabs}>
            {([['all', 'すべて'], ['0', '社内限定'], ['1', '外部公開']] as const).map(([v, label]) => (
              <button
                key={v}
                className={`${styles.tab} ${visibility === v ? styles.tabActive : ''}`}
                onClick={() => setVisibility(v)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        <div className={styles.filterGroup}>
          <label className={styles.filterLabel}>並び替え</label>
          <select
            className={styles.select}
            value={sort}
            onChange={e => setSort(e.target.value as 'created_at' | 'title')}
          >
            <option value="created_at">新着順</option>
            <option value="title">タイトル順</option>
          </select>
        </div>
      </div>

      <main className={styles.main}>
        {loading ? (
          <p className={styles.empty}>読み込み中...</p>
        ) : docs.length === 0 ? (
          <p className={styles.empty}>資料がありません</p>
        ) : (
          <div className={styles.grid}>
            {docs.map(doc => (
              <div key={doc.id} className={styles.card} onClick={() => navigate(`/view/${doc.id}`)}>
                <div className={styles.cardTop}>
                  <span className={styles.categoryBadge}>{doc.category}</span>
                  <span className={`${styles.visibilityBadge} ${doc.is_public ? styles.badgePublic : styles.badgePrivate}`}>
                    {doc.is_public ? '外部公開' : '社内限定'}
                  </span>
                </div>
                <h3 className={styles.cardTitle}>{doc.title}</h3>
                {doc.description && <p className={styles.cardDesc}>{doc.description}</p>}
                <div className={styles.cardMeta}>
                  <span>{doc.uploaded_by.split('@')[0]}</span>
                  <span>{new Date(doc.created_at).toLocaleDateString('ja-JP')}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
