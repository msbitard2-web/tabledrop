import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { loadLocations, updateLocation } from '../store'
import * as idb from '../store/idb'
import { useAppMode } from './AppModeContext'

type LocationImagesContextValue = {
  imageUrls: Record<string, string>
  addLocationImage: (id: string, dataUrl: string) => void
  removeLocationImage: (id: string) => void
}

const LocationImagesContext = createContext<LocationImagesContextValue | null>(null)

export function LocationImagesProvider({ children }: { children: React.ReactNode }) {
  const [imageUrls, setImageUrls] = useState<Record<string, string>>({})
  const { isReadOnly } = useAppMode()

  const addLocationImage = useCallback((id: string, dataUrl: string) => {
    setImageUrls((prev) => ({ ...prev, [id]: dataUrl }))
  }, [])

  const removeLocationImage = useCallback((id: string) => {
    setImageUrls((prev) => {
      const next = { ...prev }
      delete next[id]
      return next
    })
  }, [])

  useEffect(() => {
    let cancelled = false
    const run = async () => {
      if (isReadOnly) {
        // В режиме просмотра ничего не мигрируем, просто читаем уже сохранённые картинки (если есть)
        const all = await idb.getAllLocationImages()
        if (!cancelled) setImageUrls(all)
        return
      }
      const locations = loadLocations()
      for (const loc of locations) {
        if ((loc as { imageUrl?: string }).imageUrl) {
          const dataUrl = (loc as { imageUrl: string }).imageUrl
          await idb.saveLocationImage(loc.id, dataUrl)
          updateLocation({ ...loc, hasImage: true, imageUrl: undefined })
        }
      }
      if (cancelled) return
      const all = await idb.getAllLocationImages()
      if (!cancelled) setImageUrls(all)
    }
    run()
    return () => { cancelled = true }
  }, [isReadOnly])

  return (
    <LocationImagesContext.Provider value={{ imageUrls, addLocationImage, removeLocationImage }}>
      {children}
    </LocationImagesContext.Provider>
  )
}

export function useLocationImages() {
  const ctx = useContext(LocationImagesContext)
  if (!ctx) throw new Error('useLocationImages must be used within LocationImagesProvider')
  return ctx
}
