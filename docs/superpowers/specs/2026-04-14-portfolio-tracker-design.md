# Portfolio Tracker (TV) — 设计文档

## 概述

一个纯前端的个人投资组合追踪器，支持美股、A股、港股、虚拟货币和多币种现金持仓管理。暗色 Geek 风格，命令面板驱动导航，数据本地存储。未来通过 Capacitor 打包为 iOS/Android App。

## 技术栈

| 层级 | 技术 |
|------|------|
| 构建 | Vite |
| 框架 | React 18 + TypeScript |
| 样式 | TailwindCSS（暗色主题） |
| 存储 | IndexedDB（Dexie.js） |
| 图表 | Recharts |
| 路由 | React Router |
| 移动端（未来） | Capacitor |

## 数据源 & API Key

用户在 Settings 页面配置自己的 API Key，所有请求从浏览器直接发出。

| 数据 | 服务 | Key 要求 | 频率限制 |
|------|------|----------|----------|
| 美股 + 港股 | Finnhub | 需要 Key | 60次/分钟 |
| A股 | Tushare | 需要 Token | 200次/分钟 |
| 虚拟货币 | CoinGecko | 免费，无需 Key | 10-30次/分钟 |
| 汇率 | ExchangeRate-API | 需要 Key | 1500次/月 |

## 数据模型

### Transaction（核心存储）

```typescript
interface Transaction {
  id: string            // UUID
  symbol: string        // "AAPL", "600519.SH", "0700.HK", "BTC"
  market: "US" | "CN" | "HK" | "CRYPTO"
  type: "BUY" | "SELL"
  shares: number
  price: number
  fee: number
  currency: "USD" | "CNY" | "HKD"
  date: string          // ISO date
  note?: string
}
```

### CashAccount

```typescript
interface CashAccount {
  id: string
  name: string          // "招商银行", "Chase"
  currency: "USD" | "CNY" | "HKD"
  balance: number
}
```

### PriceCache

```typescript
interface PriceCache {
  symbol: string
  price: number
  updatedAt: number     // timestamp
}
```

### DailySnapshot（净值曲线数据）

```typescript
interface DailySnapshot {
  date: string
  totalValue: number    // 折算为基准货币的总资产
  breakdown: Record<string, number>  // 各市场资产值
}
```

### AppConfig

```typescript
interface AppConfig {
  baseCurrency: "USD" | "CNY" | "HKD"
  apiKeys: {
    finnhub?: string
    tushare?: string
    exchangeRate?: string
  }
  priceRefreshInterval: number  // 分钟
}
```

### Holding（运行时聚合，不直接存储）

由 Transaction 记录实时聚合计算，保证数据一致性。

```typescript
interface Holding {
  symbol: string
  market: "US" | "CN" | "HK" | "CRYPTO"
  currency: "USD" | "CNY" | "HKD"
  totalShares: number
  avgCost: number
  currentPrice: number  // 从 PriceCache 获取
}
```

## 架构

```
┌─────────────────────────────────────────────┐
│              React SPA (Vite + TS)          │
├─────────────┬───────────┬───────────────────┤
│   Pages     │ Components│   Hooks/Services  │
│  Dashboard  │ Portfolio │  usePortfolio()   │
│  Holdings   │ Charts    │  usePriceService()│
│  Transactions│ Forms    │  useExchangeRate()│
│  Analytics  │ Tables    │  useCurrency()    │
│  Settings   │ CmdPalette│  db (Dexie)       │
├─────────────┴───────────┴───────────────────┤
│           IndexedDB (Dexie.js)              │
│  transactions | cashAccounts | prices |     │
│  snapshots | config                         │
├─────────────────────────────────────────────┤
│         External APIs (browser fetch)       │
│  Finnhub | Tushare | CoinGecko | ExchRate  │
└─────────────────────────────────────────────┘
```

## 价格服务

### Provider 接口

```typescript
interface PriceProvider {
  name: string
  fetchPrices(symbols: string[]): Promise<PriceResult[]>
  rateLimit: { maxRequests: number; perMs: number }
}
```

### 工作流程

1. 页面加载时，按市场分组所有持仓 symbol
2. 先查 PriceCache，仅请求过期数据（超过 `priceRefreshInterval`）
3. 各 Provider 并行请求，受 RateLimiter 控制
4. 结果写入 PriceCache，触发 UI 更新
5. 汇率通过 ExchangeRate-API 获取，缓存 1 小时

### 容错

API 请求失败时显示上次缓存价格，标记为"过期"状态，不阻塞页面渲染。

## 页面设计

### 导航

- 极细顶栏：显示当前页面名称 + 快捷键提示
- ⌘K 命令面板：页面跳转、快速搜索 symbol、新增交易
- 无固定导航栏，全键盘操作

### Dashboard

终端风格纵向单列流布局：

1. **统计卡片行** — 总资产（支持基准货币/原币切换）、总盈亏、今日盈亏
2. **净值曲线** — 支持日/周/月/年时间维度切换
3. **资产配置饼图** — 按市场分布
4. **持仓快览列表** — 显示各持仓的当日涨跌

### Holdings

按市场分组折叠展示：

- 每个市场组（US / CN / HK / CRYPTO / CASH）有汇总行，显示该组总市值和盈亏
- 展开后显示该组下所有持仓：symbol、数量、当前价格、市值、盈亏百分比
- 点击单个持仓可展开查看详情（成本、交易历史）

### Transactions

- 交易记录列表，按日期倒序
- ⌘N 弹出模态框新增交易
- 表单字段：Symbol（模糊搜索自动补全）、BUY/SELL 切换、日期、数量、价格、手续费
- 自动计算总金额
- 支持编辑和删除
- 按市场/日期筛选

### Analytics

- 月度/年度收益率统计
- 各市场收益对比
- 历史回顾

### Settings

- API Key 配置（Finnhub / Tushare / ExchangeRate-API）
- 基准货币切换（USD / CNY / HKD）
- 价格刷新间隔设置
- 数据导出为 JSON 文件
- 数据从 JSON 文件导入

## 多币种处理

- 每个资产有其原生币种（美股 USD、A股 CNY、港股 HKD、加密货币 USD）
- 默认各币种分开展示
- 可切换到统一基准货币视图查看总览
- 汇率通过 ExchangeRate-API 获取，缓存 1 小时

## 数据导入导出

- **导出**：一键导出所有数据为 JSON 文件（transactions + cashAccounts + config）
- **导入**：导入 JSON 文件恢复数据，导入前校验格式并预览变更
- **合并策略**：按 Transaction ID 去重，新记录追加，冲突提示用户选择

## 未来扩展

- 通过 Capacitor 打包为 iOS / Android App（IndexedDB 在移动端 WebView 中可用）
- 跨设备可通过文件共享（iCloud/Google Drive）手动同步 JSON
