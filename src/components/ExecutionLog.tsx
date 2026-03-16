import { useState, useMemo, useCallback } from 'react';
import { useCronData } from '../hooks/useCronData';
import { formatDuration } from '../utils/format';
import type { CronResult, CronSource } from '../types';

const RESULT_STYLE: Record<CronResult, { icon: string; cls: string; border: string }> = {
  pass:  { icon: '\u2713', cls: 'text-health-a-minus',  border: 'border-l-health-a-minus' },
  fail:  { icon: '\u2717', cls: 'text-[#ef4444]',       border: 'border-l-[#ef4444]' },
  warn:  { icon: '\u26A0', cls: 'text-amber',           border: 'border-l-amber' },
  info:  { icon: '\u2139', cls: 'text-[#60a5fa]',       border: 'border-l-[#60a5fa]' },
  crash: { icon: '\uD83D\uDCA5', cls: 'text-[#ef4444]', border: 'border-l-[#ef4444]' },
};

const SOURCE_LABEL: Record<CronSource, string> = {
  cron: 'CRON',
  persistent: 'PERSIST',
  session: 'SESSION',
  loop: 'LOOP',
};

const RESULT_FILTERS: Array<{ key: CronResult | 'all'; label: string }> = [
  { key: 'all',  label: 'ALL' },
  { key: 'fail', label: '\u2717 FAIL' },
  { key: 'warn', label: '\u26A0 WARN' },
  { key: 'pass', label: '\u2713 PASS' },
];

export function ExecutionLog() {
  const { data: cronLog, loading } = useCronData();
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [filterResult, setFilterResult] = useState<CronResult | 'all'>('all');

  // Derive available dates from cron log
  const availableDates = useMemo(() => {
    const dateSet = new Set<string>();
    for (const entry of cronLog) {
      dateSet.add(entry.date);
    }
    return [...dateSet].sort((a, b) => b.localeCompare(a));
  }, [cronLog]);

  const activeDate = selectedDate ?? availableDates[0] ?? null;

  // Filtered entries for active date
  const filteredEntries = useMemo(() => {
    if (!activeDate) return [];
    const dayEntries = cronLog
      .filter((e) => e.date === activeDate)
      .sort((a, b) => b.time.localeCompare(a.time));

    if (filterResult === 'all') return dayEntries;
    return dayEntries.filter((e) => e.result === filterResult);
  }, [cronLog, activeDate, filterResult]);

  // Day label
  const dayLabel = useCallback((date: string) => {
    const today = new Date().toISOString().slice(0, 10);
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    if (date === today) return 'Today';
    if (date === yesterday) return 'Yest';
    return date.slice(5);
  }, []);

  // Fail count per date for badge
  const dateFailCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const entry of cronLog) {
      if (entry.result === 'fail' || entry.result === 'crash') {
        counts[entry.date] = (counts[entry.date] ?? 0) + 1;
      }
    }
    return counts;
  }, [cronLog]);

  // Export handler
  const handleExport = useCallback(() => {
    if (!activeDate) return;
    const entries = cronLog.filter((e) => e.date === activeDate);
    const blob = new Blob([JSON.stringify(entries, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `execution-log-${activeDate}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [cronLog, activeDate]);

  if (loading) {
    return (
      <div className="pixel-border bg-card-bg p-4">
        <h2 className="font-pixel text-[10px] mb-1">EXECUTION LOG</h2>
        <p className="text-[10px] text-text-muted">Loading...</p>
      </div>
    );
  }

  if (cronLog.length === 0) {
    return (
      <div className="pixel-border bg-card-bg p-4">
        <h2 className="font-pixel text-[10px] mb-1">EXECUTION LOG</h2>
        <p className="text-[10px] text-text-muted">
          No execution logs yet. Cron tasks will appear here after first run.
        </p>
      </div>
    );
  }

  return (
    <div className="pixel-border bg-card-bg p-4">
      <div className="flex items-center justify-between mb-1">
        <h2 className="font-pixel text-[10px]">EXECUTION LOG</h2>
        <button
          onClick={handleExport}
          className="px-2 py-0.5 text-[9px] border border-text-muted text-text-muted hover:border-text-main hover:text-text-main transition-colors"
        >
          EXPORT
        </button>
      </div>
      <p className="text-[10px] text-text-muted mb-4">
        Cron 执行历史 · {cronLog.length} 条记录 · {availableDates.length} 天
      </p>

      {/* Date tabs */}
      <div className="flex flex-wrap gap-1 mb-3">
        {availableDates.slice(0, 14).map((date) => (
          <button
            key={date}
            onClick={() => setSelectedDate(date)}
            className={`px-2 py-0.5 text-[10px] border ${
              activeDate === date
                ? 'bg-text-main text-card-bg'
                : 'border-text-muted text-text-muted hover:border-text-main'
            }`}
          >
            {dayLabel(date)}
            {(dateFailCounts[date] ?? 0) > 0 && (
              <span className="ml-1 text-[#ef4444]">{'\u00B7'}{dateFailCounts[date]}</span>
            )}
          </button>
        ))}
      </div>

      {/* Result filter chips */}
      <div className="flex flex-wrap gap-2 mb-3">
        {RESULT_FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilterResult(f.key)}
            className={`px-2 py-0.5 text-[10px] border ${
              filterResult === f.key
                ? 'bg-text-main text-card-bg'
                : 'border-text-muted text-text-muted'
            }`}
          >
            {f.label}
          </button>
        ))}
        <span className="text-[10px] text-text-muted ml-auto">
          {filteredEntries.length} entries
        </span>
      </div>

      {/* Log entries */}
      <div className="space-y-1 max-h-[350px] overflow-y-auto">
        {filteredEntries.map((entry, i) => {
          const rs = RESULT_STYLE[entry.result] ?? RESULT_STYLE.info;
          const isFail = entry.result === 'fail' || entry.result === 'crash';

          return (
            <div
              key={`${entry.date}-${entry.time}-${i}`}
              className={`border-l-2 ${rs.border} px-2 py-1.5 text-[11px] ${
                isFail ? 'bg-[#ef4444]/5' : ''
              }`}
            >
              <div className="flex items-center gap-2">
                {/* Time */}
                <span className="text-text-muted shrink-0 w-[38px] font-mono">{entry.time}</span>

                {/* Result icon */}
                <span className={`shrink-0 w-[14px] text-center ${rs.cls}`}>{rs.icon}</span>

                {/* Task name */}
                <span className="text-text-main font-bold shrink-0 min-w-[100px] max-w-[140px] truncate">
                  {entry.taskName}
                </span>

                {/* Result badge */}
                <span
                  className={`shrink-0 px-1 py-0 text-[8px] border ${rs.cls}`}
                  style={{ borderColor: 'currentColor', opacity: 0.8 }}
                >
                  {entry.result.toUpperCase()}
                </span>

                {/* Source */}
                {entry.source && (
                  <span className="shrink-0 text-[8px] text-text-muted px-1 border border-text-muted/30">
                    {SOURCE_LABEL[entry.source] ?? entry.source}
                  </span>
                )}

                {/* Off-peak indicator */}
                {entry.isOffPeak && (
                  <span className="shrink-0 text-[9px] text-[#3b82f6]" title="off-peak">
                    {'\uD83C\uDF19'}
                  </span>
                )}

                {/* Duration */}
                <span className="text-text-muted shrink-0 ml-auto text-[10px]">
                  {formatDuration(entry.durationSec)}
                </span>

                {/* Budget cap */}
                {entry.budgetCap != null && entry.budgetCap > 0 && (
                  <span className="text-text-muted shrink-0 text-[9px]">
                    ${entry.budgetCap.toFixed(2)}
                  </span>
                )}
              </div>

              {/* Detail text */}
              <div className={`ml-[54px] mt-0.5 text-[10px] ${isFail ? 'text-[#ef4444]/80' : 'text-text-muted'}`}>
                {entry.detail}
              </div>

              {/* Project */}
              {entry.project && entry.project !== 'unknown' && (
                <div className="ml-[54px] text-[9px] text-text-muted/60 mt-0.5">
                  project: {entry.project}
                </div>
              )}
            </div>
          );
        })}
        {filteredEntries.length === 0 && (
          <p className="text-[10px] text-text-muted py-4 text-center">
            No matching entries for this date/filter
          </p>
        )}
      </div>
    </div>
  );
}
