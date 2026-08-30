import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import styles from './PublicGalleryPage.module.css'

type Doc = {
  id: string
  title: string
  category: string
  description: string | null
  created_at: string
}

const CATEGORIES = ['すべて', '会社説明', '採用資料', '営業資料', 'その他']

export function PublicGalleryPage() {
  const navigate = useNavigate()
  const [docs, setDocs] = useState<Doc[]>([])
  const [loading, setLoading] = useState(true)
  const [category, setCategory] = useState('すべて')

  useEffect(() => {
    const params = new URLSearchParams()
    if (category !== 'すべて') params.set('category', category)

    fetch(`/api/public/documents?${params}`)
      .then(r => r.ok ? r.json() as Promise<Doc[]> : [])
      .then(setDocs)
      .catch(() => setDocs([]))
      .finally(() => setLoading(false))
  }, [category])

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <div className={styles.brand}>
            <span className={styles.brandName}>T&amp;B Pages</span>
            <span className={styles.brandSub}>by Archial Design</span>
          </div>
          <nav className={styles.nav}>
            <button className={styles.navLogin} onClick={() => navigate('/login')}>
              社内向けログイン
            </button>
          </nav>
        </div>
      </header>

      <section className={styles.hero}>
        <div className={styles.heroInner}>
          <h1 className={styles.heroTitle}>Tech &amp; Boost 資料ライブラリ</h1>
          <p className={styles.heroDesc}>
            アーシャルデザインのIT活用推進チームによる<br />
            会社説明・採用・営業資料をご覧いただけます。
          </p>
        </div>
      </section>

      <main className={styles.main}>
        <div className={styles.filterBar}>
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              className={`${styles.filterBtn} ${category === cat ? styles.filterBtnActive : ''}`}
              onClick={() => setCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>

        {loading ? (
          <p className={styles.empty}>読み込み中...</p>
        ) : docs.length === 0 ? (
          <p className={styles.empty}>公開中の資料はありません</p>
        ) : (
          <div className={styles.grid}>
            {docs.map(doc => (
              <div key={doc.id} className={styles.card} onClick={() => navigate(`/p/${doc.id}`)}>
                <div className={styles.categoryBadge}>{doc.category}</div>
                <h3 className={styles.cardTitle}>{doc.title}</h3>
                {doc.description && <p className={styles.cardDesc}>{doc.description}</p>}
                <div className={styles.cardFooter}>
                  <span className={styles.viewLink}>資料を見る →</span>
                  <span className={styles.cardDate}>
                    {new Date(doc.created_at).toLocaleDateString('ja-JP')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <footer className={styles.footer}>
        <p className={styles.copyright}>© {new Date().getFullYear()} Archial Design Inc. All rights reserved.</p>
      </footer>
    </div>
  )
}
