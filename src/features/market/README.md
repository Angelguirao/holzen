# Market feature module

**Product context:** BTC price, volatility thresholds, fear/greed, and pause trigger context on Home.  
**Client target:** [docs/systems/market-client-architecture.md](../../../docs/systems/market-client-architecture.md)  
**Repo map / waves:** [frontend-module-layout.md](../../../docs/fundamentals/frontend-module-layout.md) §10–11

Home orchestration mounts via `app/components/HolzenProvider` (`useHolzenHomeContextState` in pause presentation); this module owns market **domain rules**, fetch/query adapters, and the public API other features may import.

## Folder map

```text
features/market/
  domain/
    market-quote.ts           # BtcPriceData, currencies
    btc-move-severity.ts      # severity from % move
    volatility-thresholds.ts  # cumulative trigger thresholds (shared with edge)
    tracked-assets.ts
    coingecko-market-chart-point.ts
  application/
    pause-context-from-market.ts
    pause-context-home-preview.ts
    format-market-price.ts
    manual-cooldown.ts
    market-display-telemetry.ts   # Home market widget PostHog (chart expand)
    queries/                  # TanStack query keys only
  infrastructure/
    fetch-market-data.ts
    queries/                    # coingecko, holzen display, breathe ambient BTC
  ports/
    market-data.ts            # fetch port (CoinGecko / holzen display)
  presentation/
    use-market-display-preferences.ts  # Home market widget local prefs (price hide, BTC mode, chart expand)
  public.ts
  public-hooks.ts
```

## Imports

- Other features/screens: `@/features/market/public` for types/helpers/queries; `@/features/market/public-hooks` for React hooks.
- Do not import `infrastructure/` or `application/queries/` from outside this folder.
