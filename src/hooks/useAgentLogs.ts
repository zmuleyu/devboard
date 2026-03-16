import { useState, useEffect, useMemo, useCallback } from 'react';
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

export function useAgentLogs() {
  const [days, setDays] = useState<AgentLogDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [filterProject, setFilterProject] = useState<string | null>(null);
  const [filterResult, setFilterResult] = useState<CronResult | null>(null);

  const refresh = useCallback(async () => {
    try {
      const indexRes = await fetch('/data/agent-logs/index.json');
      const filenames: string[] = await indexRes.json();

      const parsed: AgentLogDay[] = [];
      for (const filename of filenames) {
        try {
          const res = await fetch(`/data/agent-logs/${filename}`);
          const raw = await res.text();
          parsed.push(parseLogContent(filename, raw));
        } catch {
          // Skip files that fail to load
        }
      }

      parsed.sort((a, b) => b.date.localeCompare(a.date));
      setDays(parsed);
    } catch {
      // Index fetch failed
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    const handler = () => { if (document.visibilityState === 'visible') refresh(); };
    document.addEventListener('visibilitychange', handler);
    return () => document.removeEventListener('visibilitychange', handler);
  }, [refresh]);

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
    loading,
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
