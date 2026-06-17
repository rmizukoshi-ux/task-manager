import { Component, type ReactNode } from 'react'

interface Props { children: ReactNode }
interface State { hasError: boolean; message: string }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, message: '' }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40 }}>
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: 48, margin: '0 0 16px' }}>⚠️</p>
            <h2 style={{ fontSize: 18, fontWeight: 600, color: '#111', margin: '0 0 8px' }}>予期しないエラーが発生しました</h2>
            <p style={{ fontSize: 13, color: '#aaa', margin: '0 0 24px' }}>{this.state.message}</p>
            <button
              onClick={() => window.location.href = '/'}
              style={{ padding: '10px 24px', background: '#1d4ed8', color: '#fff', border: 'none', borderRadius: 6, fontSize: 14, cursor: 'pointer' }}
            >
              トップに戻る
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
