import { Link, useLocation } from 'react-router-dom'
import { useAppMode } from '../context/AppModeContext'

const nav = [
  { to: '/', label: 'Локации' },
  { to: '/items', label: 'Предметы' },
  { to: '/ratings', label: 'Рейтинги' },
]

export default function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation()
  const { isReadOnly } = useAppMode()
  const withSearch = (to: string) =>
    isReadOnly && location.search ? `${to}${location.search}` : to
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <header
        style={{
          background: 'var(--bg-card)',
          borderBottom: '1px solid var(--border)',
          padding: '0.75rem 1.5rem',
          display: 'flex',
          alignItems: 'center',
          gap: '1.5rem',
          flexWrap: 'wrap',
        }}
      >
        <Link
          to={withSearch('/')}
          style={{
            fontSize: '1.25rem',
            fontWeight: 700,
            color: 'var(--text)',
            textDecoration: 'none',
            fontFamily: 'var(--font-sans)',
          }}
        >
          🚔 Полиция Дропа
        </Link>
        {isReadOnly && (
          <span
            style={{
              padding: '0.25rem 0.5rem',
              borderRadius: 999,
              border: '1px solid var(--border)',
              background: 'var(--bg-card-hover)',
              color: 'var(--text-muted)',
              fontSize: '0.8rem',
              fontFamily: 'var(--font-mono)',
            }}
          >
            Режим просмотра
          </span>
        )}
        <nav style={{ display: 'flex', gap: '0.5rem' }}>
          {nav.map(({ to, label }) => (
            <Link
              key={to}
              to={withSearch(to)}
              style={{
                padding: '0.5rem 0.75rem',
                borderRadius: '6px',
                color: location.pathname === to || (to !== '/' && location.pathname.startsWith(to)) ? 'var(--accent)' : 'var(--text-muted)',
                textDecoration: 'none',
                fontWeight: location.pathname === to ? 600 : 400,
              }}
            >
              {label}
            </Link>
          ))}
        </nav>
      </header>
      <main style={{ flex: 1, padding: '1.5rem', maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
        {children}
      </main>
    </div>
  )
}
