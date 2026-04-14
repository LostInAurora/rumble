import { useState, useEffect, useRef, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'

interface Command {
  id: string
  label: string
  shortcut?: string
  action: () => void
}

interface Props {
  open: boolean
  onClose: () => void
  onNewTransaction: () => void
}

export function CommandPalette({ open, onClose, onNewTransaction }: Props) {
  const [query, setQuery] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const navigate = useNavigate()

  const commands: Command[] = useMemo(() => [
    { id: 'dashboard', label: 'Dashboard', shortcut: '⌘1', action: () => navigate('/') },
    { id: 'holdings', label: 'Holdings', shortcut: '⌘2', action: () => navigate('/holdings') },
    { id: 'transactions', label: 'Transactions', shortcut: '⌘3', action: () => navigate('/transactions') },
    { id: 'analytics', label: 'Analytics', shortcut: '⌘4', action: () => navigate('/analytics') },
    { id: 'settings', label: 'Settings', shortcut: '⌘,', action: () => navigate('/settings') },
    { id: 'new-txn', label: 'New Transaction', shortcut: '⌘N', action: onNewTransaction },
  ], [navigate, onNewTransaction])

  const filtered = useMemo(() => {
    if (!query) return commands
    const q = query.toLowerCase()
    return commands.filter(c => c.label.toLowerCase().includes(q))
  }, [query, commands])

  const [selectedIndex, setSelectedIndex] = useState(0)

  useEffect(() => {
    if (open) {
      setQuery('')
      setSelectedIndex(0)
      setTimeout(() => inputRef.current?.focus(), 0)
    }
  }, [open])

  useEffect(() => {
    setSelectedIndex(0)
  }, [filtered.length])

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex(i => Math.min(i + 1, filtered.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex(i => Math.max(i - 1, 0))
    } else if (e.key === 'Enter' && filtered[selectedIndex]) {
      filtered[selectedIndex].action()
      onClose()
    } else if (e.key === 'Escape') {
      onClose()
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh]" onClick={onClose}>
      <div className="fixed inset-0 bg-black/60" />
      <div
        className="relative w-full max-w-md bg-[var(--bg-secondary)] border border-[var(--accent-green)] rounded-lg shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-3">
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="> go to..."
            className="w-full bg-[var(--bg-primary)] border border-[var(--border)] rounded px-3 py-2 text-[var(--text-primary)] font-mono text-sm outline-none focus:border-[var(--accent-green)]"
          />
        </div>
        <div className="px-2 pb-2">
          {filtered.map((cmd, i) => (
            <div
              key={cmd.id}
              onClick={() => { cmd.action(); onClose() }}
              className={`flex items-center justify-between px-3 py-2 rounded cursor-pointer text-sm ${
                i === selectedIndex
                  ? 'bg-[var(--bg-tertiary)] text-[var(--text-primary)]'
                  : 'text-[var(--text-secondary)]'
              }`}
            >
              <span>{cmd.label}</span>
              {cmd.shortcut && (
                <span className="text-xs text-[var(--text-muted)]">{cmd.shortcut}</span>
              )}
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="px-3 py-2 text-sm text-[var(--text-muted)]">No results</div>
          )}
        </div>
      </div>
    </div>
  )
}
