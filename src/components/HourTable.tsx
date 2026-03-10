import { useState } from 'react'
import type { DropItem, HourData } from '../types'
import { totalForHour, resolveDropDisplay } from '../store'

const columns = ['Название дропа', 'Изображение', 'Кол-во', 'Цена за 1 шт (сереб.)', 'Сумма (сереб.)']
const COLLAPSED_ROWS = 5

export default function HourTable({
  data,
  onAdd,
  onEdit,
  onRemove,
  onTotalChange,
  readOnly,
}: {
  data: HourData
  onAdd?: () => void
  onEdit?: (item: DropItem) => void
  onRemove?: (itemId: string) => void
  /** Редактировать «Итого за час» без заполнения таблицы */
  onTotalChange?: (value: number | null) => void
  readOnly?: boolean
}) {
  const [expanded, setExpanded] = useState(false)
  const [editingTotal, setEditingTotal] = useState(false)
  const [totalInput, setTotalInput] = useState('')
  const total = totalForHour(data)
  const hasOverride = data.totalOverride != null

  // В каждом часу 1, 2, 3 место — по предметам (по сумме за этот час)
  const itemsWithSum = data.items.map((item) => ({
    item,
    sum: item.quantity * item.pricePerOne,
  }))
  const sorted = [...itemsWithSum].sort((a, b) => b.sum - a.sum)
  const placeByDropId: Record<string, 1 | 2 | 3> = {}
  sorted.forEach((s, i) => {
    if (i < 3) placeByDropId[s.item.id] = (i + 1) as 1 | 2 | 3
  })

  const canCollapse = sorted.length > COLLAPSED_ROWS
  const visibleRows = canCollapse && !expanded ? sorted.slice(0, COLLAPSED_ROWS) : sorted
  const hiddenCount = sorted.length - visibleRows.length

  const placeStyle = (place: 1 | 2 | 3) => {
    const colors = { 1: 'var(--gold-1)', 2: 'var(--gold-2)', 3: 'var(--gold-3)' }
    return { color: colors[place], fontWeight: 700 }
  }

  return (
    <div
      style={{
        background: 'var(--bg-card)',
        borderRadius: '8px',
        border: '1px solid var(--border)',
        overflow: 'hidden',
        marginBottom: '1rem',
      }}
    >
      <div
        style={{
          padding: '0.5rem 1rem',
          background: 'var(--bg-card-hover)',
          borderBottom: '1px solid var(--border)',
          fontWeight: 700,
          fontFamily: 'var(--font-mono)',
        }}
      >
        Час {data.hour}
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'var(--font-mono)', fontSize: '0.9rem' }}>
        <thead>
          <tr style={{ background: 'var(--bg-card-hover)' }}>
            <th
              style={{
                padding: '0.5rem 0.75rem',
                textAlign: 'left',
                borderBottom: '1px solid var(--border)',
                fontWeight: 600,
                width: 40,
              }}
            >
              {' '}
            </th>
            {columns.map((c) => (
              <th
                key={c}
                style={{
                  padding: '0.5rem 0.75rem',
                  textAlign: 'left',
                  borderBottom: '1px solid var(--border)',
                  fontWeight: 600,
                }}
              >
                {c}
              </th>
            ))}
            {!readOnly && <th style={{ width: 40 }} />}
          </tr>
        </thead>
        <tbody>
          {visibleRows.map(({ item }) => {
            const sum = item.quantity * item.pricePerOne
            const { name, iconUrl } = resolveDropDisplay(item)
            const place = placeByDropId[item.id]
            return (
              <tr key={item.id} style={{ borderBottom: '1px solid var(--border)' }}>
                <td style={{ padding: '0.5rem 0.75rem', width: 40 }}>
                  {place && (
                    <span style={placeStyle(place)}>
                      {place === 1 && '🥇'}
                      {place === 2 && '🥈'}
                      {place === 3 && '🥉'}
                    </span>
                  )}
                </td>
                <td style={{ padding: '0.5rem 0.75rem' }}>{name}</td>
                <td style={{ padding: '0.5rem 0.75rem' }}>
                  {iconUrl ? (
                    <img
                      src={iconUrl}
                      alt=""
                      style={{ width: 32, height: 32, objectFit: 'contain', borderRadius: 4 }}
                    />
                  ) : (
                    <span style={{ color: 'var(--text-muted)' }}>—</span>
                  )}
                </td>
                <td style={{ padding: '0.5rem 0.75rem' }}>{item.quantity}</td>
                <td style={{ padding: '0.5rem 0.75rem' }}>{item.pricePerOne.toLocaleString('ru-RU')}</td>
                <td style={{ padding: '0.5rem 0.75rem' }}>{sum.toLocaleString('ru-RU')}</td>
                {!readOnly && (
                  <td style={{ padding: '0.5rem' }}>
                    {onEdit && (
                      <button
                        type="button"
                        onClick={() => onEdit(item)}
                        style={{
                          marginRight: 4,
                          padding: '2px 6px',
                          fontSize: '0.75rem',
                          cursor: 'pointer',
                          border: '1px solid var(--border)',
                          borderRadius: 4,
                          background: 'transparent',
                          color: 'var(--text)',
                        }}
                      >
                        Изм
                      </button>
                    )}
                    {onRemove && (
                      <button
                        type="button"
                        onClick={() => onRemove(item.id)}
                        style={{
                          padding: '2px 6px',
                          fontSize: '0.75rem',
                          cursor: 'pointer',
                          border: '1px solid var(--border)',
                          borderRadius: 4,
                          background: 'transparent',
                          color: '#f85149',
                        }}
                      >
                        ×
                      </button>
                    )}
                  </td>
                )}
              </tr>
            )
          })}
        </tbody>
      </table>
      {canCollapse && (
        <div style={{ padding: '0.5rem 1rem', borderTop: '1px solid var(--border)' }}>
          <button
            type="button"
            onClick={() => setExpanded((e) => !e)}
            style={{
              padding: '0.35rem 0.75rem',
              fontSize: '0.9rem',
              cursor: 'pointer',
              border: '1px solid var(--border)',
              borderRadius: 6,
              background: 'var(--bg-card-hover)',
              color: 'var(--accent)',
            }}
          >
            {expanded ? 'Свернуть ↑' : `Развернуть (ещё ${hiddenCount}) ↓`}
          </button>
        </div>
      )}
      <div
        style={{
          padding: '0.5rem 1rem',
          textAlign: 'right',
          fontWeight: 700,
          background: 'var(--bg-card-hover)',
          borderTop: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          gap: '0.5rem',
          flexWrap: 'wrap',
        }}
      >
        {!editingTotal ? (
          <>
            <span>
              Итого за час: {total.toLocaleString('ru-RU')} сереб.
              {hasOverride && <span style={{ color: 'var(--text-muted)', fontWeight: 500, marginLeft: 4 }}>(задано вручную)</span>}
            </span>
            {!readOnly && onTotalChange && (
              <button
                type="button"
                onClick={() => {
                  setEditingTotal(true)
                  setTotalInput(String(data.totalOverride ?? total))
                }}
                style={{
                  padding: '2px 8px',
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                  border: '1px solid var(--border)',
                  borderRadius: 4,
                  background: 'transparent',
                  color: 'var(--accent)',
                }}
              >
                Изм
              </button>
            )}
          </>
        ) : (
          <>
            <span>Итого за час:</span>
            <input
              type="number"
              min={0}
              step={1}
              value={totalInput}
              onChange={(e) => setTotalInput(e.target.value)}
              style={{
                width: 120,
                padding: '4px 8px',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.9rem',
                border: '1px solid var(--border)',
                borderRadius: 4,
                background: 'var(--bg-card)',
                color: 'var(--text)',
              }}
            />
            <span>сереб.</span>
            <button
              type="button"
              onClick={() => {
                const n = Number(totalInput.replace(/\s/g, ''))
                if (!Number.isNaN(n) && n >= 0) onTotalChange?.(n)
                setEditingTotal(false)
              }}
              style={{
                padding: '2px 8px',
                fontSize: '0.8rem',
                cursor: 'pointer',
                border: '1px solid var(--accent)',
                borderRadius: 4,
                background: 'var(--accent)',
                color: 'var(--bg)',
              }}
            >
              OK
            </button>
            {hasOverride && (
              <button
                type="button"
                onClick={() => {
                  onTotalChange?.(null)
                  setEditingTotal(false)
                }}
                style={{
                  padding: '2px 8px',
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                  border: '1px solid var(--border)',
                  borderRadius: 4,
                  background: 'transparent',
                  color: 'var(--text-muted)',
                }}
              >
                Сбросить
              </button>
            )}
            <button
              type="button"
              onClick={() => setEditingTotal(false)}
              style={{
                padding: '2px 8px',
                fontSize: '0.8rem',
                cursor: 'pointer',
                border: '1px solid var(--border)',
                borderRadius: 4,
                background: 'transparent',
                color: 'var(--text)',
              }}
            >
              Отмена
            </button>
          </>
        )}
      </div>
      {!readOnly && onAdd && (
        <div style={{ padding: '0.5rem 1rem' }}>
          <button
            type="button"
            onClick={onAdd}
            style={{
              padding: '0.35rem 0.75rem',
              borderRadius: '6px',
              border: '1px dashed var(--border)',
              background: 'transparent',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              fontSize: '0.9rem',
            }}
          >
            + Добавить дроп
          </button>
        </div>
      )}
    </div>
  )
}
