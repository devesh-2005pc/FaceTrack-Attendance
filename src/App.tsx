import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { lazy, Suspense } from 'react'
import ErrorBoundary from './components/ErrorBoundary'

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
  return (
    <Router>
      <ErrorBoundary>
        <div className="min-h-screen bg-background text-foreground antialiased">
          <Suspense fallback={<RouteLoader />}>
            <Routes>
              {/* Remove login */}
              <Route path="/" element={<TeacherDashboard />} />
              <Route path="/dashboard" element={<TeacherDashboard />} />
              <Route path="/attendance/:sessionId" element={<StudentAttendance />} />
              <Route path="/history" element={<History />} />
              <Route path="/settings" element={<Settings />} />
              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </div>
      </ErrorBoundary>
    </Router>
  )
}

export default App