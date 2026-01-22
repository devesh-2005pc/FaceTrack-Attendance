import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { lazy, Suspense, useEffect } from 'react'
import ErrorBoundary from './components/ErrorBoundary'
import { usePreferences } from './lib/preferences.tsx'
import { useNotifications } from './lib/notifications'

const Login = lazy(() => import('./pages/Login'))
const TeacherDashboard = lazy(() => import('./pages/TeacherDashboard'))
const StudentAttendance = lazy(() => import('./pages/StudentAttendance'))
const History = lazy(() => import('./pages/History'))
const Settings = lazy(() => import('./pages/Settings'))

const RouteLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="rounded-full h-10 w-10 border-4 border-blue-200 border-t-blue-600 animate-spin" aria-label="Loading" />
  </div>
)

function App() {
  usePreferences()
  const { showNotification } = useNotifications()

  useEffect(() => {
    const handleOnline = () => showNotification('success', 'Back Online', 'Your connection has been restored.')
    const handleOffline = () => showNotification('error', 'Offline', 'You are currently offline. Some features may be limited.')

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [showNotification])

  return (
    <Router>
      <ErrorBoundary>
        <div className="min-h-screen bg-background text-foreground antialiased">
          <Suspense fallback={<RouteLoader />}>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/dashboard" element={<TeacherDashboard />} />
              <Route path="/history" element={<History />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/attendance/:sessionId" element={<StudentAttendance />} />
              <Route path="/" element={<Navigate to="/login" replace />} />
            </Routes>
          </Suspense>
        </div>
      </ErrorBoundary>
    </Router>
  )
}

export default App
