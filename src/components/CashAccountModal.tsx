import { useState, useEffect, useRef } from 'react'
import type { CashAccount } from '../types'

interface Props {
  open: boolean
  onClose: () => void
  onSave: (account: CashAccount) => void
  initial?: CashAccount
}

export function CashAccountModal({ open, onClose, onSave, initial }: Props) {
  const [name, setName] = useState(initial?.name ?? '')
  const [balance, setBalance] = useState(initial?.balance?.toString() ?? '')
  const nameRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) {
      if (!initial) {
        setName('')
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
      currency: 'USD',
      balance: parseFloat(balance),
    })
    onClose()
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={onClose}>
      <div className="fixed inset-0 modal-backdrop" />
      <form
        onSubmit={handleSubmit}
        onClick={e => e.stopPropagation()}
        className="relative w-full max-w-sm card-glass p-6 animate-fade-in"
      >
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
            {initial ? 'Edit Cash Account' : 'New Cash Account'}
          </h3>
          <button type="button" onClick={onClose} className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">✕</button>
        </div>

        <div className="mb-4">
          <label className="label block mb-2">Account Name</label>
          <input
            ref={nameRef}
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Chase, 招商银行..."
            className="input-field"
          />
        </div>

        <div className="mb-5">
          <label className="label block mb-2">Balance</label>
          <input
            type="number"
            step="any"
            value={balance}
            onChange={e => setBalance(e.target.value)}
            placeholder="10000"
            className="input-field"
          />
        </div>

        <button type="submit" className="btn-primary w-full">
          Confirm ⏎
        </button>
      </form>
    </div>
  )
}
