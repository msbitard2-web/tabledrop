import { loadLocations } from './store'
import { loadItems } from './store'
import { getAllLocationImages } from './store/idb'
import type { Location, Item } from './types'

export interface PublicState {
  locations: Location[]
  items: Item[]
  exportedAt: string
}

export async function getLocalPublicState(): Promise<PublicState> {
  const locations = loadLocations()
  const items = loadItems()
  const images = await getAllLocationImages()

  const locationsWithImages: Location[] = locations.map((loc) => {
    const imageUrl = images[loc.id]
    if (!imageUrl) return loc
    return {
      ...loc,
      imageUrl,
      hasImage: true,
    }
  })

  return {
    locations: locationsWithImages,
    items,
    exportedAt: new Date().toISOString(),
  }
}

export async function publishPublicState(): Promise<void> {
  const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
  const serviceKey = import.meta.env.VITE_SUPABASE_SERVICE_KEY as string | undefined
  if (!url || !serviceKey) {
    throw new Error('SUPABASE_CONFIG_MISSING')
  }
  const state = await getLocalPublicState()
  const res = await fetch(`${url}/rest/v1/public_state`, {
    method: 'POST',
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      'Content-Type': 'application/json',
      Prefer: 'resolution=merge-duplicates',
    },
    body: JSON.stringify({
      id: 'main',
      state,
      updated_at: new Date().toISOString(),
    }),
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`PUBLISH_FAILED: ${res.status} ${text}`)
  }
}

