import { useState } from 'react'
import { Outlet, NavLink } from 'react-router-dom'
import { TransactionModal } from './TransactionModal'
import { useTransactions } from '../hooks/useTransactions'

const NAV_ITEMS = [
  { path: '/', label: 'Dashboard', icon: '◈' },
  { path: '/holdings', label: 'Holdings', icon: '◆' },
  { path: '/transactions', label: 'Txns', icon: '⬡' },
  { path: '/analytics', label: 'Analytics', icon: '◉' },
  { path: '/settings', label: 'Settings', icon: '⚙' },
]

export function Layout() {
  const [txnModalOpen, setTxnModalOpen] = useState(false)
  const { addTransaction } = useTransactions()

  return (
    <div className="min-h-screen" style={{ fontFamily: 'var(--font-display)' }}>
      <header className="sticky top-0 z-40 px-5 py-3" style={{ background: 'rgba(6, 9, 15, 0.85)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', borderBottom: '1px solid var(--border)' }}>
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          <div className="flex items-center gap-6">
            <span className="text-lg font-bold tracking-tight" style={{ color: 'var(--accent-green)', fontFamily: 'var(--font-mono)' }}>Rumble</span>
            <nav className="flex items-center gap-0.5">
              {NAV_ITEMS.map(item => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-200 ${
                      isActive
                        ? 'text-[var(--text-primary)]'
                        : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
                    }`
                  }
                  style={({ isActive }) => isActive ? { background: 'var(--bg-tertiary)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04)' } : {}}
                >
                  <span className="mr-1 opacity-60">{item.icon}</span>
                  {item.label}
                </NavLink>
              ))}
            </nav>
          </div>
          <button
            onClick={() => setTxnModalOpen(true)}
            className="btn-primary text-xs !py-1.5 !px-4 !rounded-lg"
          >
            + New
          </button>
        </div>
      </header>

      <main className="p-5 pb-16">
        <Outlet />
      </main>

      <TransactionModal
        open={txnModalOpen}
        onClose={() => setTxnModalOpen(false)}
        onSave={(txn) => { addTransaction(txn); setTxnModalOpen(false) }}
      />
    </div>
  )
}
