import { useState, useEffect } from 'react'
import { getItem } from '../store'
import type { DropItem, Item } from '../types'
import ItemPicker from './ItemPicker'

export default function DropItemForm({
  initial,
  onSave,
  onCancel,
}: {
  initial?: Partial<DropItem> | null
  onSave: (item: Omit<DropItem, 'id'>) => void
  onCancel: () => void
}) {
  const [selectedItem, setSelectedItem] = useState<Item | null>(null)
  const [quantity, setQuantity] = useState(initial?.quantity ?? 1)
  const [pricePerOne, setPricePerOne] = useState(initial?.pricePerOne ?? 0)

  useEffect(() => {
    if (initial?.itemId) {
      const item = getItem(initial.itemId)
      if (item) setSelectedItem(item)
    }
    setQuantity(initial?.quantity ?? 1)
    setPricePerOne(initial?.pricePerOne ?? 0)
  }, [initial])

  // Серебро считается 1:1 — цена за штуку всегда 1
  useEffect(() => {
    if (selectedItem?.isSilver) setPricePerOne(1)
  }, [selectedItem])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedItem) return
    const price = selectedItem.isSilver ? 1 : pricePerOne
    onSave({ itemId: selectedItem.id, quantity, pricePerOne: price })
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'flex-end' }}>
      <ItemPicker value={selectedItem} onSelect={setSelectedItem} placeholder="Поиск предмета..." />
      <input
        type="number"
        min={1}
        value={quantity}
        onChange={(e) => setQuantity(Number(e.target.value) || 1)}
        placeholder="Кол-во"
        style={{ ...inputStyle, width: 80 }}
      />
      <input
        type="number"
        min={0}
        value={selectedItem?.isSilver ? 1 : (pricePerOne || '')}
        onChange={(e) => setPricePerOne(Number(e.target.value) || 0)}
        placeholder="Цена за шт (сереб.)"
        style={{ ...inputStyle, width: 120 }}
        disabled={selectedItem?.isSilver}
        title={selectedItem?.isSilver ? 'Серебро: 1 за штуку (1:1)' : undefined}
      />
      <button type="submit" style={btnPrimary} disabled={!selectedItem}>
        {initial ? 'Сохранить' : 'Добавить'}
      </button>
      <button type="button" onClick={onCancel} style={btnSecondary}>
        Отмена
      </button>
    </form>
  )
}

const inputStyle: React.CSSProperties = {
  padding: '0.5rem 0.75rem',
  borderRadius: '6px',
  border: '1px solid var(--border)',
  background: 'var(--bg-card)',
  color: 'var(--text)',
  minWidth: 120,
}

const btnPrimary: React.CSSProperties = {
  padding: '0.5rem 1rem',
  borderRadius: '6px',
  border: 'none',
  background: 'var(--accent)',
  color: '#fff',
  fontWeight: 600,
  cursor: 'pointer',
}

const btnSecondary: React.CSSProperties = {
  padding: '0.5rem 1rem',
  borderRadius: '6px',
  border: '1px solid var(--border)',
  background: 'transparent',
  color: 'var(--text)',
  cursor: 'pointer',
}
