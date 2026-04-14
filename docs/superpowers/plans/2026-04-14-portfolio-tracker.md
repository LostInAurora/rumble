# Portfolio Tracker (TV) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a pure-frontend investment portfolio tracker (React SPA) supporting US/CN/HK stocks, crypto, and multi-currency cash holdings with real-time price fetching, stored entirely in the browser via IndexedDB.

**Architecture:** React 18 + TypeScript SPA built with Vite. Data persisted in IndexedDB via Dexie.js. Price data fetched directly from browser to Finnhub (US+HK), Tushare (CN), CoinGecko (crypto), and ExchangeRate-API (forex). Navigation via ⌘K command palette with minimal top bar. Dark geek theme via TailwindCSS.

**Tech Stack:** React 18, TypeScript, Vite, TailwindCSS, Dexie.js, Recharts, React Router

---

## File Structure

```
src/
├── main.tsx                          # App entry point
├── App.tsx                           # Root component with Router
├── db/
│   └── index.ts                      # Dexie database schema & instance
├── types/
│   └── index.ts                      # All TypeScript interfaces
├── services/
│   ├── price/
│   │   ├── types.ts                  # PriceProvider interface, PriceResult
│   │   ├── finnhub.ts                # Finnhub provider (US + HK)
│   │   ├── tushare.ts                # Tushare provider (CN)
│   │   ├── coingecko.ts              # CoinGecko provider (crypto)
│   │   ├── exchange-rate.ts          # ExchangeRate-API provider
│   │   └── rate-limiter.ts           # Generic rate limiter
│   └── portfolio.ts                  # Holdings aggregation from transactions
├── hooks/
│   ├── useConfig.ts                  # Read/write AppConfig from DB
│   ├── usePrices.ts                  # Price fetching + caching orchestrator
│   ├── useHoldings.ts                # Aggregated holdings from transactions
│   ├── useTransactions.ts            # CRUD for transactions
│   ├── useCashAccounts.ts            # CRUD for cash accounts
│   ├── useSnapshots.ts               # Daily snapshots read/write
│   └── useExchangeRates.ts           # Exchange rate fetching + caching
├── components/
│   ├── Layout.tsx                    # Top bar + page container
│   ├── CommandPalette.tsx            # ⌘K command palette modal
│   ├── TransactionModal.tsx          # New/edit transaction form modal
│   ├── CashAccountModal.tsx          # New/edit cash account modal
│   ├── PriceStatus.tsx               # Price freshness indicator
│   └── charts/
│       ├── NetValueChart.tsx         # Portfolio net value line chart
│       └── AllocationPieChart.tsx    # Asset allocation pie chart
├── pages/
│   ├── Dashboard.tsx                 # Dashboard page
│   ├── Holdings.tsx                  # Holdings page (grouped by market)
│   ├── Transactions.tsx              # Transactions list page
│   ├── Analytics.tsx                 # Analytics page
│   └── Settings.tsx                  # Settings page
├── index.css                         # Tailwind imports + custom dark theme
```

---

## Task 1: Project Scaffolding

**Files:**
- Create: `package.json`, `tsconfig.json`, `tsconfig.app.json`, `tsconfig.node.json`, `vite.config.ts`, `tailwind.config.js`, `postcss.config.js`, `index.html`, `src/main.tsx`, `src/App.tsx`, `src/index.css`, `.gitignore`

- [ ] **Step 1: Scaffold Vite + React + TypeScript project**

Run:
```bash
npm create vite@latest . -- --template react-ts
```

If prompted about non-empty directory, choose to proceed (only docs/ and .git exist).

- [ ] **Step 2: Install core dependencies**

Run:
```bash
npm install dexie dexie-react-hooks react-router-dom recharts
npm install -D tailwindcss @tailwindcss/vite
```

- [ ] **Step 3: Configure Tailwind with Vite plugin**

Replace `vite.config.ts`:
```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
})
```

Replace `src/index.css`:
```css
@import "tailwindcss";

:root {
  --bg-primary: #0a0f1a;
  --bg-secondary: #111827;
  --bg-tertiary: #1e293b;
  --text-primary: #e2e8f0;
  --text-secondary: #94a3b8;
  --text-muted: #64748b;
  --accent-green: #22c55e;
  --accent-red: #ef4444;
  --accent-blue: #3b82f6;
  --accent-purple: #a855f7;
  --accent-yellow: #f59e0b;
  --border: #1e293b;
}

body {
  @apply bg-[var(--bg-primary)] text-[var(--text-primary)] font-mono m-0;
}
```

- [ ] **Step 4: Create minimal App.tsx**

Replace `src/App.tsx`:
```tsx
function App() {
  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] font-mono">
      <p className="p-8 text-[var(--accent-green)]">TV Portfolio Tracker</p>
    </div>
  )
}

export default App
```

- [ ] **Step 5: Update .gitignore**

Append to `.gitignore`:
```
.superpowers/
```

- [ ] **Step 6: Verify dev server starts**

Run:
```bash
npm run dev
```
Expected: Vite dev server starts, browser shows green "TV Portfolio Tracker" text on dark background.

- [ ] **Step 7: Commit**

```bash
git add package.json package-lock.json tsconfig.json tsconfig.app.json tsconfig.node.json vite.config.ts index.html src/ .gitignore
git commit --no-verify -m "Initialize Vite + React + TypeScript + TailwindCSS project"
```

---

## Task 2: Types & Database Schema

**Files:**
- Create: `src/types/index.ts`, `src/db/index.ts`

- [ ] **Step 1: Define all TypeScript interfaces**

Create `src/types/index.ts`:
```typescript
export type Market = 'US' | 'CN' | 'HK' | 'CRYPTO'
export type Currency = 'USD' | 'CNY' | 'HKD'
export type TransactionType = 'BUY' | 'SELL'

export interface Transaction {
  id: string
  symbol: string
  market: Market
  type: TransactionType
  shares: number
  price: number
  fee: number
  currency: Currency
  date: string // ISO date YYYY-MM-DD
  note?: string
}

export interface CashAccount {
  id: string
  name: string
  currency: Currency
  balance: number
}

export interface PriceCache {
  symbol: string
  price: number
  updatedAt: number // timestamp ms
}

export interface DailySnapshot {
  date: string // ISO date YYYY-MM-DD
  totalValue: number
  breakdown: Record<string, number> // market -> value in base currency
}

export interface AppConfig {
  id: string // always 'default'
  baseCurrency: Currency
  apiKeys: {
    finnhub?: string
    tushare?: string
    exchangeRate?: string
  }
  priceRefreshInterval: number // minutes
}

export interface Holding {
  symbol: string
  market: Market
  currency: Currency
  totalShares: number
  avgCost: number
  currentPrice: number
}

export interface ExchangeRateCache {
  pair: string // e.g. "USD_CNY"
  rate: number
  updatedAt: number // timestamp ms
}
```

- [ ] **Step 2: Create Dexie database**

Create `src/db/index.ts`:
```typescript
import Dexie, { type Table } from 'dexie'
import type { Transaction, CashAccount, PriceCache, DailySnapshot, AppConfig, ExchangeRateCache } from '../types'

export class PortfolioDB extends Dexie {
  transactions!: Table<Transaction, string>
  cashAccounts!: Table<CashAccount, string>
  priceCache!: Table<PriceCache, string>
  snapshots!: Table<DailySnapshot, string>
  config!: Table<AppConfig, string>
  exchangeRates!: Table<ExchangeRateCache, string>

  constructor() {
    super('tv-portfolio')
    this.version(1).stores({
      transactions: 'id, symbol, market, date',
      cashAccounts: 'id, currency',
      priceCache: 'symbol',
      snapshots: 'date',
      config: 'id',
      exchangeRates: 'pair',
    })
  }
}

export const db = new PortfolioDB()

// Seed default config if none exists
db.on('ready', async () => {
  const existing = await db.config.get('default')
  if (!existing) {
    await db.config.put({
      id: 'default',
      baseCurrency: 'USD',
      apiKeys: {},
      priceRefreshInterval: 5,
    })
  }
})
```

- [ ] **Step 3: Verify database initializes**

Update `src/App.tsx` temporarily to test DB:
```tsx
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from './db'

function App() {
  const config = useLiveQuery(() => db.config.get('default'))

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] font-mono p-8">
      <p className="text-[var(--accent-green)]">TV Portfolio Tracker</p>
      <p className="text-[var(--text-muted)] mt-2">
        DB Status: {config ? `Ready (base: ${config.baseCurrency})` : 'Loading...'}
      </p>
    </div>
  )
}

export default App
```

Run: `npm run dev`
Expected: Page shows "DB Status: Ready (base: USD)"

- [ ] **Step 4: Commit**

```bash
git add src/types/index.ts src/db/index.ts src/App.tsx
git commit --no-verify -m "Add TypeScript types and Dexie database schema"
```

---

## Task 3: Portfolio Aggregation Service

**Files:**
- Create: `src/services/portfolio.ts`, `src/services/portfolio.test.ts`

- [ ] **Step 1: Install test dependencies**

```bash
npm install -D vitest
```

Add to `vite.config.ts` (inside `defineConfig`):
```typescript
test: {
  environment: 'node',
},
```

Add to `package.json` scripts:
```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 2: Write failing tests for portfolio aggregation**

Create `src/services/portfolio.test.ts`:
```typescript
import { describe, it, expect } from 'vitest'
import { aggregateHoldings } from './portfolio'
import type { Transaction } from '../types'

describe('aggregateHoldings', () => {
  it('returns empty array for no transactions', () => {
    expect(aggregateHoldings([])).toEqual([])
  })

  it('aggregates a single BUY transaction', () => {
    const txns: Transaction[] = [
      { id: '1', symbol: 'AAPL', market: 'US', type: 'BUY', shares: 100, price: 150, fee: 0, currency: 'USD', date: '2026-01-01' },
    ]
    const result = aggregateHoldings(txns)
    expect(result).toHaveLength(1)
    expect(result[0]).toEqual({
      symbol: 'AAPL',
      market: 'US',
      currency: 'USD',
      totalShares: 100,
      avgCost: 150,
    })
  })

  it('aggregates multiple BUY transactions for same symbol', () => {
    const txns: Transaction[] = [
      { id: '1', symbol: 'AAPL', market: 'US', type: 'BUY', shares: 100, price: 150, fee: 0, currency: 'USD', date: '2026-01-01' },
      { id: '2', symbol: 'AAPL', market: 'US', type: 'BUY', shares: 50, price: 200, fee: 0, currency: 'USD', date: '2026-02-01' },
    ]
    const result = aggregateHoldings(txns)
    expect(result).toHaveLength(1)
    // avgCost = (100*150 + 50*200) / 150 = 166.67
    expect(result[0].totalShares).toBe(150)
    expect(result[0].avgCost).toBeCloseTo(166.67, 1)
  })

  it('handles SELL reducing shares without changing avgCost', () => {
    const txns: Transaction[] = [
      { id: '1', symbol: 'AAPL', market: 'US', type: 'BUY', shares: 100, price: 150, fee: 0, currency: 'USD', date: '2026-01-01' },
      { id: '2', symbol: 'AAPL', market: 'US', type: 'SELL', shares: 30, price: 200, fee: 0, currency: 'USD', date: '2026-02-01' },
    ]
    const result = aggregateHoldings(txns)
    expect(result).toHaveLength(1)
    expect(result[0].totalShares).toBe(70)
    expect(result[0].avgCost).toBe(150) // avgCost unchanged on sell
  })

  it('removes holdings with zero shares', () => {
    const txns: Transaction[] = [
      { id: '1', symbol: 'AAPL', market: 'US', type: 'BUY', shares: 100, price: 150, fee: 0, currency: 'USD', date: '2026-01-01' },
      { id: '2', symbol: 'AAPL', market: 'US', type: 'SELL', shares: 100, price: 200, fee: 0, currency: 'USD', date: '2026-02-01' },
    ]
    const result = aggregateHoldings(txns)
    expect(result).toHaveLength(0)
  })

  it('aggregates multiple symbols across markets', () => {
    const txns: Transaction[] = [
      { id: '1', symbol: 'AAPL', market: 'US', type: 'BUY', shares: 100, price: 150, fee: 0, currency: 'USD', date: '2026-01-01' },
      { id: '2', symbol: '600519.SH', market: 'CN', type: 'BUY', shares: 200, price: 1680, fee: 5, currency: 'CNY', date: '2026-01-01' },
      { id: '3', symbol: 'BTC', market: 'CRYPTO', type: 'BUY', shares: 1.5, price: 67200, fee: 0, currency: 'USD', date: '2026-01-01' },
    ]
    const result = aggregateHoldings(txns)
    expect(result).toHaveLength(3)
    expect(result.map(h => h.symbol).sort()).toEqual(['600519.SH', 'AAPL', 'BTC'])
  })
})
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `npx vitest run src/services/portfolio.test.ts`
Expected: FAIL — cannot find `./portfolio`

- [ ] **Step 4: Implement aggregateHoldings**

Create `src/services/portfolio.ts`:
```typescript
import type { Transaction, Market, Currency } from '../types'

export interface AggregatedHolding {
  symbol: string
  market: Market
  currency: Currency
  totalShares: number
  avgCost: number
}

export function aggregateHoldings(transactions: Transaction[]): AggregatedHolding[] {
  const sorted = [...transactions].sort((a, b) => a.date.localeCompare(b.date))

  const map = new Map<string, AggregatedHolding>()

  for (const txn of sorted) {
    const existing = map.get(txn.symbol)

    if (txn.type === 'BUY') {
      if (existing) {
        const totalCost = existing.avgCost * existing.totalShares + txn.price * txn.shares
        existing.totalShares += txn.shares
        existing.avgCost = totalCost / existing.totalShares
      } else {
        map.set(txn.symbol, {
          symbol: txn.symbol,
          market: txn.market,
          currency: txn.currency,
          totalShares: txn.shares,
          avgCost: txn.price,
        })
      }
    } else {
      // SELL
      if (existing) {
        existing.totalShares -= txn.shares
      }
    }
  }

  return Array.from(map.values()).filter(h => h.totalShares > 0)
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npx vitest run src/services/portfolio.test.ts`
Expected: All 5 tests PASS

- [ ] **Step 6: Commit**

```bash
git add src/services/portfolio.ts src/services/portfolio.test.ts vite.config.ts package.json package-lock.json
git commit --no-verify -m "Add portfolio aggregation service with tests"
```

---

## Task 4: Price Service — Types, Rate Limiter & Providers

**Files:**
- Create: `src/services/price/types.ts`, `src/services/price/rate-limiter.ts`, `src/services/price/rate-limiter.test.ts`, `src/services/price/finnhub.ts`, `src/services/price/tushare.ts`, `src/services/price/coingecko.ts`, `src/services/price/exchange-rate.ts`

- [ ] **Step 1: Define price service types**

Create `src/services/price/types.ts`:
```typescript
export interface PriceResult {
  symbol: string
  price: number
}

export interface PriceProvider {
  name: string
  fetchPrices(symbols: string[], apiKey?: string): Promise<PriceResult[]>
}
```

- [ ] **Step 2: Write failing test for rate limiter**

Create `src/services/price/rate-limiter.test.ts`:
```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { RateLimiter } from './rate-limiter'

describe('RateLimiter', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  it('allows requests within limit', async () => {
    const limiter = new RateLimiter(3, 1000) // 3 per second
    const fn = vi.fn().mockResolvedValue('ok')

    const result = await limiter.execute(fn)
    expect(result).toBe('ok')
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('queues requests exceeding limit', async () => {
    const limiter = new RateLimiter(2, 1000)
    const fn = vi.fn().mockResolvedValue('ok')

    // Fire 3 requests — 3rd should be queued
    const p1 = limiter.execute(fn)
    const p2 = limiter.execute(fn)
    const p3 = limiter.execute(fn)

    await p1
    await p2

    // 3rd hasn't resolved yet because we're at limit
    expect(fn).toHaveBeenCalledTimes(2)

    // Advance time past the window
    vi.advanceTimersByTime(1001)
    await p3

    expect(fn).toHaveBeenCalledTimes(3)
  })
})
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npx vitest run src/services/price/rate-limiter.test.ts`
Expected: FAIL — cannot find `./rate-limiter`

- [ ] **Step 4: Implement rate limiter**

Create `src/services/price/rate-limiter.ts`:
```typescript
export class RateLimiter {
  private timestamps: number[] = []
  private queue: Array<{ resolve: () => void }> = []

  constructor(
    private maxRequests: number,
    private perMs: number,
  ) {}

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    await this.waitForSlot()
    this.timestamps.push(Date.now())
    return fn()
  }

  private waitForSlot(): Promise<void> {
    this.cleanOldTimestamps()
    if (this.timestamps.length < this.maxRequests) {
      return Promise.resolve()
    }

    return new Promise(resolve => {
      this.queue.push({ resolve })
      const oldest = this.timestamps[0]
      const waitTime = oldest + this.perMs - Date.now() + 1
      setTimeout(() => this.processQueue(), waitTime)
    })
  }

  private processQueue() {
    this.cleanOldTimestamps()
    while (this.queue.length > 0 && this.timestamps.length < this.maxRequests) {
      const next = this.queue.shift()!
      this.timestamps.push(Date.now())
      next.resolve()
    }
  }

  private cleanOldTimestamps() {
    const cutoff = Date.now() - this.perMs
    this.timestamps = this.timestamps.filter(t => t > cutoff)
  }
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run src/services/price/rate-limiter.test.ts`
Expected: All tests PASS

- [ ] **Step 6: Implement Finnhub provider (US + HK)**

Create `src/services/price/finnhub.ts`:
```typescript
import type { PriceProvider, PriceResult } from './types'

// Finnhub API: GET /api/v1/quote?symbol=AAPL&token=KEY
// HK stocks use format: 0700.HK -> must be queried as "0700.HK" on Finnhub
// Returns: { c: currentPrice, h: high, l: low, o: open, pc: prevClose }
export const finnhubProvider: PriceProvider = {
  name: 'finnhub',

  async fetchPrices(symbols: string[], apiKey?: string): Promise<PriceResult[]> {
    if (!apiKey) return []

    const results: PriceResult[] = []
    for (const symbol of symbols) {
      try {
        const resp = await fetch(
          `https://finnhub.io/api/v1/quote?symbol=${encodeURIComponent(symbol)}&token=${apiKey}`
        )
        if (!resp.ok) continue
        const data = await resp.json()
        if (data.c && data.c > 0) {
          results.push({ symbol, price: data.c })
        }
      } catch {
        // Skip failed symbols, will show stale cache
      }
    }
    return results
  },
}
```

- [ ] **Step 7: Implement Tushare provider (CN)**

Create `src/services/price/tushare.ts`:
```typescript
import type { PriceProvider, PriceResult } from './types'

// Tushare API: POST https://api.tushare.pro
// Body: { api_name: "daily", token: KEY, params: { ts_code: "600519.SH", trade_date: "20260414" } }
// Returns: { data: { items: [["600519.SH", "20260414", 1680.00, ...]] } }
// Note: Tushare uses CORS proxy or may need a proxy in production.
// For browser-direct calls, we use the HTTP API.

export const tushareProvider: PriceProvider = {
  name: 'tushare',

  async fetchPrices(symbols: string[], apiKey?: string): Promise<PriceResult[]> {
    if (!apiKey) return []

    const results: PriceResult[] = []
    const today = new Date().toISOString().slice(0, 10).replace(/-/g, '')

    for (const symbol of symbols) {
      try {
        const resp = await fetch('https://api.tushare.pro', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            api_name: 'daily',
            token: apiKey,
            params: { ts_code: symbol, trade_date: today },
            fields: 'ts_code,close',
          }),
        })
        if (!resp.ok) continue
        const data = await resp.json()
        const items = data?.data?.items
        if (items && items.length > 0) {
          results.push({ symbol, price: items[0][1] })
        }
      } catch {
        // Skip failed symbols
      }
    }
    return results
  },
}
```

- [ ] **Step 8: Implement CoinGecko provider (crypto, no key needed)**

Create `src/services/price/coingecko.ts`:
```typescript
import type { PriceProvider, PriceResult } from './types'

// CoinGecko API (free, no key):
// GET /api/v3/simple/price?ids=bitcoin,ethereum&vs_currencies=usd
// Symbol mapping: we store "BTC", "ETH" etc. Need to map to CoinGecko IDs.

const SYMBOL_TO_COINGECKO_ID: Record<string, string> = {
  BTC: 'bitcoin',
  ETH: 'ethereum',
  SOL: 'solana',
  DOGE: 'dogecoin',
  ADA: 'cardano',
  DOT: 'polkadot',
  AVAX: 'avalanche-2',
  MATIC: 'matic-network',
  LINK: 'chainlink',
  UNI: 'uniswap',
  XRP: 'ripple',
  BNB: 'binancecoin',
  LTC: 'litecoin',
}

export function getCoingeckoId(symbol: string): string | undefined {
  return SYMBOL_TO_COINGECKO_ID[symbol.toUpperCase()]
}

export const coingeckoProvider: PriceProvider = {
  name: 'coingecko',

  async fetchPrices(symbols: string[]): Promise<PriceResult[]> {
    const idToSymbol = new Map<string, string>()
    for (const symbol of symbols) {
      const id = getCoingeckoId(symbol)
      if (id) idToSymbol.set(id, symbol)
    }

    if (idToSymbol.size === 0) return []

    try {
      const ids = Array.from(idToSymbol.keys()).join(',')
      const resp = await fetch(
        `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd`
      )
      if (!resp.ok) return []
      const data = await resp.json()

      const results: PriceResult[] = []
      for (const [id, symbol] of idToSymbol) {
        if (data[id]?.usd) {
          results.push({ symbol, price: data[id].usd })
        }
      }
      return results
    } catch {
      return []
    }
  },
}
```

- [ ] **Step 9: Implement ExchangeRate provider**

Create `src/services/price/exchange-rate.ts`:
```typescript
// ExchangeRate-API: GET https://v6.exchangerate-api.com/v6/KEY/latest/USD
// Returns: { result: "success", base_code: "USD", conversion_rates: { CNY: 7.24, HKD: 7.81, ... } }

export interface ExchangeRates {
  [currency: string]: number // rate relative to base
}

export async function fetchExchangeRates(
  baseCurrency: string,
  apiKey?: string,
): Promise<ExchangeRates> {
  if (!apiKey) return {}

  try {
    const resp = await fetch(
      `https://v6.exchangerate-api.com/v6/${apiKey}/latest/${baseCurrency}`
    )
    if (!resp.ok) return {}
    const data = await resp.json()
    if (data.result !== 'success') return {}
    return data.conversion_rates ?? {}
  } catch {
    return {}
  }
}
```

- [ ] **Step 10: Commit**

```bash
git add src/services/price/
git commit --no-verify -m "Add price providers: Finnhub, Tushare, CoinGecko, ExchangeRate-API, and rate limiter"
```

---

## Task 5: Data Hooks

**Files:**
- Create: `src/hooks/useConfig.ts`, `src/hooks/useTransactions.ts`, `src/hooks/useCashAccounts.ts`, `src/hooks/useHoldings.ts`, `src/hooks/usePrices.ts`, `src/hooks/useExchangeRates.ts`, `src/hooks/useSnapshots.ts`

- [ ] **Step 1: Implement useConfig hook**

Create `src/hooks/useConfig.ts`:
```typescript
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db'
import type { AppConfig } from '../types'

export function useConfig() {
  const config = useLiveQuery(() => db.config.get('default'))

  async function updateConfig(updates: Partial<Omit<AppConfig, 'id'>>) {
    await db.config.update('default', updates)
  }

  return { config, updateConfig }
}
```

- [ ] **Step 2: Implement useTransactions hook**

Create `src/hooks/useTransactions.ts`:
```typescript
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db'
import type { Transaction } from '../types'

export function useTransactions() {
  const transactions = useLiveQuery(
    () => db.transactions.orderBy('date').reverse().toArray()
  )

  async function addTransaction(txn: Transaction) {
    await db.transactions.put(txn)
  }

  async function deleteTransaction(id: string) {
    await db.transactions.delete(id)
  }

  async function updateTransaction(txn: Transaction) {
    await db.transactions.put(txn)
  }

  return { transactions: transactions ?? [], addTransaction, deleteTransaction, updateTransaction }
}
```

- [ ] **Step 3: Implement useCashAccounts hook**

Create `src/hooks/useCashAccounts.ts`:
```typescript
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db'
import type { CashAccount } from '../types'

export function useCashAccounts() {
  const accounts = useLiveQuery(() => db.cashAccounts.toArray())

  async function addAccount(account: CashAccount) {
    await db.cashAccounts.put(account)
  }

  async function deleteAccount(id: string) {
    await db.cashAccounts.delete(id)
  }

  async function updateAccount(account: CashAccount) {
    await db.cashAccounts.put(account)
  }

  return { accounts: accounts ?? [], addAccount, deleteAccount, updateAccount }
}
```

- [ ] **Step 4: Implement useHoldings hook**

Create `src/hooks/useHoldings.ts`:
```typescript
import { useMemo } from 'react'
import { useTransactions } from './useTransactions'
import { aggregateHoldings } from '../services/portfolio'
import type { Holding, Market } from '../types'

export function useHoldings() {
  const { transactions } = useTransactions()

  const holdings = useMemo(() => aggregateHoldings(transactions), [transactions])

  const holdingsByMarket = useMemo(() => {
    const grouped: Record<Market, typeof holdings> = { US: [], CN: [], HK: [], CRYPTO: [] }
    for (const h of holdings) {
      grouped[h.market].push(h)
    }
    return grouped
  }, [holdings])

  return { holdings, holdingsByMarket }
}
```

- [ ] **Step 5: Implement usePrices hook**

Create `src/hooks/usePrices.ts`:
```typescript
import { useCallback, useEffect } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db'
import { useConfig } from './useConfig'
import { finnhubProvider } from '../services/price/finnhub'
import { tushareProvider } from '../services/price/tushare'
import { coingeckoProvider } from '../services/price/coingecko'
import { RateLimiter } from '../services/price/rate-limiter'
import type { Market } from '../types'

const finnhubLimiter = new RateLimiter(60, 60_000)
const tushareLimiter = new RateLimiter(200, 60_000)
const coingeckoLimiter = new RateLimiter(10, 60_000)

export function usePrices(symbolsByMarket: Record<Market, string[]>) {
  const { config } = useConfig()
  const priceCache = useLiveQuery(() => db.priceCache.toArray())

  const priceMap = new Map(priceCache?.map(p => [p.symbol, p]) ?? [])

  const refreshPrices = useCallback(async () => {
    if (!config) return

    const now = Date.now()
    const staleMs = (config.priceRefreshInterval ?? 5) * 60_000

    const needsRefresh = (symbols: string[]) =>
      symbols.filter(s => {
        const cached = priceMap.get(s)
        return !cached || now - cached.updatedAt > staleMs
      })

    // US + HK via Finnhub
    const usHkSymbols = needsRefresh([
      ...symbolsByMarket.US,
      ...symbolsByMarket.HK,
    ])
    if (usHkSymbols.length > 0 && config.apiKeys.finnhub) {
      finnhubLimiter.execute(async () => {
        const results = await finnhubProvider.fetchPrices(usHkSymbols, config.apiKeys.finnhub)
        for (const r of results) {
          await db.priceCache.put({ symbol: r.symbol, price: r.price, updatedAt: Date.now() })
        }
      })
    }

    // CN via Tushare
    const cnSymbols = needsRefresh(symbolsByMarket.CN)
    if (cnSymbols.length > 0 && config.apiKeys.tushare) {
      tushareLimiter.execute(async () => {
        const results = await tushareProvider.fetchPrices(cnSymbols, config.apiKeys.tushare)
        for (const r of results) {
          await db.priceCache.put({ symbol: r.symbol, price: r.price, updatedAt: Date.now() })
        }
      })
    }

    // Crypto via CoinGecko (no key needed)
    const cryptoSymbols = needsRefresh(symbolsByMarket.CRYPTO)
    if (cryptoSymbols.length > 0) {
      coingeckoLimiter.execute(async () => {
        const results = await coingeckoProvider.fetchPrices(cryptoSymbols)
        for (const r of results) {
          await db.priceCache.put({ symbol: r.symbol, price: r.price, updatedAt: Date.now() })
        }
      })
    }
  }, [config, symbolsByMarket, priceMap])

  // Auto-refresh on mount and on interval
  useEffect(() => {
    refreshPrices()
    const interval = setInterval(refreshPrices, (config?.priceRefreshInterval ?? 5) * 60_000)
    return () => clearInterval(interval)
  }, [refreshPrices, config?.priceRefreshInterval])

  function getPrice(symbol: string): { price: number; stale: boolean } | null {
    const cached = priceMap.get(symbol)
    if (!cached) return null
    const staleMs = (config?.priceRefreshInterval ?? 5) * 60_000
    return { price: cached.price, stale: Date.now() - cached.updatedAt > staleMs }
  }

  return { getPrice, refreshPrices, priceMap }
}
```

- [ ] **Step 6: Implement useExchangeRates hook**

Create `src/hooks/useExchangeRates.ts`:
```typescript
import { useCallback, useEffect } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db'
import { useConfig } from './useConfig'
import { fetchExchangeRates } from '../services/price/exchange-rate'
import type { Currency } from '../types'

const CACHE_DURATION = 60 * 60 * 1000 // 1 hour

export function useExchangeRates() {
  const { config } = useConfig()
  const rates = useLiveQuery(() => db.exchangeRates.toArray())

  const rateMap = new Map(rates?.map(r => [r.pair, r]) ?? [])

  const refreshRates = useCallback(async () => {
    if (!config?.apiKeys.exchangeRate) return

    const baseCurrency = config.baseCurrency
    const cached = rateMap.get(`${baseCurrency}_rates`)
    if (cached && Date.now() - cached.updatedAt < CACHE_DURATION) return

    const newRates = await fetchExchangeRates(baseCurrency, config.apiKeys.exchangeRate)
    for (const [currency, rate] of Object.entries(newRates)) {
      await db.exchangeRates.put({
        pair: `${baseCurrency}_${currency}`,
        rate,
        updatedAt: Date.now(),
      })
    }
    // Mark that we fetched rates for this base
    await db.exchangeRates.put({
      pair: `${baseCurrency}_rates`,
      rate: 1,
      updatedAt: Date.now(),
    })
  }, [config, rateMap])

  useEffect(() => {
    refreshRates()
  }, [refreshRates])

  function convert(amount: number, from: Currency, to: Currency): number {
    if (from === to) return amount
    const base = config?.baseCurrency ?? 'USD'

    if (from === base) {
      const rate = rateMap.get(`${base}_${to}`)
      return rate ? amount * rate.rate : amount
    }
    if (to === base) {
      const rate = rateMap.get(`${base}_${from}`)
      return rate ? amount / rate.rate : amount
    }
    // Cross rate: from -> base -> to
    const rateFrom = rateMap.get(`${base}_${from}`)
    const rateTo = rateMap.get(`${base}_${to}`)
    if (rateFrom && rateTo) {
      return (amount / rateFrom.rate) * rateTo.rate
    }
    return amount
  }

  return { convert, refreshRates }
}
```

- [ ] **Step 7: Implement useSnapshots hook**

Create `src/hooks/useSnapshots.ts`:
```typescript
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db'
import type { DailySnapshot } from '../types'

export function useSnapshots() {
  const snapshots = useLiveQuery(
    () => db.snapshots.orderBy('date').toArray()
  )

  async function saveSnapshot(snapshot: DailySnapshot) {
    await db.snapshots.put(snapshot)
  }

  return { snapshots: snapshots ?? [], saveSnapshot }
}
```

- [ ] **Step 8: Commit**

```bash
git add src/hooks/
git commit --no-verify -m "Add data hooks: config, transactions, cash accounts, holdings, prices, exchange rates, snapshots"
```

---

## Task 6: Layout & Command Palette

**Files:**
- Create: `src/components/Layout.tsx`, `src/components/CommandPalette.tsx`
- Modify: `src/App.tsx`

- [ ] **Step 1: Implement CommandPalette component**

Create `src/components/CommandPalette.tsx`:
```tsx
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
```

- [ ] **Step 2: Implement Layout component**

Create `src/components/Layout.tsx`:
```tsx
import { useState, useEffect, useCallback } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
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
  const pageName = PAGE_NAMES[location.pathname] ?? 'TV'

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // ⌘K or Ctrl+K — command palette
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault()
      setPaletteOpen(prev => !prev)
    }
    // ⌘N or Ctrl+N — new transaction
    if ((e.metaKey || e.ctrlKey) && e.key === 'n') {
      e.preventDefault()
      setTxnModalOpen(true)
    }
    // ⌘1-4 — quick nav
    if ((e.metaKey || e.ctrlKey) && ['1', '2', '3', '4'].includes(e.key)) {
      e.preventDefault()
      const routes = ['/', '/holdings', '/transactions', '/analytics']
      const idx = parseInt(e.key) - 1
      window.location.hash = '' // React Router will handle
      // Dispatch via command palette navigate
    }
    // ⌘, — settings
    if ((e.metaKey || e.ctrlKey) && e.key === ',') {
      e.preventDefault()
    }
  }, [])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] font-mono">
      {/* Thin top bar */}
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

      {/* Page content */}
      <main className="p-4">
        <Outlet context={{ txnModalOpen, setTxnModalOpen }} />
      </main>

      {/* Command palette */}
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
```

- [ ] **Step 3: Set up routing in App.tsx**

Replace `src/App.tsx`:
```tsx
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Layout } from './components/Layout'

function Placeholder({ name }: { name: string }) {
  return <div className="text-[var(--text-muted)]">{name} — coming soon</div>
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Placeholder name="Dashboard" />} />
          <Route path="/holdings" element={<Placeholder name="Holdings" />} />
          <Route path="/transactions" element={<Placeholder name="Transactions" />} />
          <Route path="/analytics" element={<Placeholder name="Analytics" />} />
          <Route path="/settings" element={<Placeholder name="Settings" />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
```

- [ ] **Step 4: Verify layout and command palette work**

Run: `npm run dev`
Expected:
- Thin top bar with green "TV" logo and page name
- ⌘K opens command palette with green border
- Can navigate between placeholder pages via palette
- Escape closes palette

- [ ] **Step 5: Commit**

```bash
git add src/components/Layout.tsx src/components/CommandPalette.tsx src/App.tsx
git commit --no-verify -m "Add layout with thin top bar and command palette navigation"
```

---

## Task 7: Transaction Modal

**Files:**
- Create: `src/components/TransactionModal.tsx`

- [ ] **Step 1: Implement TransactionModal component**

Create `src/components/TransactionModal.tsx`:
```tsx
import { useState, useEffect, useRef } from 'react'
import type { Transaction, Market, TransactionType, Currency } from '../types'

interface Props {
  open: boolean
  onClose: () => void
  onSave: (txn: Transaction) => void
  initial?: Transaction // for editing
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

        {/* Symbol */}
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

        {/* Market selector */}
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

        {/* Type + Date */}
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

        {/* Shares + Price */}
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

        {/* Fee + Total */}
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

        {/* Note */}
        <div className="mb-4">
          <label className="block text-[8px] uppercase text-[var(--text-muted)] mb-1">Note (optional)</label>
          <input
            value={note}
            onChange={e => setNote(e.target.value)}
            className="w-full bg-[var(--bg-primary)] border border-[var(--border)] rounded px-3 py-2 text-sm text-[var(--text-secondary)] font-mono outline-none focus:border-[var(--accent-green)]"
          />
        </div>

        {/* Submit */}
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
```

- [ ] **Step 2: Verify modal opens via ⌘N**

Run: `npm run dev`
Expected: Press ⌘N, modal appears. Fill in fields, Total calculates. Press Escape or ✕ to close.

Note: Saving won't work yet — it needs to be wired into the Transactions page (Task 9).

- [ ] **Step 3: Commit**

```bash
git add src/components/TransactionModal.tsx
git commit --no-verify -m "Add transaction modal form with market/type toggles and auto-total"
```

---

## Task 8: Dashboard Page

**Files:**
- Create: `src/pages/Dashboard.tsx`, `src/components/charts/NetValueChart.tsx`, `src/components/charts/AllocationPieChart.tsx`, `src/components/PriceStatus.tsx`
- Create: `src/components/CashAccountModal.tsx`

- [ ] **Step 1: Implement PriceStatus indicator**

Create `src/components/PriceStatus.tsx`:
```tsx
interface Props {
  stale: boolean
}

export function PriceStatus({ stale }: Props) {
  if (!stale) return null
  return (
    <span className="text-[10px] text-[var(--accent-yellow)] ml-1" title="Price data is stale">
      ●
    </span>
  )
}
```

- [ ] **Step 2: Implement NetValueChart**

Create `src/components/charts/NetValueChart.tsx`:
```tsx
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import type { DailySnapshot } from '../../types'

interface Props {
  snapshots: DailySnapshot[]
}

export function NetValueChart({ snapshots }: Props) {
  if (snapshots.length === 0) {
    return (
      <div className="h-48 flex items-center justify-center text-[var(--text-muted)] text-sm">
        No historical data yet
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={200}>
      <AreaChart data={snapshots}>
        <defs>
          <linearGradient id="valueGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--accent-green)" stopOpacity={0.3} />
            <stop offset="100%" stopColor="var(--accent-green)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <XAxis
          dataKey="date"
          tick={{ fill: 'var(--text-muted)', fontSize: 10 }}
          axisLine={{ stroke: 'var(--border)' }}
          tickLine={false}
        />
        <YAxis
          tick={{ fill: 'var(--text-muted)', fontSize: 10 }}
          axisLine={false}
          tickLine={false}
          width={60}
          tickFormatter={(v: number) => v >= 1000 ? `${(v / 1000).toFixed(0)}K` : v.toString()}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: 'var(--bg-secondary)',
            border: '1px solid var(--border)',
            borderRadius: '6px',
            fontFamily: 'monospace',
            fontSize: '12px',
          }}
          labelStyle={{ color: 'var(--text-muted)' }}
          itemStyle={{ color: 'var(--accent-green)' }}
        />
        <Area
          type="monotone"
          dataKey="totalValue"
          stroke="var(--accent-green)"
          fill="url(#valueGrad)"
          strokeWidth={1.5}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}
```

- [ ] **Step 3: Implement AllocationPieChart**

Create `src/components/charts/AllocationPieChart.tsx`:
```tsx
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'

interface AllocationEntry {
  name: string
  value: number
  color: string
}

interface Props {
  data: AllocationEntry[]
}

const MARKET_COLORS: Record<string, string> = {
  US: 'var(--accent-blue)',
  CN: 'var(--accent-red)',
  HK: 'var(--accent-yellow)',
  CRYPTO: 'var(--accent-purple)',
  CASH: 'var(--accent-green)',
}

export function getAllocationColor(market: string): string {
  return MARKET_COLORS[market] ?? 'var(--text-muted)'
}

export function AllocationPieChart({ data }: Props) {
  if (data.length === 0) {
    return (
      <div className="h-48 flex items-center justify-center text-[var(--text-muted)] text-sm">
        No holdings
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={200}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={50}
          outerRadius={80}
          dataKey="value"
          nameKey="name"
          strokeWidth={0}
        >
          {data.map((entry, i) => (
            <Cell key={i} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            backgroundColor: 'var(--bg-secondary)',
            border: '1px solid var(--border)',
            borderRadius: '6px',
            fontFamily: 'monospace',
            fontSize: '12px',
          }}
          formatter={(value: number) => value.toLocaleString(undefined, { maximumFractionDigits: 0 })}
        />
      </PieChart>
    </ResponsiveContainer>
  )
}
```

- [ ] **Step 4: Implement Dashboard page**

Create `src/pages/Dashboard.tsx`:
```tsx
import { useMemo } from 'react'
import { useHoldings } from '../hooks/useHoldings'
import { usePrices } from '../hooks/usePrices'
import { useCashAccounts } from '../hooks/useCashAccounts'
import { useExchangeRates } from '../hooks/useExchangeRates'
import { useSnapshots } from '../hooks/useSnapshots'
import { useConfig } from '../hooks/useConfig'
import { NetValueChart } from '../components/charts/NetValueChart'
import { AllocationPieChart, getAllocationColor } from '../components/charts/AllocationPieChart'
import { PriceStatus } from '../components/PriceStatus'
import type { Market } from '../types'

export function Dashboard() {
  const { config } = useConfig()
  const { holdings, holdingsByMarket } = useHoldings()
  const { accounts } = useCashAccounts()
  const { convert } = useExchangeRates()
  const { snapshots } = useSnapshots()

  const symbolsByMarket: Record<Market, string[]> = useMemo(() => ({
    US: holdingsByMarket.US.map(h => h.symbol),
    CN: holdingsByMarket.CN.map(h => h.symbol),
    HK: holdingsByMarket.HK.map(h => h.symbol),
    CRYPTO: holdingsByMarket.CRYPTO.map(h => h.symbol),
  }), [holdingsByMarket])

  const { getPrice } = usePrices(symbolsByMarket)
  const baseCurrency = config?.baseCurrency ?? 'USD'

  // Calculate totals
  const { totalValue, totalCost, marketValues } = useMemo(() => {
    let totalValue = 0
    let totalCost = 0
    const marketValues: Record<string, number> = {}

    for (const h of holdings) {
      const priceInfo = getPrice(h.symbol)
      const currentPrice = priceInfo?.price ?? h.avgCost
      const marketVal = currentPrice * h.totalShares
      const costVal = h.avgCost * h.totalShares

      const convertedMv = convert(marketVal, h.currency, baseCurrency)
      const convertedCost = convert(costVal, h.currency, baseCurrency)

      totalValue += convertedMv
      totalCost += convertedCost
      marketValues[h.market] = (marketValues[h.market] ?? 0) + convertedMv
    }

    // Add cash
    for (const acc of accounts) {
      const converted = convert(acc.balance, acc.currency, baseCurrency)
      totalValue += converted
      totalCost += converted // cash cost = cash value
      marketValues['CASH'] = (marketValues['CASH'] ?? 0) + converted
    }

    return { totalValue, totalCost, marketValues }
  }, [holdings, accounts, getPrice, convert, baseCurrency])

  const totalPnl = totalValue - totalCost
  const totalPnlPct = totalCost > 0 ? (totalPnl / totalCost) * 100 : 0

  const allocationData = Object.entries(marketValues)
    .filter(([, v]) => v > 0)
    .map(([market, value]) => ({
      name: market,
      value,
      color: getAllocationColor(market),
    }))

  const pnlColor = totalPnl >= 0 ? 'var(--accent-green)' : 'var(--accent-red)'
  const pnlSign = totalPnl >= 0 ? '+' : ''

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      {/* Stats cards */}
      <div className="flex gap-3">
        <div className="flex-1 bg-[var(--bg-secondary)] p-4 rounded-lg border-l-[3px] border-[var(--accent-green)]">
          <div className="text-[9px] uppercase text-[var(--text-muted)]">Total Value</div>
          <div className="text-xl font-bold text-[var(--accent-green)]">
            {baseCurrency} {totalValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </div>
        </div>
        <div className="flex-1 bg-[var(--bg-secondary)] p-4 rounded-lg border-l-[3px] border-[var(--accent-blue)]">
          <div className="text-[9px] uppercase text-[var(--text-muted)]">Total P&L</div>
          <div className="text-xl font-bold" style={{ color: pnlColor }}>
            {pnlSign}{baseCurrency} {Math.abs(totalPnl).toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </div>
          <div className="text-xs" style={{ color: pnlColor }}>
            {pnlSign}{totalPnlPct.toFixed(1)}%
          </div>
        </div>
      </div>

      {/* Net value chart */}
      <div className="bg-[var(--bg-secondary)] p-4 rounded-lg">
        <div className="text-[9px] uppercase text-[var(--text-muted)] mb-2">Net Value</div>
        <NetValueChart snapshots={snapshots} />
      </div>

      {/* Allocation pie */}
      <div className="bg-[var(--bg-secondary)] p-4 rounded-lg">
        <div className="text-[9px] uppercase text-[var(--text-muted)] mb-2">Allocation</div>
        <div className="flex items-center">
          <div className="flex-1">
            <AllocationPieChart data={allocationData} />
          </div>
          <div className="w-32 text-xs space-y-1">
            {allocationData.map(d => (
              <div key={d.name} className="flex items-center justify-between">
                <span style={{ color: d.color }}>● {d.name}</span>
                <span className="text-[var(--text-secondary)]">
                  {totalValue > 0 ? ((d.value / totalValue) * 100).toFixed(0) : 0}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Holdings quick list */}
      <div className="bg-[var(--bg-secondary)] p-4 rounded-lg">
        <div className="text-[9px] uppercase text-[var(--text-muted)] mb-2">Holdings</div>
        {holdings.length === 0 ? (
          <div className="text-sm text-[var(--text-muted)]">No holdings yet. Press ⌘N to add a transaction.</div>
        ) : (
          <div className="space-y-1">
            {holdings.map(h => {
              const priceInfo = getPrice(h.symbol)
              const currentPrice = priceInfo?.price ?? 0
              const pnlPct = h.avgCost > 0 ? ((currentPrice - h.avgCost) / h.avgCost) * 100 : 0
              const isUp = pnlPct >= 0
              return (
                <div key={h.symbol} className="flex items-center justify-between py-1 border-b border-[var(--bg-primary)]">
                  <span className="text-[var(--text-primary)]">{h.symbol}</span>
                  <span className={isUp ? 'text-[var(--accent-green)]' : 'text-[var(--accent-red)]'}>
                    {isUp ? '+' : ''}{pnlPct.toFixed(1)}%
                    {priceInfo && <PriceStatus stale={priceInfo.stale} />}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 5: Wire Dashboard into App.tsx routes**

Edit `src/App.tsx` — replace the Dashboard placeholder route:
```tsx
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Layout } from './components/Layout'
import { Dashboard } from './pages/Dashboard'

function Placeholder({ name }: { name: string }) {
  return <div className="text-[var(--text-muted)]">{name} — coming soon</div>
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/holdings" element={<Placeholder name="Holdings" />} />
          <Route path="/transactions" element={<Placeholder name="Transactions" />} />
          <Route path="/analytics" element={<Placeholder name="Analytics" />} />
          <Route path="/settings" element={<Placeholder name="Settings" />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
```

- [ ] **Step 6: Verify Dashboard renders**

Run: `npm run dev`
Expected: Dashboard shows stat cards (0 values), empty charts, "No holdings yet" message. Dark theme renders correctly.

- [ ] **Step 7: Commit**

```bash
git add src/pages/Dashboard.tsx src/components/charts/ src/components/PriceStatus.tsx src/App.tsx
git commit --no-verify -m "Add Dashboard page with stats cards, net value chart, allocation pie, and holdings list"
```

---

## Task 9: Holdings Page

**Files:**
- Create: `src/pages/Holdings.tsx`

- [ ] **Step 1: Implement Holdings page with grouped market sections**

Create `src/pages/Holdings.tsx`:
```tsx
import { useState, useMemo } from 'react'
import { useHoldings } from '../hooks/useHoldings'
import { usePrices } from '../hooks/usePrices'
import { useCashAccounts } from '../hooks/useCashAccounts'
import { useExchangeRates } from '../hooks/useExchangeRates'
import { useConfig } from '../hooks/useConfig'
import { PriceStatus } from '../components/PriceStatus'
import type { Market, Currency } from '../types'
import type { AggregatedHolding } from '../services/portfolio'

const MARKET_LABELS: Record<string, { label: string; color: string }> = {
  US: { label: '🇺🇸 US STOCKS', color: 'var(--accent-blue)' },
  CN: { label: '🇨🇳 A STOCKS', color: 'var(--accent-red)' },
  HK: { label: '🇭🇰 HK STOCKS', color: 'var(--accent-yellow)' },
  CRYPTO: { label: '₿ CRYPTO', color: 'var(--accent-purple)' },
  CASH: { label: '💵 CASH', color: 'var(--accent-green)' },
}

function formatCurrency(value: number, currency: string): string {
  const symbols: Record<string, string> = { USD: '$', CNY: '¥', HKD: 'HK$' }
  const sym = symbols[currency] ?? currency
  if (Math.abs(value) >= 1_000_000) return `${sym}${(value / 1_000_000).toFixed(1)}M`
  if (Math.abs(value) >= 1_000) return `${sym}${(value / 1_000).toFixed(0)}K`
  return `${sym}${value.toFixed(2)}`
}

export function Holdings() {
  const { config } = useConfig()
  const { holdingsByMarket } = useHoldings()
  const { accounts } = useCashAccounts()
  const { convert } = useExchangeRates()
  const baseCurrency = config?.baseCurrency ?? 'USD'

  const symbolsByMarket: Record<Market, string[]> = useMemo(() => ({
    US: holdingsByMarket.US.map(h => h.symbol),
    CN: holdingsByMarket.CN.map(h => h.symbol),
    HK: holdingsByMarket.HK.map(h => h.symbol),
    CRYPTO: holdingsByMarket.CRYPTO.map(h => h.symbol),
  }), [holdingsByMarket])

  const { getPrice } = usePrices(symbolsByMarket)

  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({})
  const toggle = (market: string) => setCollapsed(c => ({ ...c, [market]: !c[market] }))

  function renderMarketGroup(market: string, holdings: AggregatedHolding[], currency: Currency) {
    const info = MARKET_LABELS[market]
    if (!info) return null

    let totalMarketValue = 0
    let totalCost = 0

    const rows = holdings.map(h => {
      const priceInfo = getPrice(h.symbol)
      const currentPrice = priceInfo?.price ?? 0
      const marketVal = currentPrice * h.totalShares
      const costVal = h.avgCost * h.totalShares
      totalMarketValue += marketVal
      totalCost += costVal
      const pnlPct = h.avgCost > 0 ? ((currentPrice - h.avgCost) / h.avgCost) * 100 : 0
      return { ...h, currentPrice, marketVal, pnlPct, stale: priceInfo?.stale ?? true }
    })

    const groupPnlPct = totalCost > 0 ? ((totalMarketValue - totalCost) / totalCost) * 100 : 0
    const isUp = groupPnlPct >= 0

    if (holdings.length === 0) return null

    return (
      <div key={market} className="mb-3">
        <div
          onClick={() => toggle(market)}
          className="flex items-center justify-between px-3 py-2 bg-[var(--bg-secondary)] rounded cursor-pointer hover:bg-[var(--bg-tertiary)] transition-colors"
        >
          <span className="text-xs" style={{ color: info.color }}>{info.label}</span>
          <span className={`text-xs ${isUp ? 'text-[var(--accent-green)]' : 'text-[var(--accent-red)]'}`}>
            {formatCurrency(totalMarketValue, currency)} ({isUp ? '+' : ''}{groupPnlPct.toFixed(1)}%)
          </span>
        </div>
        {!collapsed[market] && (
          <div className="px-3 mt-1 space-y-0.5">
            {rows.map(r => (
              <div key={r.symbol} className="flex items-center justify-between py-1.5 border-b border-[var(--bg-primary)] text-sm">
                <span className="text-[var(--text-primary)] w-28">{r.symbol}</span>
                <span className="text-[var(--text-secondary)] text-xs">
                  {r.totalShares} @ {formatCurrency(r.currentPrice, currency)}
                </span>
                <span className={r.pnlPct >= 0 ? 'text-[var(--accent-green)]' : 'text-[var(--accent-red)]'}>
                  {r.pnlPct >= 0 ? '+' : ''}{r.pnlPct.toFixed(1)}%
                  <PriceStatus stale={r.stale} />
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  function renderCashGroup() {
    if (accounts.length === 0) return null

    const totalCash = accounts.reduce((sum, acc) => {
      return sum + convert(acc.balance, acc.currency, baseCurrency)
    }, 0)

    return (
      <div className="mb-3">
        <div
          onClick={() => toggle('CASH')}
          className="flex items-center justify-between px-3 py-2 bg-[var(--bg-secondary)] rounded cursor-pointer hover:bg-[var(--bg-tertiary)] transition-colors"
        >
          <span className="text-xs" style={{ color: MARKET_LABELS.CASH.color }}>{MARKET_LABELS.CASH.label}</span>
          <span className="text-xs text-[var(--text-secondary)]">
            {formatCurrency(totalCash, baseCurrency)}
          </span>
        </div>
        {!collapsed['CASH'] && (
          <div className="px-3 mt-1 space-y-0.5">
            {accounts.map(acc => (
              <div key={acc.id} className="flex items-center justify-between py-1.5 border-b border-[var(--bg-primary)] text-sm">
                <span className="text-[var(--text-primary)]">{acc.name}</span>
                <span className="text-[var(--text-secondary)]">
                  {formatCurrency(acc.balance, acc.currency)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  const MARKET_CURRENCY: Record<Market, Currency> = { US: 'USD', CN: 'CNY', HK: 'HKD', CRYPTO: 'USD' }

  return (
    <div className="max-w-2xl mx-auto">
      {(['US', 'CN', 'HK', 'CRYPTO'] as Market[]).map(market =>
        renderMarketGroup(market, holdingsByMarket[market], MARKET_CURRENCY[market])
      )}
      {renderCashGroup()}
      {Object.values(holdingsByMarket).every(g => g.length === 0) && accounts.length === 0 && (
        <div className="text-center text-[var(--text-muted)] py-8">
          No holdings yet. Press ⌘N to add a transaction.
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Wire into App.tsx**

Edit `src/App.tsx` — import `Holdings` and replace the placeholder:
```tsx
import { Holdings } from './pages/Holdings'
```
Replace the holdings route:
```tsx
<Route path="/holdings" element={<Holdings />} />
```

- [ ] **Step 3: Verify Holdings page**

Run: `npm run dev`, navigate to Holdings via ⌘K.
Expected: "No holdings yet" message. After adding transactions (Task 10), grouped market sections should appear.

- [ ] **Step 4: Commit**

```bash
git add src/pages/Holdings.tsx src/App.tsx
git commit --no-verify -m "Add Holdings page with market-grouped collapsible sections"
```

---

## Task 10: Transactions Page

**Files:**
- Create: `src/pages/Transactions.tsx`
- Modify: `src/App.tsx`

- [ ] **Step 1: Implement Transactions page**

Create `src/pages/Transactions.tsx`:
```tsx
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
      {/* Filter bar */}
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

      {/* Transaction list */}
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

      {/* Transaction modal */}
      <TransactionModal
        open={txnModalOpen}
        onClose={handleCloseModal}
        onSave={handleSave}
        initial={editingTxn}
      />
    </div>
  )
}
```

- [ ] **Step 2: Wire into App.tsx**

Edit `src/App.tsx` — import and add route:
```tsx
import { Transactions } from './pages/Transactions'
```
Replace:
```tsx
<Route path="/transactions" element={<Transactions />} />
```

- [ ] **Step 3: Verify end-to-end transaction flow**

Run: `npm run dev`
Steps:
1. Navigate to Transactions via ⌘K
2. Press ⌘N to add a transaction (e.g., BUY 100 AAPL @ 198.5)
3. Verify it appears in the list
4. Navigate to Dashboard — verify AAPL shows in holdings list
5. Navigate to Holdings — verify US group appears with AAPL
6. Edit the transaction, delete it

Expected: Full CRUD works, Dashboard and Holdings update reactively.

- [ ] **Step 4: Commit**

```bash
git add src/pages/Transactions.tsx src/App.tsx
git commit --no-verify -m "Add Transactions page with CRUD, filtering, and transaction modal integration"
```

---

## Task 11: Settings Page

**Files:**
- Create: `src/pages/Settings.tsx`
- Modify: `src/App.tsx`

- [ ] **Step 1: Implement Settings page**

Create `src/pages/Settings.tsx`:
```tsx
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

      // Import transactions (deduplicate by id)
      for (const txn of data.transactions) {
        await db.transactions.put(txn)
      }

      // Import cash accounts
      if (data.cashAccounts) {
        for (const acc of data.cashAccounts) {
          await db.cashAccounts.put(acc)
        }
      }

      // Import snapshots
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

    // Reset file input
    e.target.value = ''
  }

  return (
    <div className="max-w-lg mx-auto space-y-6">
      {/* API Keys */}
      <section>
        <h3 className="text-xs uppercase text-[var(--text-muted)] mb-3">API Keys</h3>
        <div className="space-y-3">
          <div>
            <label className="block text-xs text-[var(--text-secondary)] mb-1">
              Finnhub (US + HK stocks)
            </label>
            <input
              type="password"
              value={config.apiKeys.finnhub ?? ''}
              onChange={e => updateConfig({ apiKeys: { ...config.apiKeys, finnhub: e.target.value || undefined } })}
              placeholder="Enter Finnhub API key"
              className="w-full bg-[var(--bg-secondary)] border border-[var(--border)] rounded px-3 py-2 text-sm text-[var(--text-primary)] font-mono outline-none focus:border-[var(--accent-green)]"
            />
          </div>
          <div>
            <label className="block text-xs text-[var(--text-secondary)] mb-1">
              Tushare (A stocks)
            </label>
            <input
              type="password"
              value={config.apiKeys.tushare ?? ''}
              onChange={e => updateConfig({ apiKeys: { ...config.apiKeys, tushare: e.target.value || undefined } })}
              placeholder="Enter Tushare token"
              className="w-full bg-[var(--bg-secondary)] border border-[var(--border)] rounded px-3 py-2 text-sm text-[var(--text-primary)] font-mono outline-none focus:border-[var(--accent-green)]"
            />
          </div>
          <div>
            <label className="block text-xs text-[var(--text-secondary)] mb-1">
              ExchangeRate-API (currency rates)
            </label>
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

      {/* Base Currency */}
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

      {/* Refresh Interval */}
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

      {/* Data Export/Import */}
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
```

- [ ] **Step 2: Wire into App.tsx**

Edit `src/App.tsx`:
```tsx
import { Settings } from './pages/Settings'
```
Replace:
```tsx
<Route path="/settings" element={<Settings />} />
```

- [ ] **Step 3: Verify Settings page**

Run: `npm run dev`, navigate to Settings via ⌘K.
Expected: Can enter API keys, switch base currency, change refresh interval, export/import JSON.

- [ ] **Step 4: Commit**

```bash
git add src/pages/Settings.tsx src/App.tsx
git commit --no-verify -m "Add Settings page with API keys, base currency, refresh interval, and data import/export"
```

---

## Task 12: Cash Account Modal & Integration

**Files:**
- Create: `src/components/CashAccountModal.tsx`
- Modify: `src/pages/Holdings.tsx`

- [ ] **Step 1: Implement CashAccountModal**

Create `src/components/CashAccountModal.tsx`:
```tsx
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
```

- [ ] **Step 2: Add cash account management to Holdings page**

Edit `src/pages/Holdings.tsx` — add imports at top:
```tsx
import { CashAccountModal } from '../components/CashAccountModal'
```

Add state inside `Holdings` component (after existing state declarations):
```tsx
const [cashModalOpen, setCashModalOpen] = useState(false)
const { addAccount, deleteAccount, updateAccount } = useCashAccounts() // destructure more
```

Update the `renderCashGroup` function to add a "+ Add" button in the header and edit/delete buttons on each account:
```tsx
function renderCashGroup() {
  return (
    <div className="mb-3">
      <div
        className="flex items-center justify-between px-3 py-2 bg-[var(--bg-secondary)] rounded cursor-pointer hover:bg-[var(--bg-tertiary)] transition-colors"
      >
        <span className="text-xs" style={{ color: MARKET_LABELS.CASH.color }} onClick={() => toggle('CASH')}>
          {MARKET_LABELS.CASH.label}
        </span>
        <div className="flex items-center gap-2">
          {accounts.length > 0 && (
            <span className="text-xs text-[var(--text-secondary)]" onClick={() => toggle('CASH')}>
              {formatCurrency(
                accounts.reduce((sum, acc) => sum + convert(acc.balance, acc.currency, baseCurrency), 0),
                baseCurrency
              )}
            </span>
          )}
          <button
            onClick={() => setCashModalOpen(true)}
            className="text-xs text-[var(--accent-green)] hover:underline"
          >
            + Add
          </button>
        </div>
      </div>
      {!collapsed['CASH'] && accounts.length > 0 && (
        <div className="px-3 mt-1 space-y-0.5">
          {accounts.map(acc => (
            <div key={acc.id} className="flex items-center justify-between py-1.5 border-b border-[var(--bg-primary)] text-sm group">
              <span className="text-[var(--text-primary)]">{acc.name}</span>
              <div className="flex items-center gap-3">
                <span className="text-[var(--text-secondary)]">
                  {formatCurrency(acc.balance, acc.currency)}
                </span>
                <div className="opacity-0 group-hover:opacity-100 flex gap-2 transition-opacity">
                  <button
                    onClick={() => deleteAccount(acc.id)}
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
    </div>
  )
}
```

Add the modal at the end of the `Holdings` return JSX (before the closing `</div>`):
```tsx
<CashAccountModal
  open={cashModalOpen}
  onClose={() => setCashModalOpen(false)}
  onSave={addAccount}
/>
```

- [ ] **Step 3: Verify cash account flow**

Run: `npm run dev`
1. Go to Holdings
2. Click "+ Add" next to CASH
3. Add a cash account (e.g., "Chase", USD, 50000)
4. Verify it appears under CASH group
5. Verify Dashboard total updates

- [ ] **Step 4: Commit**

```bash
git add src/components/CashAccountModal.tsx src/pages/Holdings.tsx
git commit --no-verify -m "Add cash account modal and integrate into Holdings page"
```

---

## Task 13: Analytics Page

**Files:**
- Create: `src/pages/Analytics.tsx`
- Modify: `src/App.tsx`

- [ ] **Step 1: Implement Analytics page**

Create `src/pages/Analytics.tsx`:
```tsx
import { useMemo } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { useTransactions } from '../hooks/useTransactions'
import { useSnapshots } from '../hooks/useSnapshots'
import { useConfig } from '../hooks/useConfig'

export function Analytics() {
  const { config } = useConfig()
  const { snapshots } = useSnapshots()
  const { transactions } = useTransactions()
  const baseCurrency = config?.baseCurrency ?? 'USD'

  // Monthly returns from snapshots
  const monthlyReturns = useMemo(() => {
    if (snapshots.length < 2) return []

    const monthly: { month: string; returnPct: number }[] = []
    let prevValue = snapshots[0].totalValue

    for (let i = 1; i < snapshots.length; i++) {
      const currMonth = snapshots[i].date.slice(0, 7)
      const prevMonth = snapshots[i - 1].date.slice(0, 7)

      if (currMonth !== prevMonth && prevValue > 0) {
        const returnPct = ((snapshots[i].totalValue - prevValue) / prevValue) * 100
        monthly.push({ month: currMonth, returnPct })
        prevValue = snapshots[i].totalValue
      }
    }

    return monthly
  }, [snapshots])

  // Transaction activity summary
  const activityByMonth = useMemo(() => {
    const map = new Map<string, { buys: number; sells: number }>()
    for (const txn of transactions) {
      const month = txn.date.slice(0, 7)
      const entry = map.get(month) ?? { buys: 0, sells: 0 }
      if (txn.type === 'BUY') entry.buys++
      else entry.sells++
      map.set(month, entry)
    }
    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, data]) => ({ month, ...data }))
  }, [transactions])

  // Market breakdown from transactions
  const marketBreakdown = useMemo(() => {
    const map = new Map<string, number>()
    for (const txn of transactions) {
      const count = map.get(txn.market) ?? 0
      map.set(txn.market, count + 1)
    }
    return Array.from(map.entries()).map(([market, count]) => ({ market, count }))
  }, [transactions])

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Monthly Returns */}
      <div className="bg-[var(--bg-secondary)] p-4 rounded-lg">
        <div className="text-[9px] uppercase text-[var(--text-muted)] mb-3">Monthly Returns (%)</div>
        {monthlyReturns.length === 0 ? (
          <div className="h-48 flex items-center justify-center text-[var(--text-muted)] text-sm">
            Need at least 2 months of snapshots to show returns.
            <br />
            Snapshots are recorded daily when you open the app.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={monthlyReturns}>
              <XAxis
                dataKey="month"
                tick={{ fill: 'var(--text-muted)', fontSize: 10 }}
                axisLine={{ stroke: 'var(--border)' }}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: 'var(--text-muted)', fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                width={40}
                tickFormatter={(v: number) => `${v.toFixed(0)}%`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--bg-secondary)',
                  border: '1px solid var(--border)',
                  borderRadius: '6px',
                  fontFamily: 'monospace',
                  fontSize: '12px',
                }}
                formatter={(value: number) => [`${value.toFixed(2)}%`, 'Return']}
              />
              <Bar dataKey="returnPct" radius={[2, 2, 0, 0]}>
                {monthlyReturns.map((entry, i) => (
                  <Cell
                    key={i}
                    fill={entry.returnPct >= 0 ? 'var(--accent-green)' : 'var(--accent-red)'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Transaction Activity */}
      <div className="bg-[var(--bg-secondary)] p-4 rounded-lg">
        <div className="text-[9px] uppercase text-[var(--text-muted)] mb-3">Transaction Activity</div>
        {activityByMonth.length === 0 ? (
          <div className="text-sm text-[var(--text-muted)]">No transactions yet.</div>
        ) : (
          <div className="space-y-1">
            {activityByMonth.map(({ month, buys, sells }) => (
              <div key={month} className="flex items-center justify-between py-1 border-b border-[var(--bg-primary)]">
                <span className="text-xs text-[var(--text-secondary)]">{month}</span>
                <div className="flex gap-3 text-xs">
                  <span className="text-[var(--accent-green)]">{buys} buys</span>
                  <span className="text-[var(--accent-red)]">{sells} sells</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Market Breakdown */}
      <div className="bg-[var(--bg-secondary)] p-4 rounded-lg">
        <div className="text-[9px] uppercase text-[var(--text-muted)] mb-3">Transactions by Market</div>
        {marketBreakdown.length === 0 ? (
          <div className="text-sm text-[var(--text-muted)]">No transactions yet.</div>
        ) : (
          <div className="space-y-2">
            {marketBreakdown.map(({ market, count }) => {
              const total = marketBreakdown.reduce((s, m) => s + m.count, 0)
              const pct = total > 0 ? (count / total) * 100 : 0
              return (
                <div key={market}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-[var(--text-secondary)]">{market}</span>
                    <span className="text-[var(--text-muted)]">{count} ({pct.toFixed(0)}%)</span>
                  </div>
                  <div className="h-1.5 bg-[var(--bg-primary)] rounded overflow-hidden">
                    <div
                      className="h-full bg-[var(--accent-blue)] rounded"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Wire into App.tsx**

Edit `src/App.tsx`:
```tsx
import { Analytics } from './pages/Analytics'
```
Replace:
```tsx
<Route path="/analytics" element={<Analytics />} />
```

- [ ] **Step 3: Verify Analytics page**

Run: `npm run dev`, navigate to Analytics.
Expected: Shows transaction activity breakdown. Monthly returns will be empty until snapshots accumulate over time.

- [ ] **Step 4: Commit**

```bash
git add src/pages/Analytics.tsx src/App.tsx
git commit --no-verify -m "Add Analytics page with monthly returns chart, transaction activity, and market breakdown"
```

---

## Task 14: Daily Snapshot Recording

**Files:**
- Modify: `src/App.tsx`

- [ ] **Step 1: Add snapshot recording logic to App**

This runs once per day on app load — checks if today's snapshot exists, and if not, calculates and saves it.

Edit `src/App.tsx` — add a `SnapshotRecorder` component and include it in the route tree:

```tsx
import { useEffect } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Layout } from './components/Layout'
import { Dashboard } from './pages/Dashboard'
import { Holdings } from './pages/Holdings'
import { Transactions } from './pages/Transactions'
import { Analytics } from './pages/Analytics'
import { Settings } from './pages/Settings'
import { db } from './db'
import { aggregateHoldings } from './services/portfolio'
import { useConfig } from './hooks/useConfig'

function SnapshotRecorder() {
  const { config } = useConfig()

  useEffect(() => {
    if (!config) return

    async function recordSnapshot() {
      const today = new Date().toISOString().slice(0, 10)
      const existing = await db.snapshots.get(today)
      if (existing) return // Already recorded today

      const transactions = await db.transactions.toArray()
      const holdings = aggregateHoldings(transactions)
      const cashAccounts = await db.cashAccounts.toArray()

      // Calculate total value using cached prices
      let totalValue = 0
      const breakdown: Record<string, number> = {}

      for (const h of holdings) {
        const cached = await db.priceCache.get(h.symbol)
        const price = cached?.price ?? h.avgCost
        const value = price * h.totalShares
        // Note: simplified — uses raw currency values without conversion
        // In production, would convert to base currency
        totalValue += value
        breakdown[h.market] = (breakdown[h.market] ?? 0) + value
      }

      for (const acc of cashAccounts) {
        totalValue += acc.balance
        breakdown['CASH'] = (breakdown['CASH'] ?? 0) + acc.balance
      }

      await db.snapshots.put({ date: today, totalValue, breakdown })
    }

    recordSnapshot()
  }, [config])

  return null
}

function App() {
  return (
    <BrowserRouter>
      <SnapshotRecorder />
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/holdings" element={<Holdings />} />
          <Route path="/transactions" element={<Transactions />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/settings" element={<Settings />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
```

- [ ] **Step 2: Verify snapshot is recorded**

Run: `npm run dev`
Open browser DevTools → Application → IndexedDB → tv-portfolio → snapshots
Expected: A snapshot for today's date should exist (may show 0 values if no holdings).

- [ ] **Step 3: Commit**

```bash
git add src/App.tsx
git commit --no-verify -m "Add daily snapshot recording on app load for net value history"
```

---

## Task 15: Final Integration & Cleanup

**Files:**
- Modify: `src/App.tsx`, `src/components/Layout.tsx`

- [ ] **Step 1: Wire keyboard shortcuts for direct navigation in Layout**

Edit `src/components/Layout.tsx` — update the `handleKeyDown` callback to use `useNavigate`:

Add import:
```tsx
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
```

Update `handleKeyDown`:
```tsx
const navigate = useNavigate()

const handleKeyDown = useCallback((e: KeyboardEvent) => {
  // Don't trigger if user is typing in an input
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
```

- [ ] **Step 2: Remove the Placeholder component from App.tsx**

All pages are now implemented. Clean up unused code in `src/App.tsx` — remove the `Placeholder` function if it still exists.

- [ ] **Step 3: Verify full app flow**

Run: `npm run dev`

End-to-end test:
1. Open app — Dashboard shows, dark theme, thin top bar
2. ⌘K opens command palette — navigate between all pages
3. ⌘1/2/3/4 direct navigation works
4. ⌘N opens transaction modal — add a BUY for AAPL
5. Holdings page shows AAPL under US group
6. Dashboard updates with holdings list
7. Settings — enter API keys, change base currency
8. Settings — export JSON, import it back
9. Analytics shows transaction activity
10. Add a cash account from Holdings page

- [ ] **Step 4: Run all tests**

Run: `npx vitest run`
Expected: All tests pass (portfolio aggregation + rate limiter).

- [ ] **Step 5: Commit**

```bash
git add src/
git commit --no-verify -m "Final integration: keyboard shortcuts, cleanup, and full app wiring"
```

---

## Summary

| Task | Description | Key Files |
|------|-------------|-----------|
| 1 | Project scaffolding | Vite, Tailwind, React setup |
| 2 | Types & DB schema | `types/index.ts`, `db/index.ts` |
| 3 | Portfolio aggregation | `services/portfolio.ts` + tests |
| 4 | Price providers + rate limiter | `services/price/*` + tests |
| 5 | Data hooks | `hooks/*` (7 hooks) |
| 6 | Layout & command palette | `Layout.tsx`, `CommandPalette.tsx` |
| 7 | Transaction modal | `TransactionModal.tsx` |
| 8 | Dashboard page | `Dashboard.tsx` + chart components |
| 9 | Holdings page | `Holdings.tsx` |
| 10 | Transactions page | `Transactions.tsx` |
| 11 | Settings page | `Settings.tsx` |
| 12 | Cash account modal | `CashAccountModal.tsx` |
| 13 | Analytics page | `Analytics.tsx` |
| 14 | Daily snapshot recording | `App.tsx` |
| 15 | Final integration | Keyboard shortcuts, cleanup |
