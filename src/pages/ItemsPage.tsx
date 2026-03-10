import { useState, useRef, useMemo } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAppMode } from '../context/AppModeContext'
import { loadItems, addItem, updateItem, deleteItem, getTopLocationsForItem } from '../store'
import type { Item } from '../types'

export default function ItemsPage() {
  const { isReadOnly } = useAppMode()
  const locationRouter = useLocation()
  const [query, setQuery] = useState('')
  const [name, setName] = useState('')
  const [iconUrl, setIconUrl] = useState('')
  const [isSilver, setIsSilver] = useState(false)
  const [editing, setEditing] = useState<Item | null>(null)
  const [items, setItems] = useState<Item[]>(() => loadItems())
  const fileInputRef = useRef<HTMLInputElement>(null)

  const itemsWithTops = useMemo(
    () => items.map((item) => ({ item, topLocations: getTopLocationsForItem(item.id) })),
    [items]
  )

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return itemsWithTops
    return itemsWithTops.filter(({ item }) => item.name.toLowerCase().includes(q))
  }, [itemsWithTops, query])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => setIconUrl(String(reader.result))
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) return
    if (editing) {
      updateItem(editing.id, { name: trimmed, iconUrl: iconUrl || editing.iconUrl, isSilver })
      setEditing(null)
    } else {
      addItem({ name: trimmed, iconUrl, isSilver })
    }
    setItems(loadItems())
    setName('')
    setIconUrl('')
    setIsSilver(false)
  }

  const startEdit = (item: Item) => {
    setEditing(item)
    setName(item.name)
    setIconUrl(item.iconUrl)
    setIsSilver(item.isSilver ?? false)
  }

  const cancelEdit = () => {
    setEditing(null)
    setName('')
    setIconUrl('')
    setIsSilver(false)
  }

  return (
    <div>
      <h1 style={{ marginBottom: '1rem', fontSize: '1.5rem' }}>База предметов</h1>
      {!isReadOnly && (
        <form
          onSubmit={handleSubmit}
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '0.75rem',
            alignItems: 'flex-end',
            marginBottom: '1.5rem',
            padding: '1rem',
            background: 'var(--bg-card)',
            borderRadius: '8px',
            border: '1px solid var(--border)',
          }}
        >
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Название предмета"
            required
            style={inputStyle}
          />
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <input type="file" ref={fileInputRef} accept="image/*" onChange={handleFileChange} style={{ display: 'none' }} />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              style={{ ...btnStyle, background: 'var(--bg-card-hover)' }}
            >
              {iconUrl ? 'Сменить иконку' : 'Загрузить иконку'}
            </button>
            {iconUrl && (
              <img src={iconUrl} alt="" style={{ width: 40, height: 40, objectFit: 'contain', borderRadius: 6 }} />
            )}
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
            <input type="checkbox" checked={isSilver} onChange={(e) => setIsSilver(e.target.checked)} />
            <span style={{ fontSize: '0.9rem' }}>Серебро (1:1 в таблицах, искл. из «популярные»)</span>
          </label>
          <button type="submit" style={{ ...btnStyle, background: 'var(--accent)', color: '#fff' }}>
            {editing ? 'Сохранить' : 'Добавить'}
          </button>
          {editing && (
            <button type="button" onClick={cancelEdit} style={{ ...btnStyle, background: 'transparent' }}>
              Отмена
            </button>
          )}
        </form>
      )}
      <div style={{ marginBottom: '1rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Поиск по предметам…"
          style={{ ...inputStyle, minWidth: 260 }}
        />
        {query.trim() && (
          <button
            type="button"
            onClick={() => setQuery('')}
            style={{ ...btnStyle, background: 'transparent', color: 'var(--text-muted)' }}
          >
            Сбросить
          </button>
        )}
      </div>
      <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {filtered.map(({ item, topLocations }) => (
            <li
              key={item.id}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.75rem',
                padding: '0.75rem',
                background: 'var(--bg-card)',
                borderRadius: '8px',
                border: '1px solid var(--border)',
              }}
            >
              {item.iconUrl ? (
                <img src={item.iconUrl} alt="" style={{ width: 40, height: 40, objectFit: 'contain', borderRadius: 6, flexShrink: 0 }} />
              ) : (
                <div style={{ width: 40, height: 40, background: 'var(--bg-card-hover)', borderRadius: 6, flexShrink: 0 }} />
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <span style={{ fontWeight: 600 }}>{item.name}</span>
                  {item.isSilver && <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Серебро</span>}
                  {!isReadOnly && (
                    <>
                      <button
                        type="button"
                        onClick={() => startEdit(item)}
                        style={{ padding: '2px 6px', fontSize: '0.75rem', cursor: 'pointer', border: '1px solid var(--border)', borderRadius: 4, background: 'transparent', color: 'var(--text)' }}
                      >
                        Изм
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          deleteItem(item.id)
                          setItems(loadItems())
                        }}
                        style={{ padding: '2px 6px', fontSize: '0.75rem', cursor: 'pointer', border: '1px solid var(--border)', borderRadius: 4, background: 'transparent', color: '#f85149' }}
                      >
                        ×
                      </button>
                    </>
                  )}
                </div>
                {topLocations.length > 0 && (
                  <div style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    Чаще всего падает:{' '}
                    {topLocations.map((loc, i) => (
                      <span key={loc.locationId}>
                        {i > 0 && ', '}
                        <Link
                          to={
                            isReadOnly && locationRouter.search
                              ? `/location/${loc.locationId}${locationRouter.search}`
                              : `/location/${loc.locationId}`
                          }
                          style={{ color: 'var(--accent)' }}
                        >
                          {loc.locationName}
                        </Link>
                        <span style={{ marginLeft: 2 }}>({loc.quantity.toLocaleString('ru-RU')})</span>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </li>
          ))}
      </ul>
      {items.length === 0 && (
        <p style={{ color: 'var(--text-muted)' }}>Нет предметов. Добавьте первый.</p>
      )}
      {items.length > 0 && filtered.length === 0 && (
        <p style={{ color: 'var(--text-muted)' }}>Ничего не найдено.</p>
      )}
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  padding: '0.5rem 0.75rem',
  borderRadius: '6px',
  border: '1px solid var(--border)',
  background: 'var(--bg-dark)',
  color: 'var(--text)',
  minWidth: 180,
}

const btnStyle: React.CSSProperties = {
  padding: '0.5rem 1rem',
  borderRadius: '6px',
  border: '1px solid var(--border)',
  color: 'var(--text)',
  fontWeight: 600,
  cursor: 'pointer',
}
