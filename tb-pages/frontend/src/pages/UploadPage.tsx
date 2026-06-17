import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import styles from './UploadPage.module.css'

const CATEGORIES = ['会社説明', '採用資料', '営業資料', 'その他']

export function UploadPage() {
  const navigate = useNavigate()
  const fileRef = useRef<HTMLInputElement>(null)
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState(CATEGORIES[0])
  const [description, setDescription] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    if (!f.name.toLowerCase().endsWith('.html') && !f.name.toLowerCase().endsWith('.htm')) {
      setError('HTMLファイル（.html）のみアップロードできます')
      e.target.value = ''
      return
    }
    if (f.size > 10 * 1024 * 1024) {
      setError('ファイルサイズは10MB以内にしてください')
      e.target.value = ''
      return
    }
    setError('')
    setFile(f)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file) { setError('ファイルを選択してください'); return }
    if (!title.trim()) { setError('タイトルを入力してください'); return }

    setLoading(true)
    setError('')

    const formData = new FormData()
    formData.append('file', file)
    formData.append('title', title.trim())
    formData.append('category', category)
    formData.append('description', description.trim())

    try {
      const res = await fetch('/api/documents', {
        method: 'POST',
        credentials: 'include',
        body: formData,
      })
      const data = await res.json() as { id?: string; error?: string }
      if (!res.ok) {
        setError(data.error ?? 'アップロードに失敗しました')
        return
      }
      navigate('/gallery')
    } catch {
      setError('通信エラーが発生しました')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <button className={styles.back} onClick={() => navigate('/gallery')}>← 戻る</button>
        <span className={styles.title}>資料をアップロード</span>
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
              placeholder="例：2024年 会社説明資料"
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
              placeholder="資料の概要を入力してください"
              maxLength={200}
              rows={3}
            />
            <span className={styles.count}>{description.length}/200</span>
          </div>

          <div className={styles.field}>
            <label className={styles.label}>ファイル <span className={styles.required}>*</span></label>
            <div className={styles.fileArea} onClick={() => fileRef.current?.click()}>
              {file ? (
                <span className={styles.fileName}>{file.name}</span>
              ) : (
                <span className={styles.filePlaceholder}>HTMLファイルを選択（.html, 最大10MB）</span>
              )}
            </div>
            <input
              ref={fileRef}
              type="file"
              accept=".html,.htm"
              style={{ display: 'none' }}
              onChange={handleFileChange}
            />
          </div>

          <p className={styles.note}>公開範囲は「社内限定」で登録されます。外部公開への変更はADMINが行います。</p>

          <div className={styles.actions}>
            <button type="button" className={styles.cancelBtn} onClick={() => navigate('/gallery')}>
              キャンセル
            </button>
            <button type="submit" className={styles.submitBtn} disabled={loading}>
              {loading ? 'アップロード中...' : 'アップロード'}
            </button>
          </div>
        </form>
      </main>
    </div>
  )
}
