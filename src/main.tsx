import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { PreferencesProvider } from './lib/preferences.tsx'
import { NotificationProvider } from './lib/notifications'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <PreferencesProvider>
      <NotificationProvider>
        <App />
      </NotificationProvider>
    </PreferencesProvider>
  </StrictMode>,
)
