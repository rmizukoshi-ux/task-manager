import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

import styles from './UploadPage.module.css'

const CATEGORIES = ['会社説明', '採用資料', '営業資料', 'その他']

type Doc = {
  id: string
  title: string
  category: string
  description: string | null
  uploaded_by: string
}

export function EditPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user, authFetch } = useAuth()
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState(CATEGORIES[0])
  const [description, setDescription] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    authFetch(`/api/documents/${id}`)
      .then(r => r.ok ? r.json() as Promise<Doc> : null)
      .then(data => {
        if (!data) { navigate('/gallery'); return }
        // Guard: only owner or ADMIN can edit
        if (user?.role !== 'ADMIN' && data.uploaded_by !== user?.email) {
          navigate('/gallery')
          return
        }
        setTitle(data.title)
        setCategory(data.category)
        setDescription(data.description ?? '')
      })
      .finally(() => setInitialLoading(false))
  }, [id])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) { setError('タイトルを入力してください'); return }
    setLoading(true)
    setError('')

    try {
      const res = await authFetch(`/api/documents/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: title.trim(), category, description: description.trim() }),
      })
      const data = await res.json() as { ok?: boolean; error?: string }
      if (!res.ok) { setError(data.error ?? '更新に失敗しました'); return }
      navigate(`/view/${id}`)
    } catch {
      setError('通信エラーが発生しました')
    } finally {
      setLoading(false)
    }
  }

  if (initialLoading) return <div style={{ padding: 40, textAlign: 'center', color: '#aaa' }}>読み込み中...</div>

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <button className={styles.back} onClick={() => navigate(`/view/${id}`)}>← 戻る</button>
        <span className={styles.title}>資料を編集</span>
      </header>

      <main className={styles.main}>
        <form onSubmit={handleSubmit} className={styles.form}>
          {error && <p className={styles.error}>{error}</p>}

          <div className={styles.field}>
            <label className={styles.label}>タイトル <span className={styles.required}>*</span></label>
            <input
              type="text"
              className={styles.input}
              value={title}
              onChange={e => setTitle(e.target.value)}
              maxLength={50}
            />
            <span className={styles.count}>{title.length}/50</span>
          </div>

          <div className={styles.field}>
            <label className={styles.label}>カテゴリ <span className={styles.required}>*</span></label>
            <select className={styles.select} value={category} onChange={e => setCategory(e.target.value)}>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div className={styles.field}>
            <label className={styles.label}>説明（任意）</label>
            <textarea
              className={styles.textarea}
              value={description}
              onChange={e => setDescription(e.target.value)}
              maxLength={200}
              rows={3}
            />
            <span className={styles.count}>{description.length}/200</span>
          </div>

          <div className={styles.actions}>
            <button type="button" className={styles.cancelBtn} onClick={() => navigate(`/view/${id}`)}>
              キャンセル
            </button>
            <button type="submit" className={styles.submitBtn} disabled={loading}>
              {loading ? '保存中...' : '保存'}
            </button>
          </div>
        </form>
      </main>
    </div>
  )
}
