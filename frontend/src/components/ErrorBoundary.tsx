import { Component } from 'react'
import type { ErrorInfo, ReactNode } from 'react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('🚨 ErrorBoundary caught an error:', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack
    })
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="p-8 bg-red-50 border border-red-200 rounded-lg">
          <h2 className="text-xl font-bold text-red-800 mb-4">Something went wrong</h2>
          <p className="text-red-600 mb-4">An error occurred in this component.</p>
          {this.state.error && (
            <details className="text-sm text-red-700 bg-red-100 p-4 rounded">
              <summary className="font-semibold cursor-pointer">Error details</summary>
              <pre className="mt-2 whitespace-pre-wrap">{this.state.error.message}</pre>
            </details>
          )}
          <button
            className="mt-4 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
            onClick={() => window.location.reload()}
          >
            Reload Page
          </button>
        </div>
      )
    }

    return this.props.children
  }
}
