import { Routes, Route, Navigate } from 'react-router-dom'

// Placeholder pages — implemented in Phase 2+
const LoginPage = () => <div>ログイン画面（Phase 2で実装）</div>
const GalleryPage = () => <div>社内ギャラリー（Phase 3で実装）</div>
const PublicGalleryPage = () => <div>外部公開ギャラリー（Phase 4で実装）</div>

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/gallery" element={<GalleryPage />} />
      <Route path="/" element={<PublicGalleryPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
