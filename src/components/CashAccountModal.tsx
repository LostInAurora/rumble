import { useState, useEffect, useRef } from 'react'
import type { CashAccount, Currency } from '../types'

interface Props {
  open: boolean
  onClose: () => void
  onSave: (account: CashAccount) => void
  initial?: CashAccount
}

export function CashAccountModal({ open, onClose, onSave, initial }: Props) {
  const [name, setName] = useState(initial?.name ?? '')
  const [currency, setCurrency] = useState<Currency>(initial?.currency ?? 'USD')
  const [balance, setBalance] = useState(initial?.balance?.toString() ?? '')
  const nameRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) {
      if (!initial) {
        setName('')
        setCurrency('USD')
        setBalance('')
      }
      setTimeout(() => nameRef.current?.focus(), 0)
    }
  }, [open, initial])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name || !balance) return
    onSave({
      id: initial?.id ?? crypto.randomUUID(),
      name,
      currency,
      balance: parseFloat(balance),
    })
    onClose()
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={onClose}>
      <div className="fixed inset-0 bg-black/60" />
      <form
        onSubmit={handleSubmit}
        onClick={e => e.stopPropagation()}
        className="relative w-full max-w-sm bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg shadow-2xl p-5"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm text-[var(--text-primary)]">
            {initial ? 'Edit Cash Account' : 'New Cash Account'}
          </h3>
          <button type="button" onClick={onClose} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">✕</button>
        </div>

        <div className="mb-3">
          <label className="block text-[8px] uppercase text-[var(--text-muted)] mb-1">Account Name</label>
          <input
            ref={nameRef}
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Chase, 招商银行..."
            className="w-full bg-[var(--bg-primary)] border border-[var(--border)] rounded px-3 py-2 text-sm text-[var(--text-primary)] font-mono outline-none focus:border-[var(--accent-green)]"
          />
        </div>

        <div className="mb-3">
          <label className="block text-[8px] uppercase text-[var(--text-muted)] mb-1">Currency</label>
          <div className="flex rounded overflow-hidden border border-[var(--border)]">
            {(['USD', 'CNY', 'HKD'] as Currency[]).map(c => (
              <button
                key={c}
                type="button"
                onClick={() => setCurrency(c)}
                className={`flex-1 py-1.5 text-xs text-center transition-colors ${
                  currency === c
                    ? 'bg-[var(--accent-blue)] text-white'
                    : 'bg-[var(--bg-primary)] text-[var(--text-muted)]'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-[8px] uppercase text-[var(--text-muted)] mb-1">Balance</label>
          <input
            type="number"
            step="any"
            value={balance}
            onChange={e => setBalance(e.target.value)}
            placeholder="10000"
            className="w-full bg-[var(--bg-primary)] border border-[var(--border)] rounded px-3 py-2 text-sm text-[var(--text-primary)] font-mono outline-none focus:border-[var(--accent-green)]"
          />
        </div>

        <button
          type="submit"
          className="w-full bg-[var(--accent-green)] text-[var(--bg-primary)] py-2 rounded font-bold text-sm hover:brightness-110 transition-all"
        >
          Confirm ⏎
        </button>
      </form>
    </div>
  )
}
