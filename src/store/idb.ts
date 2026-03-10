const DB_NAME = 'TableDrop'
const STORE_NAME = 'locationImages'
const DB_VERSION = 1

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onerror = () => reject(req.error)
    req.onsuccess = () => resolve(req.result)
    req.onupgradeneeded = () => {
      req.result.createObjectStore(STORE_NAME, { keyPath: 'id' })
    }
  })
}

export async function saveLocationImage(locationId: string, dataUrl: string): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    tx.objectStore(STORE_NAME).put({ id: locationId, dataUrl })
    tx.oncomplete = () => { db.close(); resolve() }
    tx.onerror = () => { db.close(); reject(tx.error) }
  })
}

export async function getLocationImage(locationId: string): Promise<string | null> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly')
    const req = tx.objectStore(STORE_NAME).get(locationId)
    tx.oncomplete = () => {
      db.close()
      resolve(req.result?.dataUrl ?? null)
    }
    tx.onerror = () => { db.close(); reject(tx.error) }
  })
}

export async function deleteLocationImage(locationId: string): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    tx.objectStore(STORE_NAME).delete(locationId)
    tx.oncomplete = () => { db.close(); resolve() }
    tx.onerror = () => { db.close(); reject(tx.error) }
  })
}

export async function getAllLocationImages(): Promise<Record<string, string>> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly')
    const req = tx.objectStore(STORE_NAME).getAll()
    tx.oncomplete = () => {
      db.close()
      const out: Record<string, string> = {}
      for (const row of req.result || []) {
        if (row?.id && row?.dataUrl) out[row.id] = row.dataUrl
      }
      resolve(out)
    }
    tx.onerror = () => { db.close(); reject(tx.error) }
  })
}
