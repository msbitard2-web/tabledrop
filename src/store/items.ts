import type { Item } from '../types'

const STORAGE_KEY = 'police-drop-items'

// Фолбэк для read-only viewer: если не смогли сохранить предметы в localStorage
let remoteItems: Item[] | null = null

export function setRemoteItems(items: Item[] | null): void {
  remoteItems = items
}

export function loadItems(): Item[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return remoteItems ?? []
    const data = JSON.parse(raw) as Item[]
    if (Array.isArray(data)) return data
    return remoteItems ?? []
  } catch {
    return remoteItems ?? []
  }
}

function saveItems(items: Item[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
}

export function getItem(id: string): Item | undefined {
  return loadItems().find((i) => i.id === id)
}

export function addItem(item: Omit<Item, 'id'>): Item {
  const newItem: Item = { ...item, id: crypto.randomUUID() }
  const items = [...loadItems(), newItem]
  saveItems(items)
  return newItem
}

export function updateItem(id: string, patch: Partial<Omit<Item, 'id'>>): void {
  const items = loadItems().map((i) => (i.id === id ? { ...i, ...patch } : i))
  saveItems(items)
}

export function deleteItem(id: string): void {
  saveItems(loadItems().filter((i) => i.id !== id))
}

export function searchItems(query: string): Item[] {
  const q = query.trim().toLowerCase()
  if (!q) return loadItems()
  return loadItems().filter((i) => i.name.toLowerCase().includes(q))
}
