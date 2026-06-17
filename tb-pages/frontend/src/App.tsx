import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { ProtectedRoute } from './components/ProtectedRoute'
import { LoginPage } from './pages/LoginPage'
import { AuthCallbackPage } from './pages/AuthCallbackPage'
import { GalleryPage } from './pages/GalleryPage'
import { UploadPage } from './pages/UploadPage'
import { ViewerPage } from './pages/ViewerPage'
import { EditPage } from './pages/EditPage'

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/auth/callback" element={<AuthCallbackPage />} />
        <Route path="/gallery" element={<ProtectedRoute><GalleryPage /></ProtectedRoute>} />
        <Route path="/upload" element={<ProtectedRoute><UploadPage /></ProtectedRoute>} />
        <Route path="/view/:id" element={<ProtectedRoute><ViewerPage /></ProtectedRoute>} />
        <Route path="/edit/:id" element={<ProtectedRoute><EditPage /></ProtectedRoute>} />
        {/* Phase 4: 外部公開ギャラリー */}
        <Route path="/" element={<div style={{ padding: 40 }}>外部公開ギャラリー（Phase 4）</div>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  )
}
