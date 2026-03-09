import { Component } from 'react'

/**
 * Per-route error boundary — catches crashes in a single page
 * without taking down the Sidebar/Layout.
 */
export default class RouteErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('[RouteErrorBoundary] caught:', error, errorInfo)
  }

  render() {
    if (!this.state.hasError) return this.props.children

    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center">
        <div className="bg-white rounded-2xl shadow-lg border border-emerald-100 p-8 max-w-md w-full">
          <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-slate-800 mb-2">This page ran into a problem</h2>
          <p className="text-sm text-slate-500 mb-6">
            Something went wrong loading this page. Other pages should still work fine.
          </p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="px-5 py-2.5 bg-emerald-600 text-white rounded-lg font-medium text-sm hover:bg-emerald-700 transition-colors"
          >
            Try again
          </button>
          <details className="mt-4 text-left">
            <summary className="text-xs text-slate-400 cursor-pointer hover:text-slate-600">
              Error details
            </summary>
            <pre className="mt-2 p-3 bg-slate-50 rounded-lg text-xs text-slate-500 overflow-auto max-h-40 whitespace-pre-wrap break-words">
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
