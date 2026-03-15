import { useState, useMemo } from 'react';
import type { CronResult } from '../types';

export interface AgentLogEntry {
  time: string;
  taskName: string;
  result: CronResult;
  detail: string;
}

export interface DailySummary {
  total: number;
  pass: number;
  fail: number;
  warn: number;
  offPeakCount: number;
  daytimeCount: number;
  keyIssues: string[];
}

export interface AgentLogDay {
  date: string;
  entries: AgentLogEntry[];
  summary: DailySummary | null;
}

// Parse a single log line: [HH:MM] taskName | result | detail
const LOG_RE = /^\[(\d{2}:\d{2})\]\s+(.+?)\s+\|\s+(pass|fail|warn|info)\s+\|\s+(.+)$/;

function parseLogContent(filename: string, raw: string): AgentLogDay {
  const date = filename.replace('.md', '');
  const entries: AgentLogEntry[] = [];
  let summary: DailySummary | null = null;

  const lines = raw.split('\n');
  let inSummary = false;

  for (const line of lines) {
    const m = line.match(LOG_RE);
    if (m) {
      entries.push({
        time: m[1],
        taskName: m[2],
        result: m[3] as CronResult,
        detail: m[4],
      });
      continue;
    }
    if (line.includes('每日摘要') || line.includes('Daily Summary')) {
      inSummary = true;
      continue;
    }
    if (inSummary && line.startsWith('- 总执行')) {
      const nums = line.match(/\d+/g);
      if (nums && nums.length >= 4) {
        summary = {
          total: Number(nums[0]),
          pass: Number(nums[1]),
          fail: Number(nums[2]),
          warn: nums.length > 3 ? Number(nums[3]) : 0,
          offPeakCount: 0,
          daytimeCount: 0,
          keyIssues: [],
        };
      }
    }
    if (inSummary && line.startsWith('- 错峰')) {
      const n = line.match(/\d+/);
      if (n && summary) summary.offPeakCount = Number(n[0]);
    }
    if (inSummary && line.startsWith('- 白天') && summary) {
      const n = line.match(/\d+/);
      if (n) summary.daytimeCount = Number(n[0]);
    }
    if (inSummary && line.startsWith('- 关键问题') && summary) {
      summary.keyIssues.push(line.replace(/^- 关键问题[:：]\s*/, ''));
    }
  }

  // Auto-generate summary if not present in file
  if (!summary && entries.length > 0) {
    const pass = entries.filter((e) => e.result === 'pass').length;
    const fail = entries.filter((e) => e.result === 'fail').length;
    const warn = entries.filter((e) => e.result === 'warn').length;
    const offPeak = entries.filter((e) => {
      const h = parseInt(e.time.split(':')[0], 10);
      return h >= 1 && h < 7;
    }).length;
    summary = {
      total: entries.length,
      pass,
      fail,
      warn,
      offPeakCount: offPeak,
      daytimeCount: entries.length - offPeak,
      keyIssues: entries.filter((e) => e.result === 'fail').map((e) => e.detail),
    };
  }

  return { date, entries, summary };
}

// Import all .md files from data/agent-logs/ at build time
const logModules = import.meta.glob('../data/agent-logs/*.md', { query: '?raw', import: 'default', eager: true }) as Record<string, string>;

export function useAgentLogs() {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [filterProject, setFilterProject] = useState<string | null>(null);
  const [filterResult, setFilterResult] = useState<CronResult | null>(null);

  const days = useMemo(() => {
    const parsed: AgentLogDay[] = [];
    for (const [path, raw] of Object.entries(logModules)) {
      const filename = path.split('/').pop() ?? '';
      if (!filename.endsWith('.md')) continue;
      parsed.push(parseLogContent(filename, raw));
    }
    // Sort by date descending
    parsed.sort((a, b) => b.date.localeCompare(a.date));
    return parsed;
  }, []);

  const activeDate = selectedDate ?? days[0]?.date ?? null;
  const activeDay = days.find((d) => d.date === activeDate) ?? null;

  const filteredEntries = useMemo(() => {
    if (!activeDay) return [];
    return activeDay.entries.filter((e) => {
      if (filterProject && !e.detail.toLowerCase().includes(filterProject.toLowerCase())) return false;
      if (filterResult && e.result !== filterResult) return false;
      return true;
    });
  }, [activeDay, filterProject, filterResult]);

  return {
    days,
    activeDate,
    setSelectedDate,
    activeDay,
    filteredEntries,
    filterProject,
    setFilterProject,
    filterResult,
    setFilterResult,
  };
}
