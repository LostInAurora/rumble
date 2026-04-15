import { useState, useEffect, useRef } from 'react'
import type { Transaction, Market, TransactionType } from '../types'

interface Props {
  open: boolean
  onClose: () => void
  onSave: (txn: Transaction) => void
  initial?: Transaction
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

  const currency = 'USD'
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
      <div className="fixed inset-0 modal-backdrop" />
      <form
        onSubmit={handleSubmit}
        onKeyDown={handleKeyDown}
        onClick={e => e.stopPropagation()}
        className="relative w-full max-w-sm card-glass p-6 animate-fade-in"
      >
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
            {initial ? 'Edit Transaction' : 'New Transaction'}
          </h3>
          <button type="button" onClick={onClose} className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">
            ✕
          </button>
        </div>

        <div className="mb-4">
          <label className="label block mb-2">Symbol</label>
          <input
            ref={symbolRef}
            value={symbol}
            onChange={e => setSymbol(e.target.value)}
            placeholder="AAPL"
            className="input-field"
          />
        </div>

        <div className="mb-4">
          <label className="label block mb-2">Market</label>
          <div className="toggle-group">
            {(['US', 'CRYPTO'] as Market[]).map(m => (
              <button
                key={m}
                type="button"
                onClick={() => setMarket(m)}
                className={market === m ? 'active' : ''}
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-3 mb-4">
          <div className="flex-1">
            <label className="label block mb-2">Type</label>
            <div className="toggle-group">
              <button
                type="button"
                onClick={() => setType('BUY')}
                className={type === 'BUY' ? 'active-green' : ''}
              >
                BUY
              </button>
              <button
                type="button"
                onClick={() => setType('SELL')}
                className={type === 'SELL' ? 'active-red' : ''}
              >
                SELL
              </button>
            </div>
          </div>
          <div className="flex-1">
            <label className="label block mb-2">Date</label>
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              className="input-field !text-xs"
            />
          </div>
        </div>

        <div className="flex gap-3 mb-4">
          <div className="flex-1">
            <label className="label block mb-2">Shares</label>
            <input
              type="number"
              step="any"
              value={shares}
              onChange={e => setShares(e.target.value)}
              placeholder="100"
              className="input-field"
            />
          </div>
          <div className="flex-1">
            <label className="label block mb-2">Price</label>
            <input
              type="number"
              step="any"
              value={price}
              onChange={e => setPrice(e.target.value)}
              placeholder="198.50"
              className="input-field"
            />
          </div>
        </div>

        <div className="flex gap-3 mb-4">
          <div className="flex-1">
            <label className="label block mb-2">Fee</label>
            <input
              type="number"
              step="any"
              value={fee}
              onChange={e => setFee(e.target.value)}
              className="input-field"
            />
          </div>
          <div className="flex-1">
            <label className="label block mb-2">Total ({currency})</label>
            <div className="font-data text-lg font-bold py-2" style={{ color: 'var(--accent-green)' }}>
              {total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>
        </div>

        <div className="mb-5">
          <label className="label block mb-2">Note (optional)</label>
          <input
            value={note}
            onChange={e => setNote(e.target.value)}
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
