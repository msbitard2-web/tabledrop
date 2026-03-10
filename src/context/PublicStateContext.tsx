import { createContext, useContext, useState, useCallback } from 'react'

type PublicStateContextValue = {
  isPublicStateReady: boolean
  setPublicStateReady: (ready: boolean) => void
}

const PublicStateContext = createContext<PublicStateContextValue | null>(null)

export function PublicStateProvider({ children }: { children: React.ReactNode }) {
  const [isPublicStateReady, setPublicStateReady] = useState(false)
  const setReady = useCallback((ready: boolean) => setPublicStateReady(ready), [])
  return (
    <PublicStateContext.Provider value={{ isPublicStateReady, setPublicStateReady: setReady }}>
      {children}
    </PublicStateContext.Provider>
  )
}

export function usePublicState() {
  const ctx = useContext(PublicStateContext)
  if (!ctx) throw new Error('usePublicState must be used within PublicStateProvider')
  return ctx
}
