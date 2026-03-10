import { useEffect } from 'react'
import { useAppMode } from '../context/AppModeContext'
import { usePublicState } from '../context/PublicStateContext'
import { setRemoteLocations, setRemoteItems } from '../store'

async function loadPublicStateFromSupabase(): Promise<void> {
  const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined
  if (!url || !anonKey) return
  const res = await fetch(`${url}/rest/v1/public_state?id=eq.main&select=state`, {
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${anonKey}`,
    },
  })
  if (!res.ok) return
  const rows = (await res.json()) as { state?: any }[]
  const row = rows[0]
  if (!row?.state) return
  const state = row.state as { locations?: any; items?: any }
  const locations = Array.isArray(state.locations) ? state.locations : []
  const items = Array.isArray(state.items) ? state.items : []
  setRemoteLocations(locations)
  setRemoteItems(items)
}

export default function PublicStateLoader() {
  const { isReadOnly } = useAppMode()
  const { setPublicStateReady } = usePublicState()

  useEffect(() => {
    if (!isReadOnly) {
      setPublicStateReady(true)
      return
    }
    setPublicStateReady(false)
    loadPublicStateFromSupabase()
      .catch(() => {
        // ignore fetch / parse errors for viewer, просто покажем пустое состояние
      })
      .finally(() => setPublicStateReady(true))
  }, [isReadOnly, setPublicStateReady])

  return null
}

