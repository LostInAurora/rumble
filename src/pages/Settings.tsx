import { useState } from 'react'
import { useConfig } from '../hooks/useConfig'
import { db } from '../db'
import type { Currency } from '../types'

export function Settings() {
  const { config, updateConfig } = useConfig()
  const [exportStatus, setExportStatus] = useState('')
  const [importStatus, setImportStatus] = useState('')

  if (!config) return null

  async function handleExport() {
    try {
      const data = {
        version: 1,
        exportedAt: new Date().toISOString(),
        transactions: await db.transactions.toArray(),
        cashAccounts: await db.cashAccounts.toArray(),
        snapshots: await db.snapshots.toArray(),
        config: await db.config.get('default'),
      }
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `rumble-${new Date().toISOString().slice(0, 10)}.json`
      a.click()
      URL.revokeObjectURL(url)
      setExportStatus('Exported successfully')
      setTimeout(() => setExportStatus(''), 3000)
    } catch {
      setExportStatus('Export failed')
    }
  }

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const text = await file.text()
      const data = JSON.parse(text)
      if (!data.version || !data.transactions) {
        setImportStatus('Invalid file format')
        return
      }
      // Clear existing data before import
      await db.transactions.clear()
      await db.cashAccounts.clear()
      await db.snapshots.clear()

      for (const txn of data.transactions) {
        await db.transactions.put(txn)
      }
      if (data.cashAccounts) {
        for (const acc of data.cashAccounts) {
          await db.cashAccounts.put(acc)
        }
      } else {
        // No cash data in export — rebuild from transactions
        const cashMap = new Map<string, number>()
        const sorted = [...data.transactions].sort((a: { date: string }, b: { date: string }) => a.date.localeCompare(b.date))
        for (const txn of sorted) {
          const impact = txn.type === 'BUY'
            ? -(txn.price * txn.shares + (txn.fee ?? 0))
            : txn.price * txn.shares - (txn.fee ?? 0)
          cashMap.set(txn.currency, (cashMap.get(txn.currency) ?? 0) + impact)
        }
        for (const [currency, balance] of cashMap) {
          await db.cashAccounts.put({
            id: crypto.randomUUID(),
            name: currency,
            currency,
            balance,
          })
        }
      }
      if (data.snapshots) {
        for (const snap of data.snapshots) {
          await db.snapshots.put(snap)
        }
      }
      setImportStatus(`Imported ${data.transactions.length} transactions`)
      setTimeout(() => setImportStatus(''), 3000)
    } catch {
      setImportStatus('Import failed — invalid JSON')
    }
    e.target.value = ''
  }

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <section className="card-glass p-5 animate-fade-in">
        <div className="label mb-4">API Keys</div>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>Finnhub (US stocks + Crypto)</label>
            <input
              type="password"
              value={config.apiKeys.finnhub ?? ''}
              onChange={e => updateConfig({ apiKeys: { ...config.apiKeys, finnhub: e.target.value || undefined } })}
              placeholder="Enter Finnhub API key"
              className="input-field"
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>ExchangeRate-API (currency rates)</label>
            <input
              type="password"
              value={config.apiKeys.exchangeRate ?? ''}
              onChange={e => updateConfig({ apiKeys: { ...config.apiKeys, exchangeRate: e.target.value || undefined } })}
              placeholder="Enter ExchangeRate-API key"
              className="input-field"
            />
          </div>
          <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
            Finnhub also provides crypto prices (via Binance).
          </p>
        </div>
      </section>

      <section className="card-glass p-5 animate-fade-in" style={{ animationDelay: '0.05s' }}>
        <div className="label mb-4">Base Currency</div>
        <div className="toggle-group" style={{ maxWidth: '240px' }}>
          {(['USD', 'CNY', 'HKD'] as Currency[]).map(c => (
            <button
              key={c}
              onClick={() => updateConfig({ baseCurrency: c })}
              className={config.baseCurrency === c ? 'active' : ''}
            >
              {c}
            </button>
          ))}
        </div>
      </section>

      <section className="card-glass p-5 animate-fade-in" style={{ animationDelay: '0.1s' }}>
        <div className="label mb-4">Price Refresh Interval</div>
        <div className="flex items-center gap-3">
          <input
            type="number"
            min={1}
            max={60}
            value={config.priceRefreshInterval}
            onChange={e => updateConfig({ priceRefreshInterval: parseInt(e.target.value) || 5 })}
            className="input-field !w-20"
          />
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>minutes</span>
        </div>
      </section>

      <section className="card-glass p-5 animate-fade-in" style={{ animationDelay: '0.15s' }}>
        <div className="label mb-4">Data</div>
        <div className="flex gap-3">
          <button
            onClick={handleExport}
            className="px-4 py-2.5 rounded-xl text-xs font-medium transition-all duration-200 hover:scale-[1.02]"
            style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}
          >
            Export JSON
          </button>
          <label
            className="px-4 py-2.5 rounded-xl text-xs font-medium cursor-pointer transition-all duration-200 hover:scale-[1.02]"
            style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}
          >
            Import JSON
            <input type="file" accept=".json" onChange={handleImport} className="hidden" />
          </label>
        </div>
        {exportStatus && <p className="text-xs mt-3" style={{ color: 'var(--accent-green)' }}>{exportStatus}</p>}
        {importStatus && <p className="text-xs mt-3" style={{ color: 'var(--accent-green)' }}>{importStatus}</p>}
      </section>
    </div>
  )
}
