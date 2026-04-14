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
      a.download = `tv-portfolio-${new Date().toISOString().slice(0, 10)}.json`
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
      for (const txn of data.transactions) {
        await db.transactions.put(txn)
      }
      if (data.cashAccounts) {
        for (const acc of data.cashAccounts) {
          await db.cashAccounts.put(acc)
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
      <section>
        <h3 className="text-xs uppercase text-[var(--text-muted)] mb-3">API Keys</h3>
        <div className="space-y-3">
          <div>
            <label className="block text-xs text-[var(--text-secondary)] mb-1">Finnhub (US + HK stocks)</label>
            <input
              type="password"
              value={config.apiKeys.finnhub ?? ''}
              onChange={e => updateConfig({ apiKeys: { ...config.apiKeys, finnhub: e.target.value || undefined } })}
              placeholder="Enter Finnhub API key"
              className="w-full bg-[var(--bg-secondary)] border border-[var(--border)] rounded px-3 py-2 text-sm text-[var(--text-primary)] font-mono outline-none focus:border-[var(--accent-green)]"
            />
          </div>
          <div>
            <label className="block text-xs text-[var(--text-secondary)] mb-1">Tushare (A stocks)</label>
            <input
              type="password"
              value={config.apiKeys.tushare ?? ''}
              onChange={e => updateConfig({ apiKeys: { ...config.apiKeys, tushare: e.target.value || undefined } })}
              placeholder="Enter Tushare token"
              className="w-full bg-[var(--bg-secondary)] border border-[var(--border)] rounded px-3 py-2 text-sm text-[var(--text-primary)] font-mono outline-none focus:border-[var(--accent-green)]"
            />
          </div>
          <div>
            <label className="block text-xs text-[var(--text-secondary)] mb-1">ExchangeRate-API (currency rates)</label>
            <input
              type="password"
              value={config.apiKeys.exchangeRate ?? ''}
              onChange={e => updateConfig({ apiKeys: { ...config.apiKeys, exchangeRate: e.target.value || undefined } })}
              placeholder="Enter ExchangeRate-API key"
              className="w-full bg-[var(--bg-secondary)] border border-[var(--border)] rounded px-3 py-2 text-sm text-[var(--text-primary)] font-mono outline-none focus:border-[var(--accent-green)]"
            />
          </div>
          <p className="text-[10px] text-[var(--text-muted)]">
            CoinGecko (crypto) is free and does not require an API key.
          </p>
        </div>
      </section>

      <section>
        <h3 className="text-xs uppercase text-[var(--text-muted)] mb-3">Base Currency</h3>
        <div className="flex gap-2">
          {(['USD', 'CNY', 'HKD'] as Currency[]).map(c => (
            <button
              key={c}
              onClick={() => updateConfig({ baseCurrency: c })}
              className={`px-4 py-2 rounded text-sm transition-colors ${
                config.baseCurrency === c
                  ? 'bg-[var(--accent-blue)] text-white'
                  : 'bg-[var(--bg-secondary)] text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </section>

      <section>
        <h3 className="text-xs uppercase text-[var(--text-muted)] mb-3">Price Refresh Interval</h3>
        <div className="flex items-center gap-2">
          <input
            type="number"
            min={1}
            max={60}
            value={config.priceRefreshInterval}
            onChange={e => updateConfig({ priceRefreshInterval: parseInt(e.target.value) || 5 })}
            className="w-20 bg-[var(--bg-secondary)] border border-[var(--border)] rounded px-3 py-2 text-sm text-[var(--text-primary)] font-mono outline-none focus:border-[var(--accent-green)]"
          />
          <span className="text-xs text-[var(--text-muted)]">minutes</span>
        </div>
      </section>

      <section>
        <h3 className="text-xs uppercase text-[var(--text-muted)] mb-3">Data</h3>
        <div className="flex gap-3">
          <button
            onClick={handleExport}
            className="px-4 py-2 bg-[var(--bg-secondary)] border border-[var(--border)] rounded text-sm text-[var(--text-secondary)] hover:border-[var(--accent-green)] hover:text-[var(--accent-green)] transition-colors"
          >
            Export JSON
          </button>
          <label className="px-4 py-2 bg-[var(--bg-secondary)] border border-[var(--border)] rounded text-sm text-[var(--text-secondary)] hover:border-[var(--accent-green)] hover:text-[var(--accent-green)] transition-colors cursor-pointer">
            Import JSON
            <input type="file" accept=".json" onChange={handleImport} className="hidden" />
          </label>
        </div>
        {exportStatus && <p className="text-xs text-[var(--accent-green)] mt-2">{exportStatus}</p>}
        {importStatus && <p className="text-xs text-[var(--accent-green)] mt-2">{importStatus}</p>}
      </section>
    </div>
  )
}
