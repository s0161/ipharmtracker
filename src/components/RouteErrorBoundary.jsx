import { Component } from 'react'
import { useLocation } from 'react-router-dom'

/**
 * Per-route error boundary — catches crashes in a single page
 * without taking down the Sidebar/Layout.
 *
 * Wrapped with RouteGuard which passes `locationKey` so the boundary
 * auto-resets when the user navigates to a different route.
 */
class ErrorBoundaryInner extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidUpdate(prevProps) {
    // Reset error state when the route changes
    if (this.state.hasError && prevProps.locationKey !== this.props.locationKey) {
      this.setState({ hasError: false, error: null })
    }
  }

  componentDidCatch(error, errorInfo) {
    console.error('[RouteErrorBoundary] caught:', error, errorInfo)
  }

  render() {
    if (!this.state.hasError) return this.props.children

    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center">
        <div className="bg-ec-card rounded-2xl shadow-lg border border-ec-border p-8 max-w-md w-full">
          <div className="w-12 h-12 rounded-xl bg-ec-crit-faint flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-ec-crit" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-ec-t1 mb-2">This page ran into a problem</h2>
          <p className="text-sm text-ec-t2 mb-6">
            Something went wrong loading this page. Other pages should still work fine.
          </p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="px-5 py-2.5 bg-ec-em-dark text-white rounded-lg font-medium text-sm hover:bg-ec-em-dark transition-colors"
          >
            Try again
          </button>
          <details className="mt-4 text-left">
            <summary className="text-xs text-ec-t3 cursor-pointer hover:text-ec-t1">
              Error details
            </summary>
            <pre className="mt-2 p-3 bg-ec-bg rounded-lg text-xs text-ec-t3 overflow-auto max-h-40 whitespace-pre-wrap break-words">
              {this.state.error?.toString()}
              {'\n\n'}
              {this.state.error?.stack}
            </pre>
          </details>
        </div>
      </div>
    )
  }
}

export default function RouteErrorBoundary({ children }) {
  const location = useLocation()
  return (
    <ErrorBoundaryInner locationKey={location.pathname}>
      {children}
    </ErrorBoundaryInner>
  )
}
