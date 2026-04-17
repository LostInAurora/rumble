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
      <header className="bar-glass sticky top-0 z-40 px-3 sm:px-5 py-3" style={{ background: 'rgba(6, 9, 15, 0.85)', borderBottom: '1px solid var(--border)' }}>
        <div className="flex items-center justify-between max-w-6xl mx-auto">
          <div className="flex items-center gap-6">
            <a href="https://github.com/LostInAurora/rumble" target="_blank" rel="noopener noreferrer" className="text-lg font-bold tracking-tight hover:opacity-80 transition-opacity" style={{ color: 'var(--accent-green)', fontFamily: 'var(--font-mono)', textDecoration: 'none' }}>Rumble</a>
            <nav className="hidden sm:flex items-center gap-0.5">
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
            className="hidden sm:block btn-primary text-xs !py-1.5 !px-4 !rounded-lg"
          >
            + New
          </button>
        </div>
      </header>

      <main className="p-3 sm:p-5 pb-24 sm:pb-16">
        <Outlet />
      </main>

      {/* Mobile bottom tab bar */}
      <nav className="bar-glass mobile-bottom-bar fixed bottom-0 left-0 right-0 z-40 flex items-center justify-around sm:hidden" style={{ background: 'rgba(6, 9, 15, 0.92)', borderTop: '1px solid var(--border)' }}>
        {NAV_ITEMS.map(item => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex flex-col items-center py-2 px-2 text-[10px] font-medium transition-colors ${
                isActive
                  ? 'text-[var(--accent-green)]'
                  : 'text-[var(--text-muted)]'
              }`
            }
          >
            <span className="text-base mb-0.5">{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
        <button
          onClick={() => setTxnModalOpen(true)}
          className="flex flex-col items-center py-2 px-2 text-[10px] font-semibold text-[var(--accent-green)]"
        >
          <span className="text-base mb-0.5 flex items-center justify-center w-7 h-7 rounded-full" style={{ background: 'var(--accent-green)', color: 'var(--bg-primary)' }}>+</span>
          New
        </button>
      </nav>

      <TransactionModal
        open={txnModalOpen}
        onClose={() => setTxnModalOpen(false)}
        onSave={(txn) => { addTransaction(txn); setTxnModalOpen(false) }}
      />
    </div>
  )
}
