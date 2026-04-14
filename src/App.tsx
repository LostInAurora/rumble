import { useEffect } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Layout } from './components/Layout'
import { Dashboard } from './pages/Dashboard'
import { Holdings } from './pages/Holdings'
import { Transactions } from './pages/Transactions'
import { Analytics } from './pages/Analytics'
import { Settings } from './pages/Settings'
import { db } from './db'
import { aggregateHoldings } from './services/portfolio'
import { useConfig } from './hooks/useConfig'

function SnapshotRecorder() {
  const { config } = useConfig()

  useEffect(() => {
    if (!config) return

    async function recordSnapshot() {
      const today = new Date().toISOString().slice(0, 10)
      const existing = await db.snapshots.get(today)
      if (existing) return

      const transactions = await db.transactions.toArray()
      const holdings = aggregateHoldings(transactions)
      const cashAccounts = await db.cashAccounts.toArray()

      let totalValue = 0
      const breakdown: Record<string, number> = {}

      for (const h of holdings) {
        const cached = await db.priceCache.get(h.symbol)
        const price = cached?.price ?? h.avgCost
        const value = price * h.totalShares
        totalValue += value
        breakdown[h.market] = (breakdown[h.market] ?? 0) + value
      }

      for (const acc of cashAccounts) {
        totalValue += acc.balance
        breakdown['CASH'] = (breakdown['CASH'] ?? 0) + acc.balance
      }

      await db.snapshots.put({ date: today, totalValue, breakdown })
    }

    recordSnapshot()
  }, [config])

  return null
}

function App() {
  return (
    <BrowserRouter>
      <SnapshotRecorder />
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/holdings" element={<Holdings />} />
          <Route path="/transactions" element={<Transactions />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/settings" element={<Settings />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
