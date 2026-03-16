# Weekly Digest 2026-03-16

> Period: 2026-03-09 → 2026-03-16

## Cron Executions

- **Total: 9** | Pass: 2 | Fail: 1 | Warn: 6

| Task | Runs | Pass | Fail | Warn |
|------|------|------|------|------|
| tsc-check | 4 | 2 | 1 | 1 |
| changelog-gen | 3 | 0 | 0 | 3 |
| guard-backup | 1 | 0 | 0 | 1 |
| content-freshness | 1 | 0 | 0 | 1 |

**Failures:**
- `[03:30] tsc-check / ai_projects` — 1 type error in `region-configs/route.test.ts` (self-healed by 03:55)

**Warnings (all "budget exceeded or max turns reached"):**
- `[11:14] tsc-check` — budget exhausted before completion
- `[12:20] changelog-gen` — budget exceeded (attempt 1)
- `[12:24] changelog-gen` — budget exceeded (attempt 2)
- `[12:29] changelog-gen` — budget exceeded (attempt 3, 3 consecutive fails)
- `[13:31] guard-backup` — budget exceeded
- `[13:33] content-freshness` — budget exceeded

## Token Usage

> Source: token-daily.jsonl — entries from 2026-03-15 and 2026-03-16 only (earlier days have no data)

| Date | Total Tokens | Sessions |
|------|-------------|---------|
| 2026-03-15 | 42,800,000 | 19 |
| 2026-03-16 | 18,600,000 | 11 |
| **Week Total** | **61,400,000** | **30** |

**By Model (week):**
- Opus: 42,600,000 tokens (~69%)
- Sonnet: 18,800,000 tokens (~31%)
- Haiku: 0 tokens

**Cost Estimate (input pricing only):**
- Opus @ $15/1M: ~$639
- Sonnet @ $3/1M: ~$56
- **Estimated Total: ~$695** *(likely over-reported; token-daily.jsonl may aggregate cross-session duplicates)*

**By Project (combined 2 days):**
- devboard: 21,350,000
- ziyou-chrome: 5,000,000
- ai_projects: 3,300,000
- pixel-herbarium: 4,100,000 (+ 2,500,000)
- Data_management: 5,100,000
- ziyou-server: 1,900,000
- scrapling-mcp: 3,400,000
- claude-cron: 550,000

## Project Activity (commits this week)

| Project | Commits |
|---------|---------|
| ai_projects | 318 |
| pixel-herbarium | 116 |
| Data_management | 77 |
| devboard | 69 |
| ziyou-server | 47 |
| scrapling-mcp | 27 |

## Alerts

- **[HIGH] changelog-gen budget exhaustion × 3 in a row** — Task consistently hitting budget ceiling. Fix: increase budget to $1.00+ and turns to 15+ per lesson [2026-03-16] in lessons.md.
- **[HIGH] guard-backup + content-freshness budget exceeded** — These tasks also need budget review. Check register-tasks.ps1 Arguments fields.
- **[WARN] tsc-check also hit budget limit** at 11:14 — despite being a simple check. Possible runaway context.
- **[INFO] tsc-check self-healed** — type error at 03:30 fixed by 03:55; no manual intervention needed.
- **[INFO] Token data only covers 2 days** — token-daily.jsonl missing entries before 2026-03-15; data gap may affect cost accuracy.
- **[INFO] All 6 projects active** — no stale projects with 0 commits this week.
