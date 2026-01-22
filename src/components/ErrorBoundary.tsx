import React from 'react'

type ErrorBoundaryProps = {
  children: React.ReactNode
}

type ErrorBoundaryState = {
  hasError: boolean
}

export default class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
          <div className="max-w-md w-full rounded-xl border border-red-100 bg-white p-6 text-center">
            <h1 className="text-xl font-bold text-red-600">Something went wrong</h1>
            <p className="mt-2 text-sm text-gray-500">Please refresh the page to continue.</p>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
