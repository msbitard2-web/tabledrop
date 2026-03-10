import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useLocationImages } from '../context/LocationImagesContext'
import { useAppMode } from '../context/AppModeContext'
import {
  loadLocations,
  createLocation,
  updateLocation,
  totalForLocation,
  getTopPopularItemIds,
  getTopProfitableItemIds,
  getItem,
} from '../store'

/** Уровни по итогу: до 500к, 500к–1кк, 1кк–2кк, 2кк–3кк, 3кк–5кк, 5кк–7.5кк, 7.5кк+ → индекс 0..6 */
const TIERS = [0, 500_000, 1_000_000, 2_000_000, 3_000_000, 5_000_000, 7_500_000] as const

function getTierIndex(total: number): number {
  for (let i = TIERS.length - 1; i >= 0; i--) {
    if (total >= TIERS[i]) return i
  }
  return 0
}

function getTierBorderColor(tierIndex: number): string {
  return `var(--location-tier-${tierIndex})`
}

function getTierBackground(tierIndex: number): string {
  return `var(--location-bg-${tierIndex})`
}

type SortBy = 'total' | 'created'

export default function Home() {
  const { imageUrls } = useLocationImages()
  const { isReadOnly } = useAppMode()
  const locationRouter = useLocation()
  const [name, setName] = useState('')
  const [sortBy, setSortBy] = useState<SortBy>('total')
  const navigate = useNavigate()
  const locations = loadLocations()

  const sortedLocations = (() => {
    const list = [...locations]
    if (sortBy === 'total') {
      list.sort((a, b) => totalForLocation(b) - totalForLocation(a))
    } else {
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    }
    return list
  })()

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault()
    const loc = createLocation(name)
    updateLocation(loc)
    const search = locationRouter.search
    navigate(search ? `/location/${loc.id}${search}` : `/location/${loc.id}`)
    setName('')
  }

  return (
    <div>
      <h1 style={{ marginBottom: '1rem', fontSize: '1.5rem' }}>Локации</h1>
      {!isReadOnly && (
        <form
          onSubmit={handleCreate}
          style={{
            display: 'flex',
            gap: '0.5rem',
            marginBottom: '1.5rem',
            flexWrap: 'wrap',
          }}
        >
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Название локации"
            style={{
              padding: '0.5rem 0.75rem',
              borderRadius: '6px',
              border: '1px solid var(--border)',
              background: 'var(--bg-card)',
              color: 'var(--text)',
              minWidth: '200px',
            }}
          />
          <button
            type="submit"
            style={{
              padding: '0.5rem 1rem',
              borderRadius: '6px',
              border: 'none',
              background: 'var(--accent)',
              color: '#fff',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Создать локацию
          </button>
        </form>
      )}
      {locations.length === 0 ? (
        <p style={{ color: 'var(--text-muted)' }}>Пока нет локаций. Создайте первую.</p>
      ) : (
        <>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Сортировка:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortBy)}
            style={{
              padding: '0.4rem 0.75rem',
              borderRadius: '6px',
              border: '1px solid var(--border)',
              background: 'var(--bg-card)',
              color: 'var(--text)',
              fontSize: '0.9rem',
              cursor: 'pointer',
            }}
          >
            <option value="total">Итог</option>
            <option value="created">По добавлению (сначала новые)</option>
          </select>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
          {sortedLocations.map((loc) => {
            const popularIds = getTopPopularItemIds(loc)
            const profitableIds = getTopProfitableItemIds(loc)
            const total = totalForLocation(loc)
            const tierIndex = getTierIndex(total)
            const borderColor = getTierBorderColor(tierIndex)
            const cardBg = getTierBackground(tierIndex)
            const imageUrl = imageUrls[loc.id] ?? (loc as { imageUrl?: string }).imageUrl
            return (
              <Link
                key={loc.id}
                to={
                  isReadOnly && locationRouter.search
                    ? `/location/${loc.id}${locationRouter.search}`
                    : `/location/${loc.id}`
                }
                style={{
                  display: 'block',
                  background: cardBg,
                  borderRadius: '12px',
                  border: `2px solid ${borderColor}`,
                  overflow: 'hidden',
                  color: 'var(--text)',
                  textDecoration: 'none',
                }}
              >
                <div style={{ padding: '1rem', fontWeight: 700, fontSize: '1.1rem', color: 'var(--text)' }}>
                  {loc.name}
                </div>
                {imageUrl ? (
                  <img
                    src={imageUrl}
                    alt=""
                    style={{
                      width: '100%',
                      height: 140,
                      objectFit: 'cover',
                      display: 'block',
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: '100%',
                      height: 140,
                      background: 'var(--bg-card-hover)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--text-muted)',
                      fontSize: '0.9rem',
                    }}
                  >
                    Нет изображения
                  </div>
                )}
                <div style={{ padding: '1rem' }}>
                  <div style={{ marginBottom: '0.75rem' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
                      3 самых популярных
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      {popularIds.map((id) => {
                        const item = getItem(id)
                        return (
                          <div
                            key={id}
                            style={{
                              width: 40,
                              height: 40,
                              borderRadius: 8,
                              overflow: 'hidden',
                              background: 'var(--bg-card-hover)',
                              flexShrink: 0,
                            }}
                            title={item?.name}
                          >
                            {item?.iconUrl ? (
                              <img src={item.iconUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                            ) : null}
                          </div>
                        )
                      })}
                      {popularIds.length === 0 && (
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>—</span>
                      )}
                    </div>
                  </div>
                  <div style={{ marginBottom: '0.5rem' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
                      3 самых прибыльных
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      {profitableIds.map((id) => {
                        const item = getItem(id)
                        return (
                          <div
                            key={id}
                            style={{
                              width: 40,
                              height: 40,
                              borderRadius: 8,
                              overflow: 'hidden',
                              background: 'var(--bg-card-hover)',
                              flexShrink: 0,
                            }}
                            title={item?.name}
                          >
                            {item?.iconUrl ? (
                              <img src={item.iconUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                            ) : null}
                          </div>
                        )
                      })}
                      {profitableIds.length === 0 && (
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>—</span>
                      )}
                    </div>
                  </div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                    Итого: {total.toLocaleString('ru-RU')} сереб.
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
        <div
          style={{
            marginTop: '1.5rem',
            padding: '0.75rem 1rem',
            background: 'var(--bg-card)',
            borderRadius: '8px',
            border: '1px solid var(--border)',
            fontSize: '0.8rem',
            color: 'var(--text-muted)',
          }}
        >
          <span style={{ marginRight: '0.5rem' }}>Уровень по итогу:</span>
          {[
            { label: 'до 500к', tier: 0 },
            { label: '500к–1кк', tier: 1 },
            { label: '1кк–2кк', tier: 2 },
            { label: '2кк–3кк', tier: 3 },
            { label: '3кк–5кк', tier: 4 },
            { label: '5кк–7.5кк', tier: 5 },
            { label: '7.5кк+', tier: 6 },
          ].map(({ label, tier }) => (
            <span
              key={tier}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                marginRight: '1rem',
                marginTop: '0.25rem',
              }}
            >
              <span
                style={{
                  width: 14,
                  height: 14,
                  borderRadius: 4,
                  background: getTierBackground(tier),
                  border: `1px solid ${getTierBorderColor(tier)}`,
                  flexShrink: 0,
                }}
              />
              {label}
            </span>
          ))}
        </div>
        </>
      )}
    </div>
  )
}
