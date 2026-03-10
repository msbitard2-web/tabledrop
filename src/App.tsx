import { Routes, Route } from 'react-router-dom'
import { AppModeProvider, useAppMode } from './context/AppModeContext'
import { PublicStateProvider, usePublicState } from './context/PublicStateContext'
import { LocationImagesProvider } from './context/LocationImagesContext'
import Layout from './components/Layout'
import PublicStateLoader from './components/PublicStateLoader'
import Home from './pages/Home'
import LocationPage from './pages/LocationPage'
import ItemsPage from './pages/ItemsPage'
import Ratings from './pages/Ratings'

function PublicStateGate({ children }: { children: React.ReactNode }) {
  const { isReadOnly } = useAppMode()
  const { isPublicStateReady } = usePublicState()
  if (isReadOnly && !isPublicStateReady) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
        Загрузка…
      </div>
    )
  }
  return <>{children}</>
}

export default function App() {
  return (
    <AppModeProvider>
      <PublicStateProvider>
        <PublicStateLoader />
        <PublicStateGate>
          <LocationImagesProvider>
            <Layout>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/location/:id" element={<LocationPage />} />
                <Route path="/location/new" element={<LocationPage />} />
                <Route path="/items" element={<ItemsPage />} />
                <Route path="/ratings" element={<Ratings />} />
              </Routes>
            </Layout>
          </LocationImagesProvider>
        </PublicStateGate>
      </PublicStateProvider>
    </AppModeProvider>
  )
}
