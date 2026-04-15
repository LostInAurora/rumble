import { useState, useMemo } from 'react'
import { useTransactions } from '../hooks/useTransactions'
import { TransactionModal } from '../components/TransactionModal'
import type { Transaction, Market } from '../types'

export function Transactions() {
  const { transactions, addTransaction, deleteTransaction, updateTransaction } = useTransactions()
  const [editModalOpen, setEditModalOpen] = useState(false)
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
    setEditModalOpen(true)
  }

  function handleCloseModal() {
    setEditModalOpen(false)
    setEditingTxn(undefined)
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-5">
        <div className="flex gap-1">
          {(['ALL', 'US', 'CRYPTO'] as const).map(m => (
            <button
              key={m}
              onClick={() => setFilterMarket(m)}
              className="px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-200"
              style={filterMarket === m
                ? { background: 'var(--accent-green)', color: 'var(--bg-primary)' }
                : { color: 'var(--text-muted)' }
              }
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12" style={{ color: 'var(--text-muted)' }}>
          No transactions yet. Click + New to add one.
        </div>
      ) : (
        <div className="space-y-1.5">
          {filtered.map(txn => (
            <div
              key={txn.id}
              className="flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 group hover:scale-[1.003]"
              style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}
            >
              <div className="flex items-center gap-3">
                <span
                  className="text-[10px] font-semibold px-2 py-1 rounded-md"
                  style={{
                    background: txn.type === 'BUY' ? 'var(--glow-green)' : 'var(--glow-red)',
                    color: txn.type === 'BUY' ? 'var(--accent-green)' : 'var(--accent-red)',
                  }}
                >
                  {txn.type}
                </span>
                <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{txn.symbol}</span>
                <span className="font-data text-xs" style={{ color: 'var(--text-muted)' }}>
                  {txn.shares} @ {txn.price}
                </span>
              </div>
              <div className="flex items-center gap-4">
                <span className="font-data text-xs" style={{ color: 'var(--text-muted)' }}>{txn.date}</span>
                <div className="opacity-0 group-hover:opacity-100 flex gap-3 transition-opacity duration-200">
                  <button
                    onClick={() => handleEdit(txn)}
                    className="text-xs font-medium transition-colors"
                    style={{ color: 'var(--text-muted)' }}
                    onMouseEnter={e => (e.currentTarget.style.color = 'var(--text-primary)')}
                    onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}
                  >
                    edit
                  </button>
                  <button
                    onClick={() => deleteTransaction(txn.id)}
                    className="text-xs font-medium transition-colors"
                    style={{ color: 'var(--text-muted)' }}
                    onMouseEnter={e => (e.currentTarget.style.color = 'var(--accent-red)')}
                    onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}
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
        open={editModalOpen}
        onClose={handleCloseModal}
        onSave={handleSave}
        initial={editingTxn}
      />
    </div>
  )
}
