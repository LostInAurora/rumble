# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Start dev server (http://localhost:5173)
npm run build        # Type-check + production build
npm run lint         # ESLint
npm run test         # Run tests once (vitest)
npm run test:watch   # Run tests in watch mode
npm run cap:sync     # Build web + sync to Android
npm run cap:open     # Open Android project in Android Studio
npm run cap:run      # Build + sync + run on device/emulator
```

## Architecture

Rumble is a **pure frontend** React app — no backend server. All data is stored in IndexedDB via Dexie.js. Runs in browser or as a native Android app via Capacitor.

### Data Flow

```
Pages/Components → Hooks (business logic) → Services (algorithms/API) → Dexie (IndexedDB)
```

- **Hooks** (`src/hooks/`) are the core business logic layer. They wrap Dexie queries with `useLiveQuery()` for reactive UI updates. Key patterns:
  - `useTransactions` auto-adjusts cash accounts on buy/sell/delete
  - `usePrices` rate-limits Finnhub API (60 req/min), caches results in DB, tracks staleness
  - `useHoldings` derives positions from raw transactions via `aggregateHoldings()`

- **Services** (`src/services/`) are pure logic with no React dependency:
  - `portfolio.ts` — weighted average cost calculation, realized P&L on sells
  - `price/finnhub.ts` — maps crypto symbols to Binance pairs (BTC → BINANCE:BTCUSDT)
  - `price/rate-limiter.ts` — queue-based throttling

- **Database** (`src/db/index.ts`) — single Dexie class with 5 tables: transactions, cashAccounts, priceCache, snapshots, config

### Key Design Decisions

- **Crypto via Finnhub**: Crypto prices use Finnhub's Binance integration, not a separate API. Symbol mapping is in `src/services/price/finnhub.ts`.
- **USD only**: All values are in USD. No multi-currency support.
- **Cash auto-management**: Buy deducts `price × shares + fee` from the currency's cash account. Sell adds `price × shares - fee`. If no matching account exists, one is created.
- **Daily snapshots**: `SnapshotRecorder` in `App.tsx` records portfolio value once per day on app load.
- **CN/HK markets**: Types exist but UI only shows US and CRYPTO (Finnhub free tier limitation). Can be re-enabled if price sources are added.
- **Capacitor / Android**: Uses `HashRouter` (not `BrowserRouter`) for compatibility with Capacitor's file:// protocol. Vite `base: './'` ensures relative asset paths. Android WebView has no CORS restrictions so Finnhub API works directly. Config in `capacitor.config.ts`, native project in `android/`.

### Styling

- Tailwind CSS 4 + CSS custom properties defined in `src/index.css`
- Two font families: `--font-display` (DM Sans) for UI, `--font-mono` (JetBrains Mono) for data
- Glass-morphism card pattern: `.card-glass` class
- Custom utilities: `.input-field`, `.btn-primary`, `.label`, `.toggle-group`
