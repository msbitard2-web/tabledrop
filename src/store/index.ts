import type { Location, DropItem, HourData } from '../types'
import { getItem } from './items'

const STORAGE_KEY = 'police-drop-locations'

// Фолбэк для read-only viewer: если не смогли сохранить локации в localStorage
let remoteLocations: Location[] | null = null

export function setRemoteLocations(locations: Location[] | null): void {
  remoteLocations = locations
}

function getDefaultHours(): HourData[] {
  return [1, 2, 3, 4, 5, 6].map((hour) => ({
    hour: hour as 1 | 2 | 3 | 4 | 5 | 6,
    items: [],
  }))
}

export function loadLocations(): Location[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return remoteLocations ?? []
    const data = JSON.parse(raw) as Location[]
    if (Array.isArray(data)) return data
    return remoteLocations ?? []
  } catch {
    return remoteLocations ?? []
  }
}

/** Сохраняет локации в localStorage без imageUrl (изображения хранятся в IndexedDB). */
export function saveLocations(locations: Location[]): void {
  const toSave = locations.map(({ imageUrl, ...rest }) => rest)
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave))
  } catch (e) {
    if (e instanceof DOMException && e.name === 'QuotaExceededError') {
      throw new Error('QUOTA_EXCEEDED')
    }
    throw e
  }
}

export function createLocation(name: string): Location {
  return {
    id: crypto.randomUUID(),
    name: name.trim() || 'Без названия',
    createdAt: new Date().toISOString(),
    hours: getDefaultHours(),
  }
}

export function getLocation(id: string): Location | undefined {
  return loadLocations().find((l) => l.id === id)
}

export function updateLocation(updated: Location): void {
  const list = loadLocations()
  const idx = list.findIndex((l) => l.id === updated.id)
  if (idx >= 0) list[idx] = updated
  else list.push(updated)
  saveLocations(list)
}

export function deleteLocation(id: string): void {
  saveLocations(loadLocations().filter((l) => l.id !== id))
}

export function addDropToHour(location: Location, hour: 1 | 2 | 3 | 4 | 5 | 6, item: Omit<DropItem, 'id'>): void {
  const hours = location.hours.map((h) =>
    h.hour === hour
      ? { ...h, items: [...h.items, { ...item, id: crypto.randomUUID() }] }
      : h
  )
  updateLocation({ ...location, hours })
}

export function updateDropInLocation(location: Location, hour: number, itemId: string, patch: Partial<DropItem>): void {
  const hours = location.hours.map((h) =>
    h.hour === hour
      ? { ...h, items: h.items.map((i) => (i.id === itemId ? { ...i, ...patch } : i)) }
      : h
  )
  updateLocation({ ...location, hours })
}

export function removeDropFromLocation(location: Location, hour: number, itemId: string): void {
  const hours = location.hours.map((h) =>
    h.hour === hour ? { ...h, items: h.items.filter((i) => i.id !== itemId) } : h
  )
  updateLocation({ ...location, hours })
}

export function totalForItems(items: DropItem[]): number {
  return items.reduce((sum, i) => sum + i.quantity * i.pricePerOne, 0)
}

/** Итого за час: ручной ввод или сумма по дропам */
export function totalForHour(hourData: HourData): number {
  if (hourData.totalOverride != null) return hourData.totalOverride
  return totalForItems(hourData.items)
}

/** Общий итог по локации: только фактические дропы (таблицы + в итог), без ручных итогов за час */
export function totalForLocation(location: Location): number {
  const fromHours = location.hours.reduce((sum, h) => sum + totalForItems(h.items), 0)
  const fromSummary = totalForItems(location.summaryOnlyItems ?? [])
  return fromHours + fromSummary
}

export function setHourTotalOverride(location: Location, hour: 1 | 2 | 3 | 4 | 5 | 6, value: number | null): void {
  const hours = location.hours.map((h) =>
    h.hour === hour ? { ...h, totalOverride: value ?? undefined } : h
  )
  updateLocation({ ...location, hours })
}

export function allItemsFromLocation(location: Location): DropItem[] {
  const fromHours = location.hours.flatMap((h) => h.items)
  const fromSummary = location.summaryOnlyItems ?? []
  return [...fromHours, ...fromSummary]
}

export function addDropToSummary(location: Location, item: Omit<DropItem, 'id'>): void {
  const list = location.summaryOnlyItems ?? []
  updateLocation({
    ...location,
    summaryOnlyItems: [...list, { ...item, id: crypto.randomUUID() }],
  })
}

export function updateSummaryDrop(location: Location, dropId: string, patch: Partial<DropItem>): void {
  const list = (location.summaryOnlyItems ?? []).map((i) =>
    i.id === dropId ? { ...i, ...patch } : i
  )
  updateLocation({ ...location, summaryOnlyItems: list })
}

export function removeSummaryDrop(location: Location, dropId: string): void {
  const list = (location.summaryOnlyItems ?? []).filter((i) => i.id !== dropId)
  updateLocation({ ...location, summaryOnlyItems: list })
}

/** Имя и иконка для дропа: из базы по itemId или legacy name/imageUrl */
export function resolveDropDisplay(drop: DropItem): { name: string; iconUrl: string } {
  if (drop.itemId) {
    const item = getItem(drop.itemId)
    if (item) return { name: item.name, iconUrl: item.iconUrl }
  }
  return { name: drop.name ?? '—', iconUrl: drop.imageUrl ?? '' }
}

/** Топ-3 предмета по количеству за 6 часов (без серебра). Возвращает itemId. */
export function getTopPopularItemIds(location: Location): string[] {
  const byItem = new Map<string, number>()
  const addDrops = (drops: DropItem[]) => {
    for (const d of drops) {
      if (!d.itemId) continue
      const item = getItem(d.itemId)
      if (item?.isSilver) continue
      byItem.set(d.itemId, (byItem.get(d.itemId) ?? 0) + d.quantity)
    }
  }
  for (const h of location.hours) addDrops(h.items)
  addDrops(location.summaryOnlyItems ?? [])
  return [...byItem.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([id]) => id)
}

/** Топ-3 предмета по прибыли за 6 часов (с серебром). Возвращает itemId. */
export function getTopProfitableItemIds(location: Location): string[] {
  const byItem = new Map<string, number>()
  const addDrops = (drops: DropItem[]) => {
    for (const d of drops) {
      if (!d.itemId) continue
      const profit = d.quantity * d.pricePerOne
      byItem.set(d.itemId, (byItem.get(d.itemId) ?? 0) + profit)
    }
  }
  for (const h of location.hours) addDrops(h.items)
  addDrops(location.summaryOnlyItems ?? [])
  return [...byItem.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([id]) => id)
}

/** Сумма только по предмету «Серебро» (isSilver) за 6 часов. */
export function getSilverTotalForLocation(location: Location): number {
  let sum = 0
  const addDrops = (drops: DropItem[]) => {
    for (const d of drops) {
      if (!d.itemId) continue
      const item = getItem(d.itemId)
      if (item?.isSilver) sum += d.quantity * d.pricePerOne
    }
  }
  for (const h of location.hours) addDrops(h.items)
  addDrops(location.summaryOnlyItems ?? [])
  return sum
}

export interface RunEntry {
  locationId: string
  locationName: string
  hour: number
  total: number
}

/** Все часовые заходы по всем локациям, отсортированные по сумме по убыванию. */
export function getAllRunsSorted(): RunEntry[] {
  const runs: RunEntry[] = []
  const locations = loadLocations()
  for (const loc of locations) {
    for (const h of loc.hours) {
      const total = totalForHour(h)
      runs.push({ locationId: loc.id, locationName: loc.name, hour: h.hour, total })
    }
  }
  return runs.sort((a, b) => b.total - a.total)
}

export interface LocationQuantity {
  locationId: string
  locationName: string
  quantity: number
}

/** Топ-3 локации, где чаще всего падает данный предмет (по суммарному количеству за все заходы). */
export function getTopLocationsForItem(itemId: string): LocationQuantity[] {
  const byLocation = new Map<string, number>()
  const locationNames = new Map<string, string>()
  const locations = loadLocations()
  for (const loc of locations) {
    locationNames.set(loc.id, loc.name)
    const addDrops = (drops: DropItem[]) => {
      for (const d of drops) {
        if (d.itemId !== itemId) continue
        byLocation.set(loc.id, (byLocation.get(loc.id) ?? 0) + d.quantity)
      }
    }
    for (const h of loc.hours) addDrops(h.items)
    addDrops(loc.summaryOnlyItems ?? [])
  }
  return [...byLocation.entries()]
    .filter(([, qty]) => qty > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([locId, quantity]) => ({
      locationId: locId,
      locationName: locationNames.get(locId) ?? '',
      quantity,
    }))
}

// Re-export items store for convenience
export { loadItems, getItem, addItem, updateItem, deleteItem, searchItems, setRemoteItems } from './items'
