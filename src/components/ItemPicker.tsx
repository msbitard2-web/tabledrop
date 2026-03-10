import { useState, useRef, useEffect } from 'react'
import { searchItems } from '../store'
import type { Item } from '../types'

export default function ItemPicker({
  value,
  onSelect,
  placeholder = 'Поиск предмета...',
}: {
  value: Item | null
  onSelect: (item: Item | null) => void
  placeholder?: string
}) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [highlight, setHighlight] = useState(0)
  const rootRef = useRef<HTMLDivElement>(null)

  const items = searchItems(query)
  const showList = open && items.length > 0

  useEffect(() => {
    if (!open) return
    setHighlight(0)
  }, [query, open])

  useEffect(() => {
    const handle = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showList) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHighlight((h) => (h + 1) % items.length)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlight((h) => (h - 1 + items.length) % items.length)
    } else if (e.key === 'Enter') {
      e.preventDefault()
      onSelect(items[highlight])
      setOpen(false)
      setQuery('')
    } else if (e.key === 'Escape') {
      setOpen(false)
    }
  }

  return (
    <div ref={rootRef} style={{ position: 'relative', minWidth: 200 }}>
      <input
        type="text"
        value={value ? value.name : query}
        onChange={(e) => {
          setQuery(e.target.value)
          setOpen(true)
          if (value) onSelect(null)
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        style={{
          padding: '0.5rem 0.75rem',
          borderRadius: '6px',
          border: '1px solid var(--border)',
          background: 'var(--bg-card)',
          color: 'var(--text)',
          width: '100%',
        }}
      />
      {value && !query && (
        <span
          style={{
            position: 'absolute',
            right: 8,
            top: '50%',
            transform: 'translateY(-50%)',
            cursor: 'pointer',
            color: 'var(--text-muted)',
            fontSize: '0.8rem',
          }}
          onClick={() => onSelect(null)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && onSelect(null)}
        >
          ✕
        </span>
      )}
      {showList && (
        <ul
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: '100%',
            margin: 0,
            padding: '0.25rem 0',
            listStyle: 'none',
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: '6px',
            maxHeight: 220,
            overflow: 'auto',
            zIndex: 20,
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
          }}
        >
          {items.map((item, i) => (
            <li
              key={item.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.5rem 0.75rem',
                cursor: 'pointer',
                background: i === highlight ? 'var(--bg-card-hover)' : 'transparent',
              }}
              onMouseEnter={() => setHighlight(i)}
              onMouseDown={(e) => {
                e.preventDefault()
                onSelect(item)
                setOpen(false)
                setQuery('')
              }}
            >
              {item.iconUrl ? (
                <img src={item.iconUrl} alt="" style={{ width: 28, height: 28, objectFit: 'contain', borderRadius: 4 }} />
              ) : (
                <div style={{ width: 28, height: 28, background: 'var(--bg-card-hover)', borderRadius: 4 }} />
              )}
              <span>{item.name}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
