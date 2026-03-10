import { useMemo, useState, useState as useStateReact } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAppMode } from '../context/AppModeContext'
import { publishPublicState } from '../publish'
import {
  loadLocations,
  totalForLocation,
  totalForHour,
  loadItems,
} from '../store'
import type { RatingTab } from '../types'

const TABS: { key: RatingTab; label: string }[] = [
  { key: 'profit', label: 'Самая прибыльная локация' },
  { key: 'minDrop', label: 'Самый большой минимальный дроп' },
  { key: 'maxDrop', label: 'Самый большой максимальный дроп' },
  { key: 'silver', label: 'Самое большое количество серебра' },
  { key: 'runs', label: 'Рейтинг заходов' },
]

export default function Ratings() {
  const [tab, setTab] = useState<RatingTab>('profit')
  const { isReadOnly } = useAppMode()
  const [publishing, setPublishing] = useStateReact(false)
  const [publishError, setPublishError] = useStateReact<string | null>(null)
  const [publishOk, setPublishOk] = useStateReact(false)
  const locationRouter = useLocation()
  const locations = useMemo(() => loadLocations(), [])

  const silverItemIds = useMemo(() => {
    const items = loadItems()
    return new Set(items.filter((i) => i.isSilver).map((i) => i.id))
  }, [])

  const stats = useMemo(() => {
    return locations.map((loc) => {
      const hourTotals = loc.hours.map((h) => totalForHour(h))
      const minHourTotal =
        hourTotals.every((t) => t === 0) ? 0 : (Math.min(...hourTotals.filter((t) => t > 0), Infinity) || 0)
      const maxHourTotal = Math.max(0, ...hourTotals)

      let silverTotal = 0
      const addSilver = (drops: { itemId?: string; quantity: number; pricePerOne: number }[]) => {
        for (const d of drops) {
          if (!d.itemId) continue
          if (silverItemIds.has(d.itemId)) silverTotal += d.quantity * d.pricePerOne
        }
      }
      for (const h of loc.hours) addSilver(h.items)
      addSilver(loc.summaryOnlyItems ?? [])

      return {
        loc,
        total: totalForLocation(loc),
        minHourTotal,
        maxHourTotal,
        silverTotal,
      }
    })
  }, [locations, silverItemIds])

  const byProfit = useMemo(() => [...stats].sort((a, b) => b.total - a.total), [stats])
  const byMinDrop = useMemo(() => [...stats].sort((a, b) => b.minHourTotal - a.minHourTotal), [stats])
  const byMaxDrop = useMemo(() => [...stats].sort((a, b) => b.maxHourTotal - a.maxHourTotal), [stats])
  const bySilver = useMemo(() => [...stats].sort((a, b) => b.silverTotal - a.silverTotal), [stats])

  const allRuns = useMemo(() => {
    const runs: { locationId: string; locationName: string; hour: number; total: number }[] = []
    for (const loc of locations) {
      for (const h of loc.hours) {
        runs.push({ locationId: loc.id, locationName: loc.name, hour: h.hour, total: totalForHour(h) })
      }
    }
    return runs.sort((a, b) => b.total - a.total)
  }, [locations])

  const sorted = useMemo(() => {
    switch (tab) {
      case 'profit':
        return byProfit
      case 'minDrop':
        return byMinDrop
      case 'maxDrop':
        return byMaxDrop
      case 'silver':
        return bySilver
      case 'runs':
        return []
    }
  }, [tab, byProfit, byMinDrop, byMaxDrop, bySilver])
  const placeStyle = (place: number) => {
    const colors: Record<number, string> = {
      1: 'var(--gold-1)',
      2: 'var(--gold-2)',
      3: 'var(--gold-3)',
    }
    return { color: colors[place] ?? 'var(--text)', fontWeight: place <= 3 ? 700 : 400 }
  }

  return (
    <div>
      <h1 style={{ marginBottom: '1rem', fontSize: '1.5rem' }}>Рейтинги</h1>
      {!isReadOnly && (
        <div style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button
            type="button"
            disabled={publishing}
            onClick={async () => {
              setPublishing(true)
              setPublishError(null)
              setPublishOk(false)
              try {
                await publishPublicState()
                setPublishOk(true)
              } catch (e) {
                const msg = e instanceof Error ? e.message : String(e)
                // eslint-disable-next-line no-console
                console.error('publishPublicState error', e)
                setPublishError(msg)
              } finally {
                setPublishing(false)
              }
            }}
            style={{
              padding: '0.45rem 0.9rem',
              borderRadius: '6px',
              border: '1px solid var(--accent)',
              background: publishing ? 'var(--bg-card-hover)' : 'var(--accent)',
              color: 'var(--bg-dark)',
              cursor: publishing ? 'default' : 'pointer',
              fontSize: '0.9rem',
              fontWeight: 600,
            }}
          >
            {publishing ? 'Загружаем…' : 'Загрузить для всех'}
          </button>
          {publishOk && !publishError && (
            <span style={{ fontSize: '0.85rem', color: 'var(--success)' }}>Успешно опубликовано.</span>
          )}
          {publishError && (
            <span style={{ fontSize: '0.85rem', color: '#f85149' }}>
              Ошибка публикации: {publishError}
            </span>
          )}
        </div>
      )}
      <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
        {TABS.map(({ key, label }) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: '6px',
              border: tab === key ? '2px solid var(--accent)' : '1px solid var(--border)',
              background: tab === key ? 'var(--bg-card-hover)' : 'var(--bg-card)',
              color: tab === key ? 'var(--accent)' : 'var(--text)',
              cursor: 'pointer',
              fontWeight: tab === key ? 600 : 400,
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'runs' ? (
        allRuns.length === 0 ? (
          <p style={{ color: 'var(--text-muted)' }}>Нет заходов. Добавьте локации и дропы.</p>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {allRuns.map((run, index) => {
              const place = index + 1
              const medal = place === 1 ? '🥇' : place === 2 ? '🥈' : place === 3 ? '🥉' : ''
              return (
                <li
                  key={`${run.locationId}-${run.hour}`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                    padding: '0.75rem 1rem',
                    marginBottom: '0.5rem',
                    background: 'var(--bg-card)',
                    borderRadius: '8px',
                    border: '1px solid var(--border)',
                    borderLeft:
                      place <= 3
                        ? `4px solid ${
                            place === 1 ? 'var(--gold-1)' : place === 2 ? 'var(--gold-2)' : 'var(--gold-3)'
                          }`
                        : undefined,
                  }}
                >
                  <span style={{ minWidth: 32, ...placeStyle(place) }}>
                    {medal} {place}
                  </span>
                  <Link
                  to={
                    locationRouter.search
                      ? `/location/${run.locationId}${locationRouter.search}`
                      : `/location/${run.locationId}`
                  }
                    style={{ flex: 1, color: 'var(--text)', textDecoration: 'none', fontWeight: 600 }}
                  >
                    {run.locationName}
                  </Link>
                  <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                    Час {run.hour}
                  </span>
                  <span style={{ fontFamily: 'var(--font-mono)', ...placeStyle(place) }}>
                    {run.total.toLocaleString('ru-RU')} сереб.
                  </span>
                </li>
              )
            })}
          </ul>
        )
      ) : sorted.length === 0 ? (
        <p style={{ color: 'var(--text-muted)' }}>Нет данных для рейтинга. Добавьте локации и дропы.</p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {sorted.map((row, index) => {
            const place = index + 1
            const value =
              tab === 'profit'
                ? row.total
                : tab === 'minDrop'
                  ? row.minHourTotal
                  : tab === 'maxDrop'
                    ? row.maxHourTotal
                    : row.silverTotal
            const medal = place === 1 ? '🥇' : place === 2 ? '🥈' : place === 3 ? '🥉' : ''
            return (
              <li
                key={row.loc.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                  padding: '0.75rem 1rem',
                  marginBottom: '0.5rem',
                  background: 'var(--bg-card)',
                  borderRadius: '8px',
                  border: '1px solid var(--border)',
                  borderLeft:
                    place <= 3
                      ? `4px solid ${
                          place === 1 ? 'var(--gold-1)' : place === 2 ? 'var(--gold-2)' : 'var(--gold-3)'
                        }`
                      : undefined,
                }}
              >
                <span style={{ minWidth: 32, ...placeStyle(place) }}>
                  {medal} {place}
                </span>
                <Link
                  to={
                    locationRouter.search
                      ? `/location/${row.loc.id}${locationRouter.search}`
                      : `/location/${row.loc.id}`
                  }
                  style={{ flex: 1, color: 'var(--text)', textDecoration: 'none', fontWeight: 600 }}
                >
                  {row.loc.name}
                </Link>
                <span style={{ fontFamily: 'var(--font-mono)', ...placeStyle(place) }}>
                  {value.toLocaleString('ru-RU')} сереб.
                </span>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
