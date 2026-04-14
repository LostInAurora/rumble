import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Layout } from './components/Layout'
import { Dashboard } from './pages/Dashboard'
import { Holdings } from './pages/Holdings'

function Placeholder({ name }: { name: string }) {
  return <div className="text-[var(--text-muted)]">{name} — coming soon</div>
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/holdings" element={<Holdings />} />
          <Route path="/transactions" element={<Placeholder name="Transactions" />} />
          <Route path="/analytics" element={<Placeholder name="Analytics" />} />
          <Route path="/settings" element={<Placeholder name="Settings" />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
