import { createContext, useContext, useState, type ReactNode } from 'react'
import FeedbackBanner from '@/components/FeedbackBanner'

type NotificationVariant = 'error' | 'success' | 'info'

interface Notification {
  variant: NotificationVariant
  title: string
  description?: string
}

interface NotificationContextType {
  showNotification: (variant: NotificationVariant, title: string, description?: string) => void
  hideNotification: () => void
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
  const [notification, setNotification] = useState<Notification | null>(null)

  const showNotification = (variant: NotificationVariant, title: string, description?: string) => {
    setNotification({ variant, title, description })
    setTimeout(() => {
      setNotification(null)
    }, 5000)
  }

  const hideNotification = () => setNotification(null)

  return (
    <NotificationContext.Provider value={{ showNotification, hideNotification }}>
      {children}
      {notification && (
        <div className="fixed bottom-4 left-4 right-4 z-50 animate-in fade-in slide-in-from-bottom-4">
          <div className="max-w-md mx-auto shadow-2xl rounded-xl overflow-hidden">
            <FeedbackBanner
              variant={notification.variant}
              title={notification.title}
              description={notification.description}
            />
          </div>
        </div>
      )}
    </NotificationContext.Provider>
  )
}

export const useNotifications = () => {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider')
  }
  return context
}
