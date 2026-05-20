# Market client architecture (target)

**Status:** scaffold (May 2026) — expand during Phase B slices  
**Audience:** engineers touching `src/features/market/` or Home market widget  
**Server authority:** `btc_price_cache`, volatility cron (`check-volatility`), threshold config — edges + Postgres  
**Template:** [pause-client-architecture.md](pause-client-architecture.md) §9  
**Principles:** [holzen-application-architecture.md](../fundamentals/holzen-application-architecture.md)

---

## 1. Thesis

**Market is one bounded context** for BTC/volatility **context supply** to pause triggers and Home display. It does not own pause instances or ritual state.

---

## 2. Client rings

| Ring | Owns |
|------|------|
| **Feature** | Quote types, severity rules, fetch ports, display formatters |
| **Screens** | Home market widget JSX — data via `public` / `public-hooks` |
| **Pause (consumer)** | `pause-context-from-market`, home preview builders — import market `public` only |

---

## 3. Target interior (`src/features/market/`)

```text
features/market/
  domain/
    market-quote.ts
    btc-move-severity.ts
    volatility-thresholds.ts
    tracked-assets.ts
  application/use-cases/
    display/              # format-market-price, display telemetry
    context/              # pause-context-from-market, home preview
    cooldown/             # manual-cooldown rules
  ports/
    market-data.ts
  infrastructure/
    fetch-market-data.ts
    queries/              # coingecko, holzen display, ambient BTC
  presentation/
    use-market-display-preferences.ts
  public.ts | public-hooks.ts
```

Group by **market concern** (display vs context vs cooldown), not by “Home”.

---

## 4. Public API

| Barrel | Purpose |
|--------|---------|
| `public.ts` | Types, pure formatters, query key helpers |
| `public-hooks.ts` | Display preferences and market-facing hooks |
| `public-queries.ts` | *(optional)* if query modules peel out of public.ts |

---

## 5. Non-negotiables

1. **Trigger eligibility** — server cron + DB; client shows context, does not authorize volatility fires alone.
2. **Pause imports market** — not the reverse for ritual logic.
3. **External fetch** — CoinGecko / display adapters stay in `infrastructure/`.

---

## 6. Transitional state

Well-aligned relative to other contexts — see [src/features/market/README.md](../../src/features/market/README.md).

---

## 7. Related

- Pause home orchestration: `useHolzenHomeContextState` in pause presentation (composes market + pause)
