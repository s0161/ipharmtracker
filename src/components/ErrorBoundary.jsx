import { Component } from 'react'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null, showDetails: false }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo)
  }

  render() {
    if (!this.state.hasError) return this.props.children

    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        backgroundColor: 'var(--bg, #f0faf4)',
        fontFamily: '-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif',
      }}>
        <div style={{ maxWidth: 400, textAlign: 'center', color: 'var(--text, #e4e4e7)' }}>
          <svg viewBox="0 0 40 40" width="48" height="48" style={{ margin: '0 auto 16px' }}>
            <defs>
              <linearGradient id="err-grad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#10b981" />
                <stop offset="100%" stopColor="#059669" />
              </linearGradient>
            </defs>
            <rect rx="12" width="40" height="40" fill="url(#err-grad)" />
            <text x="20" y="26" textAnchor="middle" fill="white" fontWeight="700" fontSize="13">iPD</text>
          </svg>

          <h1 style={{ fontSize: 20, fontWeight: 700, margin: '0 0 8px' }}>Something went wrong</h1>
          <p style={{ fontSize: 14, color: 'var(--text-secondary, rgba(255,255,255,0.5))', margin: '0 0 24px' }}>
            An unexpected error occurred. Try refreshing the page.
          </p>

          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={() => window.location.reload()}
              style={{
                padding: '10px 20px', borderRadius: 8, border: 'none',
                backgroundColor: '#10b981', color: 'white', fontWeight: 600,
                fontSize: 14, cursor: 'pointer',
              }}
            >
              Refresh page
            </button>
            <button
              onClick={() => { localStorage.clear(); window.location.reload() }}
              style={{
                padding: '10px 20px', borderRadius: 8,
                border: '1px solid var(--border, rgba(255,255,255,0.06))',
                backgroundColor: 'transparent', color: 'var(--text, #e4e4e7)',
                fontWeight: 500, fontSize: 14, cursor: 'pointer',
              }}
            >
              Clear data &amp; retry
            </button>
          </div>

          <button
            onClick={() => this.setState(s => ({ showDetails: !s.showDetails }))}
            style={{
              marginTop: 24, background: 'none', border: 'none',
              color: 'var(--text-muted, rgba(255,255,255,0.25))',
              fontSize: 12, cursor: 'pointer', textDecoration: 'underline',
            }}
          >
            {this.state.showDetails ? 'Hide' : 'Show'} error details
          </button>
          {this.state.showDetails && (
            <pre style={{
              marginTop: 12, padding: 12, borderRadius: 8,
              backgroundColor: 'var(--bg-secondary, #111)',
              color: 'var(--text-muted, rgba(255,255,255,0.25))',
              fontSize: 11, textAlign: 'left', overflow: 'auto',
              maxHeight: 200, whiteSpace: 'pre-wrap', wordBreak: 'break-word',
            }}>
              {this.state.error?.toString()}
            </pre>
          )}
        </div>
      </div>
    )
  }
}
