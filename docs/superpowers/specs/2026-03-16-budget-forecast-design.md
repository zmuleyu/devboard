# Budget Forecast Module — Design Spec

**Date:** 2026-03-16
**Module:** BudgetForecast (Module 14, Phase 9)
**Position:** After TokenAnalytics (Module 2), before SessionLog (Module 3)

## Problem

TokenAnalytics shows *past* consumption but provides no forward-looking signal. Users only discover they've exceeded the 15M weekly budget after it happens, missing the window to proactively switch to Haiku or throttle sessions.

## Solution

A forecast module that:
1. Projects week-end token usage via weighted moving average (WMA)
2. Detects acceleration/deceleration trends
3. Renders a cumulative chart with prediction band
4. Provides actionable status labels (ON TRACK / CAUTION / OVER BUDGET)

## Data Source

- `token-daily.json` via existing `useTokenData()` hook — returns `{ data: TokenDailyEntry[], loading: boolean }`
- `config.json` via existing `useConfig()` hook — returns config object directly: `{ weeklyTokenBudget: 15000000, warningThreshold: 0.8 }` (note: NOT wrapped in `{ data }` unlike useTokenData)
- Only `date` and `totalTokens` fields from `TokenDailyEntry` are consumed
- No new data files needed

## Algorithm: Weighted Moving Average (WMA)

### Week boundary

Week starts Monday (ISO 8601). Extract current week's data:
```ts
const weekStart = startOfISOWeek(today); // Monday 00:00
const thisWeekData = data.filter(d => d.date >= weekStart);
const weekUsedSoFar = thisWeekData.reduce((s, d) => s + d.totalTokens, 0);
const daysElapsed = thisWeekData.length;
const remainingDays = 7 - daysElapsed;
```

### WMA calculation

Use ALL available historical data (not just this week) with recency weighting:
```
Weights (applied to sorted historical data, most recent first):
  days 1-3:   weight = 3
  days 4-7:   weight = 2
  days 8-14:  weight = 1

Partial window handling:
  Only apply weights for days that actually have data.
  Denominator = sum of weights for available days only.

weightedAvg = sum(daily[i] * weight[i]) / sum(weights_for_available_days)
projectedWeekTotal = weekUsedSoFar + (remainingDays * weightedAvg)
```

### Cumulative chart data construction

For each day Mon-Sun, compute cumulative value:
```ts
// Actual days (data exists)
actualCumulative[dayN] = sum(thisWeekData[0..dayN].totalTokens)

// Forecast days (no data yet)
forecastCumulative[dayN] = actualCumulative[lastActualDay] + (dayN - lastActualDay) * weightedAvg

// Confidence band (±20% of cumulative value at each point)
forecastUpper[dayN] = forecastCumulative[dayN] * 1.2
forecastLower[dayN] = forecastCumulative[dayN] * 0.8
```

### Trend detection

```
avg3 = average of last 3 days (daily totalTokens)
avg7 = average of last 7 days (daily totalTokens)
```
- If < 5 days of total data → always `STEADY` (insufficient for trend)
- If `avg3 > avg7 * 1.5` → `ACCELERATING` (recent usage 50%+ above baseline)
- If `avg3 < avg7 * 0.5` → `DECELERATING` (recent usage 50%+ below baseline)
- Otherwise → `STEADY`

### Edge cases

| Data available | Behavior |
|----------------|----------|
| 0 days total | Show "数据不足" placeholder, no chart |
| 1-2 days total | Simple average (all weight=3), trend=STEADY |
| 3-7 days | Use weight=3 and weight=2 buckets only, trend=STEADY |
| 8-14 days | All three weight buckets, trend detection active |
| 14+ days | Full WMA (cap at 14 days), trend detection active |

## Layout

Three-column grid inside a single `pixel-border` card:

```
┌──────────────────────────────────────────────────────┐
│  TOKEN BUDGET FORECAST   ·  本周预测          [trend] │
├──────────────────┬──────────────────┬────────────────┤
│  Cumulative      │  Stats Panel     │  Status Card   │
│  AreaChart       │                  │                │
│  100%×180px      │  本周已用 X.XM   │  ● ON TRACK    │
│                  │  预计终值 X.XM   │  or CAUTION    │
│  ━━ actual       │  日均(WMA) X.XM  │  or OVER BUDGET│
│  ┄┄ forecast     │  剩余额度 X.XM   │                │
│  ▓▓ ±20% band   │  趋势: STEADY    │  → suggestion  │
│  ── budget 15M   │                  │                │
└──────────────────┴──────────────────┴────────────────┘
```

Responsive: below `md` breakpoint, stack vertically (chart full width, stats + status side by side).

## Chart Specification

**Type:** Recharts AreaChart with two Area layers + ReferenceLine

**X-axis:** Days of the week (Mon–Sun), date format "MM-DD"
- Actual days: solid data points
- Future days: no data points, only forecast line

**Y-axis:** Cumulative tokens (formatted via `formatTokens()`)

**Layers:**
1. `actualCumulative` — solid area, fill `#e8834a` at 15% opacity, stroke `#e8834a` 2px
2. `forecastCumulative` — dashed area, fill `#c084fc` at 10% opacity, stroke `#c084fc` 2px, strokeDasharray "6 3"
3. `forecastUpper` / `forecastLower` — ±20% band, fill `#c084fc` at 5% opacity, no stroke

**ReferenceLine:** y = 15,000,000 (weeklyTokenBudget), stroke `#ef4444`, dasharray "4 4", label "15M"

**Tooltip:** Show date, actual/forecast value, formatted with `formatTokens()`

## Stats Panel

Four metrics displayed vertically:
| Metric | Calculation | Format |
|--------|-------------|--------|
| 本周已用 | Sum of actual days this week | `formatTokens()` |
| 预计终值 | weekUsedSoFar + remainingDays × WMA | `formatTokens()` |
| 日均(WMA) | Weighted moving average | `formatTokens()` |
| 剩余额度 | budget - projected (can be negative) | `formatTokens()`, red if negative |

Trend badge: `ACCELERATING ▲` (red) / `STEADY →` (gray) / `DECELERATING ▼` (green)

## Status Card

Three states based on `projectedWeekTotal / weeklyTokenBudget`:

| Ratio | Label | Color | Icon | Suggestion |
|-------|-------|-------|------|------------|
| < 80% | ON TRACK | `#4ade80` green | ● | 额度充足 |
| 80%-100% | CAUTION | `#fbbf24` amber | ▲ | 考虑减少 Opus 使用 |
| > 100% | OVER BUDGET | `#ef4444` red | ◆ | 建议切换至 Haiku |

Pulsing animation on OVER BUDGET state (CSS `animate-pulse` at 2s interval).

## Component Structure

```
src/components/BudgetForecast.tsx  (~200 lines)

Imports:
  - useMemo from 'react'
  - AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ResponsiveContainer from 'recharts'
  - useTokenData from '../hooks/useTokenData'
  - useConfig from '../hooks/useConfig'
  - formatTokens from '../utils/format'

No new hooks or types needed.
Core WMA + trend logic extracted as pure functions at top of file for clarity.
Chart data construction lives in useMemo blocks.
```

## Integration

1. Import `BudgetForecast` in `App.tsx`
2. Place between TokenAnalytics and SessionLog:
   ```tsx
   {/* Module 2: Token Analytics */}
   <TokenAnalytics />
   <hr className="pixel-divider my-8" />
   {/* Module 14: Budget Forecast */}
   <BudgetForecast />
   <hr className="pixel-divider my-8" />
   {/* Module 3: Session Log */}
   ```

## Styling

- Reuse existing utilities: `pixel-border`, `bg-card-bg`, `font-pixel`, `text-text-muted`
- Stats font: JetBrains Mono 11px for numbers, pixel font 10px for labels
- Status card: 2px border matching status color, background at 10% opacity
- All colors from existing theme palette (no new color tokens)

## Testing

Manual verification:
- [ ] Chart renders with 2+ days of data
- [ ] Forecast dashed line extends to Sunday
- [ ] ±20% confidence band visible and semi-transparent
- [ ] Budget ReferenceLine at 15M
- [ ] Status correctly reflects ON TRACK / CAUTION / OVER BUDGET
- [ ] Trend badge shows correct direction
- [ ] Handles edge case: only 1 day of data → shows simple average fallback
- [ ] Handles edge case: 0 days of data → "Insufficient data" message
- [ ] Responsive: stacks vertically below md breakpoint
- [ ] `pnpm build` passes with no type errors
