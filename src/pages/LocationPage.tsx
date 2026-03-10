import { useState, useEffect } from 'react'
import { useLocation as useRouterLocation, useParams, useNavigate } from 'react-router-dom'
import {
  getLocation,
  createLocation,
  updateLocation,
  addDropToHour,
  updateDropInLocation,
  removeDropFromLocation,
  setHourTotalOverride,
  totalForLocation,
  allItemsFromLocation,
  resolveDropDisplay,
  addDropToSummary,
  updateSummaryDrop,
  removeSummaryDrop,
} from '../store'
import { useLocationImages } from '../context/LocationImagesContext'
import { useAppMode } from '../context/AppModeContext'
import type { Location as LocationType, DropItem } from '../types'
import HourTable from '../components/HourTable'
import DropItemForm from '../components/DropItemForm'
import { compressImageForStorage } from '../utils/image'
import * as idb from '../store/idb'

export default function LocationPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const routerLocation = useRouterLocation()
  const { imageUrls, addLocationImage, removeLocationImage } = useLocationImages()
  const { isReadOnly } = useAppMode()
  const [location, setLocation] = useState<LocationType | null>(null)
  const [editingHour, setEditingHour] = useState<number | null>(null)
  const [editingItem, setEditingItem] = useState<DropItem | null>(null)
  const [showAddForm, setShowAddForm] = useState<number | null>(null)
  const [showSummaryAddForm, setShowSummaryAddForm] = useState(false)
  const [editingSummaryItem, setEditingSummaryItem] = useState<DropItem | null>(null)
  const [imageError, setImageError] = useState<string | null>(null)
  const [imageLoading, setImageLoading] = useState(false)

  useEffect(() => {
    if (id === 'new') {
      const loc = createLocation('Новая локация')
      updateLocation(loc)
      navigate(`/location/${loc.id}`, { replace: true })
      setLocation(loc)
      return
    }
    const loc = id ? getLocation(id) : null
    setLocation(loc ?? null)
  }, [id])

  const refreshLocation = () => {
    if (!location) return
    setLocation(getLocation(location.id) ?? location)
  }

  if (!location) {
    return <div style={{ color: 'var(--text-muted)' }}>Загрузка...</div>
  }

  const handleSaveName = (name: string) => {
    const next = { ...location, name: name.trim() || location.name }
    updateLocation(next)
    setLocation(next)
  }

  const handleLocationImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''
    setImageError(null)
    setImageLoading(true)
    try {
      const dataUrl = await compressImageForStorage(file)
      await idb.saveLocationImage(location.id, dataUrl)
      addLocationImage(location.id, dataUrl)
      const next = { ...location, hasImage: true }
      updateLocation(next)
      setLocation(next)
    } catch (err) {
      if (err instanceof Error && err.message === 'QUOTA_EXCEEDED') {
        setImageError('Недостаточно места в хранилище. Удалите изображение в этой или других локациях (кнопка «Удалить изображение» ниже).')
      } else {
        setImageError('Не удалось обработать изображение.')
      }
    } finally {
      setImageLoading(false)
    }
  }

  const handleAddDrop = (hour: number) => (item: Omit<DropItem, 'id'>) => {
    if (!item.itemId) return
    addDropToHour(location, hour as 1 | 2 | 3 | 4 | 5 | 6, item)
    refreshLocation()
    setShowAddForm(null)
  }

  const handleEditDrop = (hour: number) => (item: DropItem) => {
    setEditingHour(hour)
    setEditingItem(item)
  }

  const handleUpdateDrop = (patch: Partial<DropItem>) => {
    if (!editingHour || !editingItem) return
    updateDropInLocation(location, editingHour, editingItem.id, patch)
    refreshLocation()
    setEditingHour(null)
    setEditingItem(null)
  }

  const handleRemoveDrop = (hour: number) => (itemId: string) => {
    removeDropFromLocation(location, hour, itemId)
    refreshLocation()
  }

  const handleAddSummaryDrop = (item: Omit<DropItem, 'id'>) => {
    if (!item.itemId) return
    addDropToSummary(location, item)
    refreshLocation()
    setShowSummaryAddForm(false)
  }

  const handleUpdateSummaryDrop = (patch: Partial<DropItem>) => {
    if (!editingSummaryItem) return
    updateSummaryDrop(location, editingSummaryItem.id, patch)
    refreshLocation()
    setEditingSummaryItem(null)
  }

  const handleRemoveSummaryDrop = (dropId: string) => {
    removeSummaryDrop(location, dropId)
    refreshLocation()
  }

  const grandTotal = totalForLocation(location)
  const summaryOnly = location.summaryOnlyItems ?? []
  const allItems = allItemsFromLocation(location)

  // Итог за 6 часов: суммируем по предметам (itemId), сортировка по сумме по убыванию
  const aggregatedByItem = (() => {
    const map = new Map<string, { quantity: number; sum: number; name: string; iconUrl: string }>()
    for (const drop of allItems) {
      const key = drop.itemId ?? drop.id
      const sum = drop.quantity * drop.pricePerOne
      const { name, iconUrl } = resolveDropDisplay(drop)
      const existing = map.get(key)
      if (existing) {
        existing.quantity += drop.quantity
        existing.sum += sum
      } else {
        map.set(key, { quantity: drop.quantity, sum, name, iconUrl })
      }
    }
    return [...map.entries()]
      .map(([key, v]) => ({ key, ...v }))
      .sort((a, b) => b.sum - a.sum)
  })()

  return (
    <div>
      <div style={{ marginBottom: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          {isReadOnly ? (
            <div
              style={{
                fontSize: '1.25rem',
                fontWeight: 700,
                padding: '0.5rem 0.75rem',
                border: '1px solid var(--border)',
                borderRadius: '6px',
                background: 'var(--bg-card)',
                color: 'var(--text)',
                minWidth: 200,
              }}
            >
              {location.name}
            </div>
          ) : (
            <input
              type="text"
              value={location.name}
              onChange={(e) => handleSaveName(e.target.value)}
              onBlur={(e) => handleSaveName(e.target.value)}
              style={{
                fontSize: '1.25rem',
                fontWeight: 700,
                padding: '0.5rem 0.75rem',
                border: '1px solid var(--border)',
                borderRadius: '6px',
                background: 'var(--bg-card)',
                color: 'var(--text)',
                minWidth: 200,
              }}
            />
          )}
          {!isReadOnly && (
            <label style={{ cursor: 'pointer', padding: '0.5rem 0.75rem', border: '1px solid var(--border)', borderRadius: '6px', background: 'var(--bg-card-hover)', fontSize: '0.9rem' }}>
              {imageLoading ? 'Загрузка…' : (location.hasImage || (location as { imageUrl?: string }).imageUrl || imageUrls[location.id]) ? 'Сменить изображение' : 'Загрузить изображение локации'}
              <input type="file" accept="image/*" onChange={handleLocationImage} style={{ display: 'none' }} disabled={imageLoading} />
            </label>
          )}
        </div>
        {imageError && (
          <p style={{ marginTop: '0.5rem', fontSize: '0.9rem', color: '#f85149' }}>{imageError}</p>
        )}
        {(location.hasImage || (location as { imageUrl?: string }).imageUrl || imageUrls[location.id]) && (
          <div style={{ marginTop: '0.5rem' }}>
            {(imageUrls[location.id] ?? (location as { imageUrl?: string }).imageUrl) && (
              <img
                src={imageUrls[location.id] ?? (location as { imageUrl?: string }).imageUrl}
                alt=""
                style={{
                  display: 'block',
                  maxWidth: 400,
                  maxHeight: 200,
                  objectFit: 'contain',
                  borderRadius: 8,
                  border: '1px solid var(--border)',
                }}
              />
            )}
            {!isReadOnly && (
              <button
                type="button"
                onClick={async () => {
                  await idb.deleteLocationImage(location.id)
                  removeLocationImage(location.id)
                  const next = { ...location, hasImage: false }
                  updateLocation(next)
                  setLocation(next)
                  setImageError(null)
                }}
                style={{
                  marginTop: '0.5rem',
                  padding: '0.35rem 0.75rem',
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  border: '1px solid var(--border)',
                  borderRadius: 6,
                  background: 'transparent',
                  color: 'var(--text-muted)',
                }}
              >
                Удалить изображение
              </button>
            )}
          </div>
        )}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
        {id !== 'new' && (
          <button
            type="button"
            onClick={() =>
              navigate(routerLocation.search ? `/${routerLocation.search}` : '/')
            }
            style={{
              padding: '0.5rem 1rem',
              borderRadius: '6px',
              border: '1px solid var(--border)',
              background: 'transparent',
              color: 'var(--text)',
              cursor: 'pointer',
            }}
          >
            ← К списку
          </button>
        )}
      </div>

      {location.hours.map((hourData) => (
          <div key={hourData.hour} style={{ marginBottom: '1.5rem' }}>
            <HourTable
              data={hourData}
              readOnly={isReadOnly}
              onAdd={isReadOnly ? undefined : (showAddForm === hourData.hour ? undefined : () => setShowAddForm(hourData.hour))}
              onEdit={isReadOnly ? undefined : handleEditDrop(hourData.hour)}
              onRemove={isReadOnly ? undefined : handleRemoveDrop(hourData.hour)}
              onTotalChange={
                isReadOnly
                  ? undefined
                  : (value) => {
                      setHourTotalOverride(location, hourData.hour, value)
                      refreshLocation()
                    }
              }
            />
            {!isReadOnly && showAddForm === hourData.hour && (
              <div style={{ marginBottom: '1rem', padding: '1rem', background: 'var(--bg-card)', borderRadius: '8px', border: '1px solid var(--border)' }}>
                <DropItemForm
                  onSave={handleAddDrop(hourData.hour)}
                  onCancel={() => setShowAddForm(null)}
                />
              </div>
            )}
          </div>
        ))}

      {editingItem && editingHour !== null && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10 }}>
          <div style={{ background: 'var(--bg-card)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border)', minWidth: 320 }}>
            <h3 style={{ marginTop: 0 }}>Редактировать дроп</h3>
            <DropItemForm
              initial={editingItem}
              onSave={(item) => handleUpdateDrop(item)}
              onCancel={() => { setEditingItem(null); setEditingHour(null) }}
            />
          </div>
        </div>
      )}
      {!isReadOnly && editingSummaryItem && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10 }}>
          <div style={{ background: 'var(--bg-card)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border)', minWidth: 320 }}>
            <h3 style={{ marginTop: 0 }}>Редактировать дроп в итоге</h3>
            <DropItemForm
              initial={editingSummaryItem}
              onSave={(item) => handleUpdateSummaryDrop(item)}
              onCancel={() => setEditingSummaryItem(null)}
            />
          </div>
        </div>
      )}

      <section style={{ marginTop: '2rem' }}>
        <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>Итог за все 6 часов</h2>
        <div style={{ marginBottom: '1rem' }}>
          {!isReadOnly && (!showSummaryAddForm ? (
            <button
              type="button"
              onClick={() => setShowSummaryAddForm(true)}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '6px',
                border: '1px dashed var(--border)',
                background: 'transparent',
                color: 'var(--accent)',
                cursor: 'pointer',
                fontSize: '0.9rem',
              }}
            >
              + Добавить дроп в итог (без разбивки по часам)
            </button>
          ) : (
            <div style={{ padding: '1rem', background: 'var(--bg-card)', borderRadius: '8px', border: '1px solid var(--border)' }}>
              <DropItemForm
                onSave={handleAddSummaryDrop}
                onCancel={() => setShowSummaryAddForm(false)}
              />
            </div>
          ))}
          {summaryOnly.length > 0 && (
            <div style={{ marginTop: '0.75rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              В итог добавлено без привязки к часу: {summaryOnly.map((d) => {
                const { name } = resolveDropDisplay(d)
                const sum = d.quantity * d.pricePerOne
                return (
                  <span key={d.id} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', marginRight: '0.75rem', marginBottom: '0.25rem' }}>
                    {name} ({d.quantity} × {d.pricePerOne.toLocaleString('ru-RU')} = {sum.toLocaleString('ru-RU')} сереб.)
                    {!isReadOnly && (
                      <>
                        <button type="button" onClick={() => setEditingSummaryItem(d)} style={{ padding: '1px 4px', fontSize: '0.75rem', cursor: 'pointer' }}>Изм</button>
                        <button type="button" onClick={() => handleRemoveSummaryDrop(d.id)} style={{ padding: '1px 4px', fontSize: '0.75rem', cursor: 'pointer', color: '#f85149' }}>×</button>
                      </>
                    )}
                  </span>
                )
              })}
              </div>
          )}
        </div>
        <div
          style={{
            background: 'var(--bg-card)',
            borderRadius: '8px',
            border: '2px solid var(--accent)',
            overflow: 'hidden',
          }}
        >
          <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'var(--font-mono)', fontSize: '0.9rem' }}>
            <thead>
              <tr style={{ background: 'var(--bg-card-hover)' }}>
                <th style={thStyle}>Название</th>
                <th style={thStyle}>Изображение</th>
                <th style={thStyle}>Кол-во</th>
                <th style={thStyle}>Цена за 1 шт (сереб.)</th>
                <th style={thStyle}>Сумма (сереб.)</th>
              </tr>
            </thead>
            <tbody>
              {aggregatedByItem.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ padding: '1rem', color: 'var(--text-muted)', textAlign: 'center' }}>
                    Нет дропов
                  </td>
                </tr>
              ) : (
                aggregatedByItem.map((row) => {
                  const avgPrice = row.quantity > 0 ? row.sum / row.quantity : 0
                  return (
                    <tr key={row.key} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={tdStyle}>{row.name}</td>
                      <td style={tdStyle}>
                        {row.iconUrl ? (
                          <img src={row.iconUrl} alt="" style={{ width: 32, height: 32, objectFit: 'contain', borderRadius: 4 }} />
                        ) : '—'}
                      </td>
                      <td style={tdStyle}>{row.quantity.toLocaleString('ru-RU')}</td>
                      <td style={tdStyle}>{avgPrice > 0 ? avgPrice.toLocaleString('ru-RU', { maximumFractionDigits: 0 }) : '—'}</td>
                      <td style={tdStyle}>{row.sum.toLocaleString('ru-RU')}</td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
          <div
            style={{
              padding: '1rem',
              textAlign: 'right',
              fontWeight: 700,
              fontSize: '1.1rem',
              background: 'var(--accent)',
              color: '#fff',
            }}
          >
            Общий итог: {grandTotal.toLocaleString('ru-RU')} сереб.
          </div>
        </div>
      </section>
    </div>
  )
}

const thStyle: React.CSSProperties = {
  padding: '0.5rem 0.75rem',
  textAlign: 'left',
  borderBottom: '1px solid var(--border)',
  fontWeight: 600,
}
const tdStyle: React.CSSProperties = {
  padding: '0.5rem 0.75rem',
  borderBottom: '1px solid var(--border)',
}
