import { useLiveQuery } from 'dexie-react-hooks'
import { db } from './db'

function App() {
  const config = useLiveQuery(() => db.config.get('default'))

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] font-mono p-8">
      <p className="text-[var(--accent-green)]">TV Portfolio Tracker</p>
      <p className="text-[var(--text-muted)] mt-2">
        DB Status: {config ? `Ready (base: ${config.baseCurrency})` : 'Loading...'}
      </p>
    </div>
  )
}

export default App
