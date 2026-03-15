import { useAgentLogs } from '../hooks/useAgentLogs';
import type { CronResult } from '../types';

const RESULT_ICON: Record<CronResult, { icon: string; cls: string }> = {
  pass: { icon: '✓', cls: 'text-health-a-minus' },
  fail: { icon: '✗', cls: 'text-[#ef4444]' },
  warn: { icon: '⚠', cls: 'text-amber' },
  info: { icon: 'ℹ', cls: 'text-[#60a5fa]' },
};

const RESULT_FILTERS: Array<{ key: CronResult | null; label: string }> = [
  { key: null, label: 'ALL' },
  { key: 'pass', label: '✓ PASS' },
  { key: 'fail', label: '✗ FAIL' },
  { key: 'warn', label: '⚠ WARN' },
];

export function AgentLogViewer() {
  const {
    days,
    activeDate,
    setSelectedDate,
    activeDay,
    filteredEntries,
    filterResult,
    setFilterResult,
  } = useAgentLogs();

  if (days.length === 0) {
    return (
      <div className="pixel-border bg-card-bg p-4">
        <h2 className="font-pixel text-[10px] mb-1">AGENT LOG</h2>
        <p className="text-[10px] text-text-muted">
          暂无日志。agent-logs/ 中的 .md 文件将在 sync 后显示。
        </p>
      </div>
    );
  }

  const summary = activeDay?.summary;

  return (
    <div className="pixel-border bg-card-bg p-4">
      <h2 className="font-pixel text-[10px] mb-1">AGENT LOG</h2>
      <p className="text-[10px] text-text-muted mb-4">
        Agent 执行日志 · 自动巡检 + /loop 记录
      </p>

      {/* Date tabs */}
      <div className="flex flex-wrap gap-1 mb-3">
        {days.map((d) => (
          <button
            key={d.date}
            onClick={() => setSelectedDate(d.date)}
            className={`px-2 py-0.5 text-[10px] border ${
              activeDate === d.date
                ? 'bg-text-main text-card-bg'
                : 'border-text-muted text-text-muted hover:border-text-main'
            }`}
          >
            {d.date.slice(5)}
            {d.summary && d.summary.fail > 0 && (
              <span className="ml-1 text-[#ef4444]">·{d.summary.fail}</span>
            )}
          </button>
        ))}
      </div>

      {/* Summary card */}
      {summary && (
        <div className="flex flex-wrap gap-4 mb-4 text-[11px]">
          <div>
            <span className="text-text-muted">总执行：</span>
            <span className="font-bold">{summary.total}</span>
          </div>
          <div>
            <span className="text-health-a-minus">✓ {summary.pass}</span>
          </div>
          <div>
            <span className="text-[#ef4444]">✗ {summary.fail}</span>
          </div>
          {summary.warn > 0 && (
            <div>
              <span className="text-amber">⚠ {summary.warn}</span>
            </div>
          )}
          <div>
            <span className="text-text-muted">错峰：</span>
            <span className="text-[#60a5fa]">{summary.offPeakCount}</span>
          </div>
          <div>
            <span className="text-text-muted">白天：</span>
            <span>{summary.daytimeCount}</span>
          </div>
        </div>
      )}

      {/* Key issues */}
      {summary && summary.keyIssues.length > 0 && (
        <div className="mb-4 px-2 py-1 border border-[#ef4444] text-[10px]">
          <span className="text-[#ef4444] font-bold">关键问题：</span>
          {summary.keyIssues.map((issue, i) => (
            <span key={i} className="text-text-muted ml-1">
              {issue}
              {i < summary.keyIssues.length - 1 && ' · '}
            </span>
          ))}
        </div>
      )}

      {/* Result filter chips */}
      <div className="flex flex-wrap gap-2 mb-3">
        {RESULT_FILTERS.map((f) => (
          <button
            key={f.label}
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
      </div>

      {/* Log entries */}
      <div className="space-y-1 max-h-[300px] overflow-y-auto">
        {filteredEntries.map((entry, i) => {
          const ri = RESULT_ICON[entry.result];
          return (
            <div
              key={`${entry.time}-${i}`}
              className="flex items-start gap-2 px-2 py-1 text-[11px] border-b border-text-muted/20"
            >
              <span className="text-text-muted shrink-0 w-[38px]">[{entry.time}]</span>
              <span className={`shrink-0 w-[14px] text-center ${ri.cls}`}>{ri.icon}</span>
              <span className="text-text-main font-bold shrink-0 min-w-[120px] max-w-[180px] truncate">
                {entry.taskName}
              </span>
              <span className="text-text-muted truncate">{entry.detail}</span>
            </div>
          );
        })}
        {filteredEntries.length === 0 && (
          <p className="text-[10px] text-text-muted py-2">无匹配记录</p>
        )}
      </div>
    </div>
  );
}
