# CronDashboard — DevBoard Scheduled Tasks Module

## Context

DevBoard currently tracks portfolio health, sessions, tokens, timelines, tasks, and roadmaps across 8+ projects. The `/autopilot` command and Scheduled Tasks Playbook were introduced to automate recurring checks (type checking, tests, deploy monitoring) via Claude Code's session-scoped CronCreate system.

**Problem**: Scheduled task executions are ephemeral — they exist only in session memory and leave no trace after the session ends. There's no way to review execution history, identify recurring failures, or track which autopilot modes are used.

**Solution**: Bridge the gap by logging each task execution to a JSONL file, then render the data in a new DevBoard module (CronDashboard) that shows execution history and autopilot mode templates.

## Data Schema

### JSONL Source

**File**: `~/.claude/data/cron-log.jsonl`

Each line is appended by the scheduled task prompt upon execution:

```json
{
  "date": "2026-03-15",
  "time": "17:30",
  "taskName": "tsc-check",
  "taskType": "dev",
  "project": "pixel-herbarium",
  "result": "pass",
  "detail": "no errors",
  "durationSec": 8
}
```

### TypeScript Interface

Add to `src/types.ts`:

```typescript
export type CronTaskType = 'dev' | 'monitor' | 'grind' | 'manual';
export type CronResult = 'pass' | 'fail' | 'warn' | 'info';

export interface CronLogEntry {
  date: string;
  time: string;
  taskName: string;
  taskType: CronTaskType;
  project: string;
  result: CronResult;
  detail: string;
  durationSec: number; // seconds, for computation; format at display time
}
```

### Known Task Names

| taskName | taskType | Description |
|----------|----------|-------------|
| `tsc-check` | dev | TypeScript type check |
| `test-suite` | dev | Test runner (jest/vitest) |
| `deploy-check` | monitor | Vercel deployment status |
| `pr-status` | monitor | GitHub PR review status |
| `progress-check` | grind | git diff --stat summary |
| `uncommitted-scan` | grind | Multi-project git status |
| `portfolio-freshness` | grind | Portfolio data staleness |
| `recap-reminder` | manual | Session recap prompt (used across all modes) |

## Pipeline Changes

### `scripts/convert-jsonl.js`

Add to the `files` array:

```javascript
{ input: 'cron-log.jsonl', output: 'cron-log.json' }
```

No merge logic needed — each entry is unique (unlike token-daily which merges same-date entries).

**Error isolation**: Add per-entry try/catch to the JSONL parsing loop so that one malformed cron-log entry (from LLM output) does not crash conversion of all data types. Skip invalid entries with a console warning.

### `scripts/sync-data.sh`

No change needed — `convert-jsonl.js` reads JSONL files directly from `~/.claude/data/` (not via copy). Only `convert-jsonl.js` needs the new entry.

## Hook

### `src/hooks/useCronData.ts`

```typescript
import cronData from '../data/cron-log.json';
import type { CronLogEntry } from '../types';

export function useCronData() {
  const data = cronData as CronLogEntry[];
  return { data, loading: false };
}
```

Follows the same zero-async pattern as existing hooks (`useSessionData`, `useTokenData`, `usePortfolioData`).

## Component: CronDashboard

### File: `src/components/CronDashboard.tsx`

### Layout

Two sections separated by a pixel divider:

**Section 1 — Stats Bar + Execution Log**

- **Stats bar**: Today's run count | Pass rate | Avg duration (from `durationSec`) | Fail count
- **Filter chips**: taskType (ALL / dev / monitor / grind) + result (pass / fail / warn)
- **Execution log**: Rows grouped by date, each row shows:
  - Time (HH:MM)
  - Result icon: ✓ (pass/green) | ✗ (fail/red) | ⚠ (warn/yellow) | ℹ (info/blue)
  - Task name
  - Project name (colored using existing `projectColor()` util)
  - Detail text (one-line summary)
  - Duration

**Section 2 — Autopilot Modes**

- 3 cards (dev / monitor / grind), each showing:
  - Mode name and description
  - List of tasks with intervals (⏱ icon) or one-time (🔔 icon)
  - "Last used" timestamp (derived from most recent cron-log entry matching that taskType)
  - "Total runs" count (sum of entries for that taskType)
- Data is static/hardcoded for the task list, dynamic for usage stats

### Props

```typescript
interface CronDashboardProps {
  selectedProject: string | null
}
```

When `selectedProject` is set, filter execution log to that project only. Stats recalculate for filtered view.

### Empty State

When `cron-log.json` is empty (`[]`):
- Stats bar shows all zeros
- Execution log shows: "No scheduled task executions recorded yet. Use `/autopilot` to get started."
- Autopilot modes cards still render (static data), with "Last used: —" and "Runs: 0"

### Duration Display

`durationSec` is stored as a number (seconds). Display utility:
- `< 60`: `"8s"`
- `>= 60`: `"2m 15s"`
- Average: `Math.round(sum / count)` then format

### Styling

- Pixel-art aesthetic: Press Start 2P for headings, JetBrains Mono for data
- Pixel borders on cards and stat boxes
- Color scheme: green/red/yellow/blue for result states
- Consistent with existing DevBoard components

## Integration: App.tsx

Add CronDashboard as Module 7 after SessionLog (thematic grouping — both are execution logs):

```tsx
{/* Module 7: Cron Dashboard */}
<hr className="pixel-divider my-8" />
<CronDashboard selectedProject={selectedProject} />
```

## Data Collection: autopilot.md Update

Each task prompt in `/autopilot` gets a logging suffix:

```
执行完成后，将结果以单行 JSON 追加到 ~/.claude/data/cron-log.jsonl：
{"date":"YYYY-MM-DD","time":"HH:MM","taskName":"<name>","taskType":"<type>","project":"<project>","result":"pass或fail","detail":"一行摘要","durationSec":秒数}
```

Note: `durationSec` is approximate — LLM-estimated execution time in seconds. Accuracy is best-effort.

This ensures every scheduled execution creates a persistent record.

## Playbook Update

Update `~/.claude/docs/scheduled-tasks-playbook.md` with a new section explaining the logging convention and how results appear in DevBoard.

## Files to Create/Modify

| File | Action |
|------|--------|
| `src/types.ts` | Add `CronLogEntry`, `CronTaskType`, `CronResult` |
| `src/hooks/useCronData.ts` | **Create** — data hook |
| `src/components/CronDashboard.tsx` | **Create** — main component |
| `src/data/cron-log.json` | **Create** — empty array `[]` initial, **committed to git** (required for CI build) |
| `src/App.tsx` | Add CronDashboard import + section |
| `scripts/convert-jsonl.js` | Add cron-log entry to files array |
| `scripts/convert-jsonl.js` | Add per-entry try/catch for robustness |
| `~/.claude/commands/autopilot.md` | Add logging suffix to all task prompts |
| `~/.claude/docs/scheduled-tasks-playbook.md` | Add DevBoard integration section |

## Verification

1. **Data flow**: Manually append a test entry to `cron-log.jsonl`, run `npm run sync`, verify `cron-log.json` is generated
2. **Build**: `pnpm build` succeeds with new component
3. **Visual**: Open dev server, verify CronDashboard renders with test data
4. **Filters**: Click taskType and result filters, verify log filters correctly
5. **Cross-module**: Select a project in PortfolioGrid, verify CronDashboard filters to that project
6. **End-to-end**: Run `/autopilot dev`, execute a task cycle, run sync, verify entry appears in DevBoard
