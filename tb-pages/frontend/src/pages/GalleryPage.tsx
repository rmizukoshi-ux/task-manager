import { useAuth } from '../contexts/AuthContext'
import styles from './GalleryPage.module.css'

export function GalleryPage() {
  const { user, logout } = useAuth()

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <span className={styles.logo}>T&amp;B Pages</span>
        <div className={styles.userInfo}>
          {user?.picture && (
            <img src={user.picture} alt={user.name} className={styles.avatar} />
          )}
          <span className={styles.userName}>{user?.name}</span>
          <span className={styles.role}>{user?.role}</span>
          <button onClick={logout} className={styles.logoutBtn}>ログアウト</button>
        </div>
      </header>
      <main className={styles.main}>
        <p className={styles.placeholder}>社内ギャラリー（Phase 3で実装）</p>
      </main>
    </div>
  )
}
