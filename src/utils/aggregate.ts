import type { TokenDailyEntry } from '../types';

export interface WeeklyEntry {
  weekStart: string;
  totalTokens: number;
  byModel: { haiku: number; sonnet: number; opus: number };
  byProject: Record<string, number>;
  sessionCount: number;
  days: number;
}

export interface MonthlyEntry {
  month: string;
  totalTokens: number;
  byModel: { haiku: number; sonnet: number; opus: number };
  byProject: Record<string, number>;
  sessionCount: number;
  days: number;
}

function getWeekStart(dateStr: string): string {
  const d = new Date(dateStr);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d.setDate(diff));
  return monday.toISOString().slice(0, 10);
}

function mergeModel(a: { haiku: number; sonnet: number; opus: number }, b: { haiku: number; sonnet: number; opus: number }) {
  return { haiku: a.haiku + b.haiku, sonnet: a.sonnet + b.sonnet, opus: a.opus + b.opus };
}

function mergeProjects(a: Record<string, number>, b: Record<string, number>): Record<string, number> {
  const result = { ...a };
  for (const [k, v] of Object.entries(b)) result[k] = (result[k] ?? 0) + v;
  return result;
}

export function aggregateByWeek(daily: TokenDailyEntry[]): WeeklyEntry[] {
  const map = new Map<string, WeeklyEntry>();
  for (const d of daily) {
    const ws = getWeekStart(d.date);
    const existing = map.get(ws);
    if (existing) {
      existing.totalTokens += d.totalTokens;
      existing.byModel = mergeModel(existing.byModel, d.byModel);
      existing.byProject = mergeProjects(existing.byProject, d.byProject);
      existing.sessionCount += d.sessionCount;
      existing.days += 1;
    } else {
      map.set(ws, {
        weekStart: ws,
        totalTokens: d.totalTokens,
        byModel: { ...d.byModel },
        byProject: { ...d.byProject },
        sessionCount: d.sessionCount,
        days: 1,
      });
    }
  }
  return Array.from(map.values()).sort((a, b) => a.weekStart.localeCompare(b.weekStart));
}

export function aggregateByMonth(daily: TokenDailyEntry[]): MonthlyEntry[] {
  const map = new Map<string, MonthlyEntry>();
  for (const d of daily) {
    const month = d.date.slice(0, 7);
    const existing = map.get(month);
    if (existing) {
      existing.totalTokens += d.totalTokens;
      existing.byModel = mergeModel(existing.byModel, d.byModel);
      existing.byProject = mergeProjects(existing.byProject, d.byProject);
      existing.sessionCount += d.sessionCount;
      existing.days += 1;
    } else {
      map.set(month, {
        month,
        totalTokens: d.totalTokens,
        byModel: { ...d.byModel },
        byProject: { ...d.byProject },
        sessionCount: d.sessionCount,
        days: 1,
      });
    }
  }
  return Array.from(map.values()).sort((a, b) => a.month.localeCompare(b.month));
}
