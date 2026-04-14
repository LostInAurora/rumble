import { useState, useEffect, useCallback } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { CommandPalette } from './CommandPalette'

const PAGE_NAMES: Record<string, string> = {
  '/': 'Dashboard',
  '/holdings': 'Holdings',
  '/transactions': 'Transactions',
  '/analytics': 'Analytics',
  '/settings': 'Settings',
}

export function Layout() {
  const [paletteOpen, setPaletteOpen] = useState(false)
  const [txnModalOpen, setTxnModalOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const pageName = PAGE_NAMES[location.pathname] ?? 'TV'

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    const tag = (e.target as HTMLElement)?.tagName
    if (tag === 'INPUT' || tag === 'TEXTAREA') return

    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault()
      setPaletteOpen(prev => !prev)
    }
    if ((e.metaKey || e.ctrlKey) && e.key === 'n') {
      e.preventDefault()
      setTxnModalOpen(true)
    }
    if ((e.metaKey || e.ctrlKey) && e.key === '1') { e.preventDefault(); navigate('/') }
    if ((e.metaKey || e.ctrlKey) && e.key === '2') { e.preventDefault(); navigate('/holdings') }
    if ((e.metaKey || e.ctrlKey) && e.key === '3') { e.preventDefault(); navigate('/transactions') }
    if ((e.metaKey || e.ctrlKey) && e.key === '4') { e.preventDefault(); navigate('/analytics') }
    if ((e.metaKey || e.ctrlKey) && e.key === ',') { e.preventDefault(); navigate('/settings') }
  }, [navigate])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] font-mono">
      <header className="flex items-center justify-between px-4 py-2 border-b border-[var(--border)]">
        <div className="flex items-center gap-3">
          <span className="text-[var(--accent-green)] font-bold">TV</span>
          <span className="text-xs text-[var(--text-muted)]">{pageName}</span>
        </div>
        <div className="flex items-center gap-3 text-xs text-[var(--text-muted)]">
          <button
            onClick={() => setPaletteOpen(true)}
            className="bg-[var(--bg-secondary)] px-2 py-0.5 rounded border border-[var(--border)] hover:border-[var(--text-muted)] transition-colors"
          >
            ⌘K
          </button>
        </div>
      </header>

      <main className="p-4">
        <Outlet context={{ txnModalOpen, setTxnModalOpen }} />
      </main>

      <CommandPalette
        open={paletteOpen}
        onClose={() => setPaletteOpen(false)}
        onNewTransaction={() => {
          setPaletteOpen(false)
          setTxnModalOpen(true)
        }}
      />
    </div>
  )
}
