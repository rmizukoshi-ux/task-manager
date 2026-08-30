import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { ProtectedRoute } from './components/ProtectedRoute'
import { LoginPage } from './pages/LoginPage'
import { AuthCallbackPage } from './pages/AuthCallbackPage'
import { GalleryPage } from './pages/GalleryPage'
import { UploadPage } from './pages/UploadPage'
import { ViewerPage } from './pages/ViewerPage'
import { EditPage } from './pages/EditPage'
import { PublicGalleryPage } from './pages/PublicGalleryPage'
import { PublicViewerPage } from './pages/PublicViewerPage'

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* 外部公開（ログイン不要） */}
        <Route path="/" element={<PublicGalleryPage />} />
        <Route path="/p/:id" element={<PublicViewerPage />} />

        {/* 認証系 */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/auth/callback" element={<AuthCallbackPage />} />

        {/* 社内向け（要ログイン） */}
        <Route path="/gallery" element={<ProtectedRoute><GalleryPage /></ProtectedRoute>} />
        <Route path="/upload" element={<ProtectedRoute><UploadPage /></ProtectedRoute>} />
        <Route path="/view/:id" element={<ProtectedRoute><ViewerPage /></ProtectedRoute>} />
        <Route path="/edit/:id" element={<ProtectedRoute><EditPage /></ProtectedRoute>} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  )
}
