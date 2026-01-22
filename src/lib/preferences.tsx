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
  updatePreferences: (newPreferences: Partial<Preferences>) => void
  resetPreferences: () => void
}

const PreferencesContext = createContext<PreferencesContextType | undefined>(undefined)

export const PreferencesProvider = ({ children }: { children: ReactNode }) => {
  const [preferences, setPreferencesState] = useState<Preferences>(() => {
    try {
      const storedPrefs = localStorage.getItem('userPreferences')
      return storedPrefs ? JSON.parse(storedPrefs) : { 
        persistFilters: true,
        reduceMotion: false,
        autoStartCamera: true,
        compactLayout: false,
        enableSounds: true,
        highContrast: false
      }
    } catch (error) {
      console.error('Failed to parse stored preferences:', error)
      return { 
        persistFilters: true,
        reduceMotion: false,
        autoStartCamera: true,
        compactLayout: false,
        enableSounds: true,
        highContrast: false
      }
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem('userPreferences', JSON.stringify(preferences))
    } catch (error) {
      console.error('Failed to save preferences to localStorage:', error)
    }
  }, [preferences])

  const setPreferences = (newPreferences: Partial<Preferences>) => {
    setPreferencesState(prevPrefs => ({ ...prevPrefs, ...newPreferences }))
  }

  const updatePreferences = (newPreferences: Partial<Preferences>) => {
    setPreferencesState(prevPrefs => ({ ...prevPrefs, ...newPreferences }))
  }

  const resetPreferences = () => {
    setPreferencesState({
      persistFilters: true,
      reduceMotion: false,
      autoStartCamera: true,
      compactLayout: false,
      enableSounds: true,
      highContrast: false
    })
  }

  return (
    <PreferencesContext.Provider value={{ preferences, setPreferences, updatePreferences, resetPreferences }}>
      {children}
    </PreferencesContext.Provider>
  )
}

export const usePreferences = () => {
  const context = useContext(PreferencesContext)
  if (context === undefined) {
    throw new Error('usePreferences must be used within a PreferencesProvider')
  }
  return context
}
