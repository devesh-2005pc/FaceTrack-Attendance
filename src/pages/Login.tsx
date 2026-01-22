import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useNotifications } from '@/lib/notifications'

export default function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const { showNotification } = useNotifications()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    try {
      const response = await fetch(`http://${window.location.hostname}:8000/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      })
      
      const data = await response.json()
      
      if (response.ok && data.status === 'success') {
        localStorage.setItem('teacher', JSON.stringify(data.user))
        showNotification('success', 'Welcome back!', 'Successfully signed in.')
        navigate('/dashboard')
      } else {
        showNotification('error', 'Login failed', data.detail || 'Invalid credentials')
      }
    } catch (error) {
      showNotification('error', 'Connection error', 'Unable to reach the server')
    }
    
    setLoading(false)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-white px-6 py-12 overflow-hidden relative">
      {/* Decorative Background Elements */}
      <div className="absolute top-[-10%] right-[-10%] w-64 h-64 bg-blue-50 rounded-full blur-3xl opacity-50"></div>
      <div className="absolute bottom-[-10%] left-[-10%] w-96 h-96 bg-gray-50 rounded-full blur-3xl opacity-50"></div>

      <div className="w-full max-w-sm space-y-12 relative z-10">
        <div className="space-y-4">
          <div className="w-16 h-1 w-blue-600 rounded-full"></div>
          <div className="space-y-1">
            <h1 className="text-5xl font-black text-gray-900 tracking-tighter uppercase leading-none">
              Smart<br/>Attendance
            </h1>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-2">
              Faculty Portal • Secure Access v1.0
            </p>
          </div>
        </div>

        <form className="space-y-8" onSubmit={handleLogin}>
          <div className="space-y-4">
            <div className="group">
              <label htmlFor="username" className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-4 mb-1 block group-focus-within:text-blue-500 transition-colors">Identification</label>
              <input
                id="username"
                type="text"
                required
                className="w-full bg-gray-50 border-0 px-6 py-5 text-xs font-black text-gray-900 rounded-[2rem] focus:ring-2 focus:ring-blue-600 transition-all placeholder:text-gray-300 uppercase tracking-widest"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
            <div className="group">
              <label htmlFor="password" aria-hidden="true" className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-4 mb-1 block group-focus-within:text-blue-500 transition-colors">Access Key</label>
              <input
                id="password"
                type="password"
                required
                className="w-full bg-gray-50 border-0 px-6 py-5 text-xs font-black text-gray-900 rounded-[2rem] focus:ring-2 focus:ring-blue-600 transition-all placeholder:text-gray-300 uppercase tracking-widest"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-6 rounded-[2rem] text-[10px] font-black uppercase tracking-widest shadow-2xl shadow-blue-200 active:scale-[0.98] hover:bg-blue-700 transition-all disabled:opacity-50 flex items-center justify-center gap-3"
          >
            {loading ? (
              <>
                <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Authenticating...</span>
              </>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        <div className="pt-8 border-t border-gray-50">
          <p className="text-[9px] font-black text-gray-300 uppercase tracking-widest text-center">
            Authorized Personnel Only
          </p>
        </div>
      </div>
    </div>
  )

}
