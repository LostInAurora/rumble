# Rumble

A personal investment portfolio tracker built with React. Track US stocks, cryptocurrencies, and cash accounts — all data stored locally in your browser.

## Features

- **Multi-asset support** — US stocks and crypto (BTC, ETH, BNB, SOL, etc.)
- **Real-time prices** — Powered by Finnhub API (US stocks + Binance crypto)
- **P&L tracking** — Realized and unrealized profit/loss with weighted average cost
- **Cash management** — Auto-deduct on buy, auto-add on sell, manual deposit/withdraw
- **Dashboard** — Total value, P&L breakdown, net value chart, allocation pie chart
- **Analytics** — Monthly returns, transaction activity, market breakdown
- **Import/Export** — Full data backup and restore as JSON
- **Currency conversion** — Multi-currency support (USD, CNY, HKD) via ExchangeRate-API
- **Offline-first** — All data stored in IndexedDB, works without internet

## Tech Stack

- React 19 + TypeScript
- Vite
- Tailwind CSS 4
- Capacitor (Android native wrapper)
- Dexie.js (IndexedDB)
- Recharts
- JetBrains Mono + DM Sans fonts

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Install

```bash
git clone https://github.com/LostInAurora/rumble.git
cd rumble
npm install
```

### Run

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Build

```bash
npm run build
npm run preview
```

## Configuration

Go to **Settings** in the app to configure:

1. **Finnhub API Key** — Required for stock and crypto prices. Get a free key at [finnhub.io](https://finnhub.io/)
2. **ExchangeRate-API Key** — Optional, for currency conversion. Get one at [exchangerate-api.com](https://www.exchangerate-api.com/)
3. **Base Currency** — USD, CNY, or HKD
4. **Price Refresh Interval** — How often to fetch latest prices (default: 5 minutes)

## Usage

### Adding a Transaction

Click **+ New** in the top right, then fill in:
- Symbol (e.g. AAPL, BTC, ETH)
- Market (US / Crypto)
- Type (Buy / Sell)
- Shares, Price, Fee, Date

Cash is automatically adjusted when you buy or sell.

### Managing Cash

Go to **Holdings** and find the Cash section:
- **+ Add** — Create a new cash account
- **+ Deposit** / **- Withdraw** — Adjust balance on existing accounts

### Data Backup

Go to **Settings > Data**:
- **Export JSON** — Download all your data
- **Import JSON** — Restore from a backup file (replaces existing data)

## Android

Rumble can run as a native Android app via Capacitor.

### Prerequisites

- Android Studio with SDK 24+
- Java 17+

### Build & Run

```bash
npm run cap:sync       # Build web + sync to Android
npm run cap:open       # Open in Android Studio
npm run cap:run        # Build + sync + run on device/emulator
```

## Supported Crypto Symbols

BTC, ETH, SOL, DOGE, ADA, DOT, AVAX, LINK, UNI, XRP, BNB, LTC — prices fetched via Finnhub's Binance integration.

## License

MIT
