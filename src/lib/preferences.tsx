import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'

interface Preferences {
  persistFilters: boolean
  reduceMotion: boolean
  autoStartCamera: boolean
  compactLayout: boolean
  enableSounds: boolean
  highContrast: boolean
}

interface PreferencesContextType {
  preferences: Preferences
  setPreferences: (newPreferences: Partial<Preferences>) => void
  resetPreferences: () => void
}

const PreferencesContext = createContext<PreferencesContextType | undefined>(undefined)

const DEFAULT_PREFERENCES: Preferences = {
  persistFilters: true,
  reduceMotion: false,
  autoStartCamera: true,
  compactLayout: false,
  enableSounds: true,
  highContrast: false,
}

export const PreferencesProvider = ({ children }: { children: ReactNode }) => {
  const [preferences, setPreferencesState] = useState<Preferences>(() => {
    try {
      const storedPrefs = localStorage.getItem('userPreferences')
      return storedPrefs ? JSON.parse(storedPrefs) : DEFAULT_PREFERENCES
    } catch (error) {
      console.error('Failed to parse stored preferences:', error)
      return DEFAULT_PREFERENCES
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem('userPreferences', JSON.stringify(preferences))
    } catch (error) {
      console.error('Failed to save preferences to localStorage:', error)
    }
  }, [preferences])

  // Update preferences
  const setPreferences = (newPreferences: Partial<Preferences>) => {
    setPreferencesState(prev => ({ ...prev, ...newPreferences }))
  }

  // Reset to default
  const resetPreferences = () => setPreferencesState(DEFAULT_PREFERENCES)

  return (
    <PreferencesContext.Provider value={{ preferences, setPreferences, resetPreferences }}>
      {children}
    </PreferencesContext.Provider>
  )
}

// Custom hook
export const usePreferences = () => {
  const context = useContext(PreferencesContext)
  if (!context) throw new Error('usePreferences must be used within a PreferencesProvider')
  return context
}