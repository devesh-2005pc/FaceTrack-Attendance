import { useNavigate } from 'react-router-dom'
import { ArrowLeft, RotateCcw } from 'lucide-react'
import { usePreferences } from '@/lib/preferences.tsx'
import { useNotifications } from '@/lib/notifications'

export default function Settings() {
  const navigate = useNavigate()
  const { preferences, setPreferences, resetPreferences } = usePreferences()
  const { showNotification } = useNotifications()

  const handleReset = () => {
    resetPreferences()
    showNotification('info', 'Settings Reset', 'All preferences have been restored to default.')
  }

  const handleToggle = (key: keyof typeof preferences, value: boolean) => {
    setPreferences({ ...preferences, [key]: value })
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-xl mx-auto space-y-8">
        <div className="flex items-center gap-6">
          <button
            onClick={() => navigate('/dashboard')}
            className="p-4 bg-white shadow-xl shadow-gray-100 rounded-2xl hover:bg-gray-50 transition-all active:scale-90"
            aria-label="Back to dashboard"
          >
            <ArrowLeft size={20} className="text-gray-900" />
          </button>
          <div>
            <div className="font-black text-[10px] uppercase tracking-[0.2em] text-blue-600 mb-1">System</div>
            <h1 className="text-3xl font-black tracking-tighter text-gray-900">Preferences</h1>
          </div>
        </div>

        <div className="space-y-4">
          {[
            { id: 'reduce-motion', label: 'Reduce motion', sub: 'Disable animations', key: 'reduceMotion' },
            { id: 'auto-start-camera', label: 'Auto-start camera', sub: 'Instant attendance', key: 'autoStartCamera' },
            { id: 'compact-layout', label: 'Compact layout', sub: 'Dense data views', key: 'compactLayout' },
            { id: 'enable-sounds', label: 'Enable sound alerts', sub: 'Audio feedback', key: 'enableSounds' },
            { id: 'persist-filters', label: 'Persist filters', sub: 'Save history state', key: 'persistFilters' },
            { id: 'high-contrast', label: 'High contrast', sub: 'Enhanced readability', key: 'highContrast' },
          ].map((item) => (
            <div key={item.id} className="group bg-white p-6 rounded-[2rem] shadow-sm hover:shadow-md transition-all border border-transparent hover:border-blue-100">
              <label htmlFor={item.id} className="flex items-center justify-between cursor-pointer">
                <div>
                  <p className="font-black text-gray-900 tracking-tight">{item.label}</p>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{item.sub}</p>
                </div>
                <div className="relative inline-flex items-center cursor-pointer">
                  <input
                    id={item.id}
                    type="checkbox"
                    checked={preferences[item.key as keyof typeof preferences] as boolean}
                    onChange={e => handleToggle(item.key as keyof typeof preferences, e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-100 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </div>
              </label>
            </div>
          ))}

          <div className="pt-4">
            <button
              onClick={handleReset}
              className="w-full flex items-center justify-center gap-3 p-6 bg-red-50 text-red-600 rounded-[2rem] font-black text-xs uppercase tracking-widest hover:bg-red-100 transition-all active:scale-95"
            >
              <RotateCcw size={16} />
              Reset to Defaults
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}