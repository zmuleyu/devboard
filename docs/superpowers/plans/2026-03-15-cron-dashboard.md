# CronDashboard Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a CronDashboard module to DevBoard that displays scheduled task execution history and autopilot mode templates, powered by a new JSONL data pipeline.

**Architecture:** Extends the existing JSONL → JSON → Hook → Component pattern. A new `cron-log.jsonl` file is consumed by the existing `convert-jsonl.js` pipeline (with added error isolation), loaded via a `useCronData` hook, and rendered in a `CronDashboard` component integrated as Module 7 in App.tsx. The `/autopilot` command is updated to log execution results.

**Tech Stack:** React 19, TypeScript, Tailwind CSS 4, Vite 6

---

## Chunk 1: Data Layer (Types + Pipeline + Hook + Seed Data)

### Task 1: Add types to `src/types.ts`

**Files:**
- Modify: `src/types.ts:72` (append after `TokenDailyEntry`)

- [ ] **Step 1: Add CronLogEntry types**

Append at end of `src/types.ts`:

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
  durationSec: number;
}
```

- [ ] **Step 2: Verify types compile**

Run: `cd /d/projects/devboard && npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/types.ts
git commit -m "feat: add CronLogEntry types for scheduled task logging"
```

---

### Task 2: Add error isolation + cron-log entry to `scripts/convert-jsonl.js`

**Files:**
- Modify: `scripts/convert-jsonl.js:8-12` (files array)
- Modify: `scripts/convert-jsonl.js:23-26` (parsing loop)

- [ ] **Step 1: Add cron-log to files array**

In `scripts/convert-jsonl.js`, add to the `files` array (line 11, before the closing `]`):

```javascript
  { input: 'cron-log.jsonl', output: 'cron-log.json' },
```

- [ ] **Step 2: Add per-entry try/catch to parsing loop**

Replace lines 23-26:
```javascript
  let lines = readFileSync(inputPath, 'utf-8')
    .split('\n')
    .filter((l) => l.trim())
    .map((l) => JSON.parse(l));
```

With:
```javascript
  const rawLines = readFileSync(inputPath, 'utf-8')
    .split('\n')
    .filter((l) => l.trim());
  let lines = [];
  for (const l of rawLines) {
    try {
      lines.push(JSON.parse(l));
    } catch (e) {
      console.warn(`  warn: skipped malformed line in ${input}: ${l.slice(0, 80)}`);
    }
  }
```

- [ ] **Step 3: Create seed JSONL file for testing**

Create `~/.claude/data/cron-log.jsonl` with sample entries:

```bash
cat >> ~/.claude/data/cron-log.jsonl << 'EOF'
{"date":"2026-03-15","time":"17:00","taskName":"tsc-check","taskType":"dev","project":"pixel-herbarium","result":"pass","detail":"no errors","durationSec":8}
{"date":"2026-03-15","time":"17:07","taskName":"test-suite","taskType":"dev","project":"pixel-herbarium","result":"pass","detail":"165 tests passed","durationSec":7}
{"date":"2026-03-15","time":"17:30","taskName":"tsc-check","taskType":"dev","project":"pixel-herbarium","result":"pass","detail":"no errors","durationSec":8}
{"date":"2026-03-15","time":"16:30","taskName":"tsc-check","taskType":"dev","project":"ai_projects","result":"fail","detail":"3 type errors in admin/page.tsx","durationSec":12}
{"date":"2026-03-15","time":"16:07","taskName":"test-suite","taskType":"dev","project":"ai_projects","result":"pass","detail":"207 tests passed","durationSec":9}
{"date":"2026-03-15","time":"15:30","taskName":"deploy-check","taskType":"monitor","project":"ai_projects","result":"warn","detail":"deployment building...","durationSec":2}
EOF
```

- [ ] **Step 4: Run sync and verify conversion**

Run: `cd /d/projects/devboard && npm run sync`
Expected: Output includes `done: cron-log.jsonl → cron-log.json (6 entries)`

Verify: `cat src/data/cron-log.json` shows 6 entries as a JSON array.

- [ ] **Step 5: Commit**

```bash
git add scripts/convert-jsonl.js src/data/cron-log.json
git commit -m "feat: add cron-log to JSONL pipeline with error isolation"
```

---

### Task 3: Create initial empty `src/data/cron-log.json` and hook

**Files:**
- Create: `src/data/cron-log.json` (if not created by Task 2 sync)
- Create: `src/hooks/useCronData.ts`

- [ ] **Step 1: Ensure cron-log.json exists**

If Task 2 sync didn't create it, create `src/data/cron-log.json`:
```json
[]
```

- [ ] **Step 2: Create useCronData hook**

Create `src/hooks/useCronData.ts`:

```typescript
import cronData from '../data/cron-log.json';
import type { CronLogEntry } from '../types';

export function useCronData() {
  const data = cronData as CronLogEntry[];
  return { data, loading: false };
}
```

- [ ] **Step 3: Verify build**

Run: `cd /d/projects/devboard && npx tsc --noEmit`
Expected: No errors

- [ ] **Step 4: Commit**

```bash
git add src/data/cron-log.json src/hooks/useCronData.ts
git commit -m "feat: add useCronData hook for scheduled task data"
```

---

### Task 4: Add `formatDuration` utility

**Files:**
- Modify: `src/utils/format.ts` (append)

- [ ] **Step 1: Add formatDuration function**

Append to `src/utils/format.ts`:

```typescript
export function formatDuration(sec: number): string {
  if (sec < 60) return `${sec}s`;
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return s > 0 ? `${m}m ${s}s` : `${m}m`;
}
```

- [ ] **Step 2: Verify build**

Run: `cd /d/projects/devboard && npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/utils/format.ts
git commit -m "feat: add formatDuration utility for cron dashboard"
```

---

## Chunk 2: CronDashboard Component

### Task 5: Create CronDashboard component

**Files:**
- Create: `src/components/CronDashboard.tsx`

- [ ] **Step 1: Create the component**

Create `src/components/CronDashboard.tsx`:

```tsx
import { useMemo, useState } from 'react';
import { useCronData } from '../hooks/useCronData';
import { projectColor } from '../theme';
import { formatDuration } from '../utils/format';
import type { CronTaskType, CronResult } from '../types';

const RESULT_ICON: Record<CronResult, { icon: string; cls: string }> = {
  pass: { icon: '✓', cls: 'text-health-a-minus' },
  fail: { icon: '✗', cls: 'text-[#ef4444]' },
  warn: { icon: '⚠', cls: 'text-amber' },
  info: { icon: 'ℹ', cls: 'text-[#60a5fa]' },
};

const TASK_TYPE_LABELS: Record<CronTaskType, string> = {
  dev: 'DEV',
  monitor: 'MONITOR',
  grind: 'GRIND',
  manual: 'MANUAL',
};

const AUTOPILOT_MODES = [
  {
    type: 'dev' as CronTaskType,
    label: 'dev',
    desc: '日常开发',
    tasks: [
      { name: 'tsc-check', interval: '30m', recurring: true },
      { name: 'test-suite', interval: '1h', recurring: true },
      { name: 'recap-reminder', interval: '3h', recurring: false },
    ],
  },
  {
    type: 'monitor' as CronTaskType,
    label: 'monitor',
    desc: '等待 CI/CD',
    tasks: [
      { name: 'deploy-check', interval: '10m', recurring: true },
      { name: 'pr-status', interval: '30m', recurring: true },
      { name: 'build-reminder', interval: '1h', recurring: false },
    ],
  },
  {
    type: 'grind' as CronTaskType,
    label: 'grind',
    desc: '密集开发',
    tasks: [
      { name: 'progress-check', interval: '15m', recurring: true },
      { name: 'uncommitted-scan', interval: '1h', recurring: true },
      { name: 'portfolio-freshness', interval: '2h', recurring: true },
      { name: 'recap-reminder', interval: '4h', recurring: false },
    ],
  },
];

interface CronDashboardProps {
  selectedProject: string | null;
}

export function CronDashboard({ selectedProject }: CronDashboardProps) {
  const { data } = useCronData();
  const [filterType, setFilterType] = useState<CronTaskType | null>(null);
  const [filterResult, setFilterResult] = useState<CronResult | null>(null);

  const filtered = useMemo(() => {
    return data.filter((d) => {
      if (selectedProject && d.project !== selectedProject) return false;
      if (filterType && d.taskType !== filterType) return false;
      if (filterResult && d.result !== filterResult) return false;
      return true;
    });
  }, [data, selectedProject, filterType, filterResult]);

  const today = new Date().toISOString().slice(0, 10);

  const stats = useMemo(() => {
    const todayEntries = filtered.filter((d) => d.date === today);
    const passCount = todayEntries.filter((d) => d.result === 'pass').length;
    const failCount = todayEntries.filter((d) => d.result === 'fail').length;
    const totalDuration = todayEntries.reduce((s, d) => s + d.durationSec, 0);
    const avgDuration = todayEntries.length > 0 ? Math.round(totalDuration / todayEntries.length) : 0;
    const passRate = todayEntries.length > 0 ? Math.round((passCount / todayEntries.length) * 100) : 0;
    return { runs: todayEntries.length, passRate, avgDuration, failCount };
  }, [filtered, today]);

  // Group by date, sorted descending
  const groupedByDate = useMemo(() => {
    const groups: Record<string, typeof filtered> = {};
    for (const entry of filtered) {
      (groups[entry.date] ??= []).push(entry);
    }
    return Object.entries(groups)
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([date, entries]) => ({
        date,
        entries: entries.sort((a, b) => b.time.localeCompare(a.time)),
      }));
  }, [filtered]);

  // Mode stats from full data (not filtered)
  const modeStats = useMemo(() => {
    const result: Record<string, { lastUsed: string; runs: number }> = {};
    for (const mode of AUTOPILOT_MODES) {
      const modeEntries = data.filter((d) => d.taskType === mode.type);
      const lastEntry = modeEntries.sort((a, b) =>
        `${b.date}T${b.time}`.localeCompare(`${a.date}T${a.time}`)
      )[0];
      result[mode.type] = {
        lastUsed: lastEntry ? `${lastEntry.date} ${lastEntry.time}` : '—',
        runs: modeEntries.length,
      };
    }
    return result;
  }, [data]);

  const typeFilters: Array<{ key: CronTaskType | null; label: string }> = [
    { key: null, label: 'ALL' },
    { key: 'dev', label: 'DEV' },
    { key: 'monitor', label: 'MON' },
    { key: 'grind', label: 'GRIND' },
  ];

  const resultFilters: Array<{ key: CronResult | null; label: string }> = [
    { key: 'pass', label: '✓' },
    { key: 'fail', label: '✗' },
    { key: 'warn', label: '⚠' },
  ];

  return (
    <div className="pixel-border bg-card-bg p-4">
      <h2 className="font-pixel text-[10px] mb-1">定时任务</h2>
      <p className="text-[10px] text-text-muted mb-4">计划任务执行历史与 Autopilot 模式概览</p>

      {/* Stats bar */}
      <div className="flex flex-wrap gap-4 mb-4 text-[11px]">
        <div><span className="text-text-muted">今日：</span><span className="font-bold">{stats.runs} 次</span></div>
        <div><span className="text-text-muted">通过率：</span><span className="font-bold">{stats.passRate}%</span></div>
        <div><span className="text-text-muted">平均耗时：</span><span className="font-bold">{formatDuration(stats.avgDuration)}</span></div>
        <div><span className="text-text-muted">失败：</span><span className="font-bold text-[#ef4444]">{stats.failCount}</span></div>
      </div>

      {/* Filter chips */}
      <div className="flex flex-wrap gap-2 mb-4">
        {typeFilters.map((f) => (
          <button
            key={f.label}
            onClick={() => setFilterType(f.key)}
            className={`px-2 py-0.5 text-[10px] border ${
              filterType === f.key ? 'bg-text-main text-card-bg' : 'border-text-muted text-text-muted'
            }`}
          >
            {f.label}
          </button>
        ))}
        <span className="text-text-muted text-[10px] mx-1">|</span>
        {resultFilters.map((f) => (
          <button
            key={f.label}
            onClick={() => setFilterResult(filterResult === f.key ? null : f.key)}
            className={`px-2 py-0.5 text-[10px] border ${
              filterResult === f.key ? 'bg-text-main text-card-bg' : 'border-text-muted text-text-muted'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Execution log */}
      {groupedByDate.length === 0 ? (
        <p className="text-[11px] text-text-muted py-4 text-center">
          No scheduled task executions recorded yet. Use /autopilot to get started.
        </p>
      ) : (
        <div className="space-y-3 max-h-[300px] overflow-y-auto">
          {groupedByDate.map(({ date, entries }) => (
            <div key={date}>
              <div className="text-[10px] text-text-muted font-pixel mb-1">{date}</div>
              <div className="space-y-0.5">
                {entries.map((entry, i) => {
                  const ri = RESULT_ICON[entry.result];
                  return (
                    <div key={`${date}-${i}`} className="flex items-center gap-2 text-[11px] py-0.5">
                      <span className="text-text-muted w-[36px] shrink-0">{entry.time}</span>
                      <span className={`w-[14px] shrink-0 ${ri.cls}`}>{ri.icon}</span>
                      <span className="w-[120px] shrink-0 truncate">{entry.taskName}</span>
                      <span
                        className="w-[110px] shrink-0 truncate"
                        style={{ color: projectColor(entry.project) }}
                      >
                        {entry.project}
                      </span>
                      <span className="text-text-muted truncate flex-1">{entry.detail}</span>
                      <span className="text-text-muted w-[32px] shrink-0 text-right">
                        {formatDuration(entry.durationSec)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Autopilot Modes */}
      <hr className="border-text-muted/20 my-4" />
      <h3 className="font-pixel text-[9px] text-text-muted mb-3">AUTOPILOT MODES</h3>
      <div className="grid grid-cols-3 gap-3">
        {AUTOPILOT_MODES.map((mode) => {
          const ms = modeStats[mode.type];
          return (
            <div key={mode.type} className="border border-text-muted/30 p-2">
              <div className="font-pixel text-[9px] mb-1">{mode.label}</div>
              <div className="text-[10px] text-text-muted mb-2">{mode.desc}</div>
              <div className="space-y-0.5 text-[10px] mb-2">
                {mode.tasks.map((t) => (
                  <div key={t.name} className="flex items-center gap-1">
                    <span>{t.recurring ? '⏱' : '🔔'}</span>
                    <span className="truncate">{t.name}</span>
                    <span className="text-text-muted ml-auto">{t.interval}</span>
                  </div>
                ))}
              </div>
              <div className="text-[9px] text-text-muted">
                Last: {ms?.lastUsed ?? '—'} · Runs: {ms?.runs ?? 0}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify build**

Run: `cd /d/projects/devboard && npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/components/CronDashboard.tsx
git commit -m "feat: add CronDashboard component with execution log and mode cards"
```

---

## Chunk 3: Integration + Autopilot Update

### Task 6: Integrate CronDashboard into App.tsx

**Files:**
- Modify: `src/App.tsx:5` (imports)
- Modify: `src/App.tsx:53-55` (after SessionLog module)

- [ ] **Step 1: Add import**

Add after line 5 (`import { SessionLog }...`):
```typescript
import { CronDashboard } from './components/CronDashboard';
```

- [ ] **Step 2: Add module section**

After the Module 3 (SessionLog) closing section (line 55, after the `<hr>`), insert:

```tsx
        {/* Module 7: Cron Dashboard */}
        <CronDashboard selectedProject={selectedProject} />

        <hr className="pixel-divider my-8" />
```

Note: This replaces the existing `<hr>` between SessionLog and Timeline — the new module sits between them with dividers on both sides.

- [ ] **Step 3: Update version in footer**

Change `v0.3.0` to `v0.4.0` in the footer (line 73):
```tsx
DEVBOARD v0.4.0 · built with Vite + React + Tailwind
```

- [ ] **Step 4: Verify build**

Run: `cd /d/projects/devboard && pnpm build`
Expected: Build succeeds

- [ ] **Step 5: Visual check**

Run: `cd /d/projects/devboard && pnpm dev`
Expected: CronDashboard renders between SessionLog and Timeline with seed data showing 6 entries.

- [ ] **Step 6: Commit**

```bash
git add src/App.tsx
git commit -m "feat: integrate CronDashboard as Module 7 in App.tsx"
```

---

### Task 7: Update `/autopilot` command with logging suffix

**Files:**
- Modify: `~/.claude/commands/autopilot.md`

- [ ] **Step 1: Add logging instructions to each mode's tasks**

For each task in `dev`, `monitor`, and `grind` modes, append this logging instruction to the task description:

```
After execution, append a single-line JSON to ~/.claude/data/cron-log.jsonl:
{"date":"YYYY-MM-DD","time":"HH:MM","taskName":"<name>","taskType":"<mode>","project":"<current project name>","result":"pass or fail","detail":"one-line summary","durationSec":<estimated seconds>}
```

For example, the **dev** mode Type check becomes:

```
1. **Type check** (every 30m): Run `pnpm tsc --noEmit` in the current project directory. Report only if there are errors. After execution, append a single-line JSON to ~/.claude/data/cron-log.jsonl: {"date":"YYYY-MM-DD","time":"HH:MM","taskName":"tsc-check","taskType":"dev","project":"<current project name>","result":"pass or fail","detail":"one-line summary","durationSec":<estimated seconds>}
```

Apply the same pattern to all 10 tasks across all 3 modes, using the correct `taskName` and `taskType` values from the Known Task Names table in the spec.

- [ ] **Step 2: Add a logging note to the Notes section**

Append to the Notes section:
```
- Each task logs its execution result to ~/.claude/data/cron-log.jsonl for DevBoard visualization
```

- [ ] **Step 3: Commit**

Not applicable (file is outside git repo, in `~/.claude/commands/`)

---

### Task 8: Update Playbook with DevBoard integration section

**Files:**
- Modify: `~/.claude/docs/scheduled-tasks-playbook.md`

- [ ] **Step 1: Add DevBoard integration section**

Append before the appendices:

```markdown
---

## 5. DevBoard 集成

定时任务执行后会自动将结果记录到 `~/.claude/data/cron-log.jsonl`，通过 DevBoard 的数据管道同步到 CronDashboard 模块显示。

### 日志格式
每次执行后追加一行：
```json
{"date":"2026-03-15","time":"17:30","taskName":"tsc-check","taskType":"dev","project":"pixel-herbarium","result":"pass","detail":"no errors","durationSec":8}
```

### 查看方式
1. 运行 `cd /d/projects/devboard && npm run sync` 同步数据
2. 打开 DevBoard（devboard-jade.vercel.app）查看 CronDashboard 模块
3. 或等待每天 23:00 Task Scheduler 自动同步

### 手动记录
不使用 `/autopilot` 时，也可以在任意定时任务 prompt 末尾加上日志指令来记录执行结果。
```

- [ ] **Step 2: Not a git repo file — no commit needed**

---

## Verification Checklist

- [ ] `npx tsc --noEmit` passes
- [ ] `pnpm build` succeeds
- [ ] DevBoard dev server renders CronDashboard with seed data
- [ ] Filter chips (taskType + result) filter correctly
- [ ] selectedProject prop filters execution log
- [ ] Empty state renders when `cron-log.json` is `[]`
- [ ] Stats bar shows correct today counts
- [ ] Autopilot mode cards show correct "Last used" and "Runs" from data
- [ ] `npm run sync` converts `cron-log.jsonl` → `cron-log.json` correctly
- [ ] Malformed JSONL line is skipped with warning (not crash)
