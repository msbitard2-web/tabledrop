import { createContext, useContext } from 'react'
import { useLocation } from 'react-router-dom'

type AppMode = {
  isReadOnly: boolean
}

const AppModeContext = createContext<AppMode | null>(null)

export function AppModeProvider({ children }: { children: React.ReactNode }) {
  const location = useLocation()
  const params = new URLSearchParams(location.search)
  const viewParam = params.get('view')

  // Админка только локально; всё, что не localhost, по умолчанию viewer
  const host = typeof window !== 'undefined' ? window.location.hostname : ''
  const isLocal =
    host === 'localhost' || host === '127.0.0.1' || host === '' || host.startsWith('192.168.') || host.startsWith('10.')

  const isReadOnly =
    // Явный viewer
    viewParam === '1' ||
    // Явный admin (можно открыть viewer локально с ?view=1)
    (!isLocal && viewParam !== '0')

  return <AppModeContext.Provider value={{ isReadOnly }}>{children}</AppModeContext.Provider>
}

export function useAppMode() {
  const ctx = useContext(AppModeContext)
  if (!ctx) throw new Error('useAppMode must be used within AppModeProvider')
  return ctx
}