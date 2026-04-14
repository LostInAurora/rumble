import { useState, useMemo } from 'react'
import { useOutletContext } from 'react-router-dom'
import { useTransactions } from '../hooks/useTransactions'
import { TransactionModal } from '../components/TransactionModal'
import type { Transaction, Market } from '../types'

interface LayoutContext {
  txnModalOpen: boolean
  setTxnModalOpen: (open: boolean) => void
}

export function Transactions() {
  const { txnModalOpen, setTxnModalOpen } = useOutletContext<LayoutContext>()
  const { transactions, addTransaction, deleteTransaction, updateTransaction } = useTransactions()
  const [editingTxn, setEditingTxn] = useState<Transaction | undefined>()
  const [filterMarket, setFilterMarket] = useState<Market | 'ALL'>('ALL')

  const filtered = useMemo(() => {
    if (filterMarket === 'ALL') return transactions
    return transactions.filter(t => t.market === filterMarket)
  }, [transactions, filterMarket])

  function handleSave(txn: Transaction) {
    if (editingTxn) {
      updateTransaction(txn)
    } else {
      addTransaction(txn)
    }
    setEditingTxn(undefined)
  }

  function handleEdit(txn: Transaction) {
    setEditingTxn(txn)
    setTxnModalOpen(true)
  }

  function handleCloseModal() {
    setTxnModalOpen(false)
    setEditingTxn(undefined)
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-2">
          {(['ALL', 'US', 'CN', 'HK', 'CRYPTO'] as const).map(m => (
            <button
              key={m}
              onClick={() => setFilterMarket(m)}
              className={`px-2 py-1 text-xs rounded transition-colors ${
                filterMarket === m
                  ? 'bg-[var(--accent-green)] text-[var(--bg-primary)]'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
              }`}
            >
              {m}
            </button>
          ))}
        </div>
        <button
          onClick={() => { setEditingTxn(undefined); setTxnModalOpen(true) }}
          className="text-xs text-[var(--accent-green)] hover:underline"
        >
          + New (⌘N)
        </button>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center text-[var(--text-muted)] py-8">
          No transactions yet. Press ⌘N to add one.
        </div>
      ) : (
        <div className="space-y-1">
          {filtered.map(txn => (
            <div
              key={txn.id}
              className="flex items-center justify-between bg-[var(--bg-secondary)] px-3 py-2 rounded hover:bg-[var(--bg-tertiary)] transition-colors group"
            >
              <div className="flex items-center gap-3">
                <span className={`text-xs px-1.5 py-0.5 rounded ${
                  txn.type === 'BUY'
                    ? 'bg-[var(--accent-green)]/20 text-[var(--accent-green)]'
                    : 'bg-[var(--accent-red)]/20 text-[var(--accent-red)]'
                }`}>
                  {txn.type}
                </span>
                <span className="text-sm text-[var(--text-primary)]">{txn.symbol}</span>
                <span className="text-xs text-[var(--text-muted)]">
                  {txn.shares} @ {txn.price}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-[var(--text-muted)]">{txn.date}</span>
                <div className="opacity-0 group-hover:opacity-100 flex gap-2 transition-opacity">
                  <button
                    onClick={() => handleEdit(txn)}
                    className="text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                  >
                    edit
                  </button>
                  <button
                    onClick={() => deleteTransaction(txn.id)}
                    className="text-xs text-[var(--text-muted)] hover:text-[var(--accent-red)]"
                  >
                    del
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <TransactionModal
        open={txnModalOpen}
        onClose={handleCloseModal}
        onSave={handleSave}
        initial={editingTxn}
      />
    </div>
  )
}
