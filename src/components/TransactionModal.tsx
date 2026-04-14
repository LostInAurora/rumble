import { useState, useEffect, useRef } from 'react'
import type { Transaction, Market, TransactionType, Currency } from '../types'

interface Props {
  open: boolean
  onClose: () => void
  onSave: (txn: Transaction) => void
  initial?: Transaction
}

const MARKET_CURRENCY: Record<Market, Currency> = {
  US: 'USD',
  CN: 'CNY',
  HK: 'HKD',
  CRYPTO: 'USD',
}

export function TransactionModal({ open, onClose, onSave, initial }: Props) {
  const [symbol, setSymbol] = useState(initial?.symbol ?? '')
  const [market, setMarket] = useState<Market>(initial?.market ?? 'US')
  const [type, setType] = useState<TransactionType>(initial?.type ?? 'BUY')
  const [shares, setShares] = useState(initial?.shares?.toString() ?? '')
  const [price, setPrice] = useState(initial?.price?.toString() ?? '')
  const [fee, setFee] = useState(initial?.fee?.toString() ?? '0')
  const [date, setDate] = useState(initial?.date ?? new Date().toISOString().slice(0, 10))
  const [note, setNote] = useState(initial?.note ?? '')
  const symbolRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) {
      if (!initial) {
        setSymbol('')
        setMarket('US')
        setType('BUY')
        setShares('')
        setPrice('')
        setFee('0')
        setDate(new Date().toISOString().slice(0, 10))
        setNote('')
      }
      setTimeout(() => symbolRef.current?.focus(), 0)
    }
  }, [open, initial])

  const currency = MARKET_CURRENCY[market]
  const total = (parseFloat(shares) || 0) * (parseFloat(price) || 0) + (parseFloat(fee) || 0)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!symbol || !shares || !price) return

    onSave({
      id: initial?.id ?? crypto.randomUUID(),
      symbol: symbol.toUpperCase(),
      market,
      type,
      shares: parseFloat(shares),
      price: parseFloat(price),
      fee: parseFloat(fee) || 0,
      currency,
      date,
      note: note || undefined,
    })
    onClose()
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Escape') onClose()
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={onClose}>
      <div className="fixed inset-0 bg-black/60" />
      <form
        onSubmit={handleSubmit}
        onKeyDown={handleKeyDown}
        onClick={e => e.stopPropagation()}
        className="relative w-full max-w-sm bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg shadow-2xl p-5"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm text-[var(--text-primary)]">
            {initial ? 'Edit Transaction' : 'New Transaction'}
          </h3>
          <button type="button" onClick={onClose} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">
            ✕
          </button>
        </div>

        <div className="mb-3">
          <label className="block text-[8px] uppercase text-[var(--text-muted)] mb-1">Symbol</label>
          <input
            ref={symbolRef}
            value={symbol}
            onChange={e => setSymbol(e.target.value)}
            placeholder="AAPL"
            className="w-full bg-[var(--bg-primary)] border border-[var(--border)] rounded px-3 py-2 text-sm text-[var(--text-primary)] font-mono outline-none focus:border-[var(--accent-green)]"
          />
        </div>

        <div className="mb-3">
          <label className="block text-[8px] uppercase text-[var(--text-muted)] mb-1">Market</label>
          <div className="flex rounded overflow-hidden border border-[var(--border)]">
            {(['US', 'CN', 'HK', 'CRYPTO'] as Market[]).map(m => (
              <button
                key={m}
                type="button"
                onClick={() => setMarket(m)}
                className={`flex-1 py-1.5 text-xs text-center transition-colors ${
                  market === m
                    ? 'bg-[var(--accent-blue)] text-white'
                    : 'bg-[var(--bg-primary)] text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-3 mb-3">
          <div className="flex-1">
            <label className="block text-[8px] uppercase text-[var(--text-muted)] mb-1">Type</label>
            <div className="flex rounded overflow-hidden border border-[var(--border)]">
              <button
                type="button"
                onClick={() => setType('BUY')}
                className={`flex-1 py-1.5 text-xs text-center transition-colors ${
                  type === 'BUY'
                    ? 'bg-[var(--accent-green)] text-white'
                    : 'bg-[var(--bg-primary)] text-[var(--text-muted)]'
                }`}
              >
                BUY
              </button>
              <button
                type="button"
                onClick={() => setType('SELL')}
                className={`flex-1 py-1.5 text-xs text-center transition-colors ${
                  type === 'SELL'
                    ? 'bg-[var(--accent-red)] text-white'
                    : 'bg-[var(--bg-primary)] text-[var(--text-muted)]'
                }`}
              >
                SELL
              </button>
            </div>
          </div>
          <div className="flex-1">
            <label className="block text-[8px] uppercase text-[var(--text-muted)] mb-1">Date</label>
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              className="w-full bg-[var(--bg-primary)] border border-[var(--border)] rounded px-3 py-1.5 text-sm text-[var(--text-secondary)] font-mono outline-none focus:border-[var(--accent-green)]"
            />
          </div>
        </div>

        <div className="flex gap-3 mb-3">
          <div className="flex-1">
            <label className="block text-[8px] uppercase text-[var(--text-muted)] mb-1">Shares</label>
            <input
              type="number"
              step="any"
              value={shares}
              onChange={e => setShares(e.target.value)}
              placeholder="100"
              className="w-full bg-[var(--bg-primary)] border border-[var(--border)] rounded px-3 py-2 text-sm text-[var(--text-primary)] font-mono outline-none focus:border-[var(--accent-green)]"
            />
          </div>
          <div className="flex-1">
            <label className="block text-[8px] uppercase text-[var(--text-muted)] mb-1">Price</label>
            <input
              type="number"
              step="any"
              value={price}
              onChange={e => setPrice(e.target.value)}
              placeholder="198.50"
              className="w-full bg-[var(--bg-primary)] border border-[var(--border)] rounded px-3 py-2 text-sm text-[var(--text-primary)] font-mono outline-none focus:border-[var(--accent-green)]"
            />
          </div>
        </div>

        <div className="flex gap-3 mb-3">
          <div className="flex-1">
            <label className="block text-[8px] uppercase text-[var(--text-muted)] mb-1">Fee</label>
            <input
              type="number"
              step="any"
              value={fee}
              onChange={e => setFee(e.target.value)}
              className="w-full bg-[var(--bg-primary)] border border-[var(--border)] rounded px-3 py-2 text-sm text-[var(--text-secondary)] font-mono outline-none focus:border-[var(--accent-green)]"
            />
          </div>
          <div className="flex-1">
            <label className="block text-[8px] uppercase text-[var(--text-muted)] mb-1">Total ({currency})</label>
            <div className="text-[var(--accent-green)] text-base font-bold py-2">
              {total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-[8px] uppercase text-[var(--text-muted)] mb-1">Note (optional)</label>
          <input
            value={note}
            onChange={e => setNote(e.target.value)}
            className="w-full bg-[var(--bg-primary)] border border-[var(--border)] rounded px-3 py-2 text-sm text-[var(--text-secondary)] font-mono outline-none focus:border-[var(--accent-green)]"
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
