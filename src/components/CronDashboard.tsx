import { useMemo, useState } from 'react';
import { useCronData } from '../hooks/useCronData';
import { useHealthStatus } from '../hooks/useHealthStatus';
import { projectColor } from '../theme';
import { formatDuration } from '../utils/format';
import type { CronTaskType, CronResult, CronSource } from '../types';

const RESULT_ICON: Record<CronResult, { icon: string; cls: string }> = {
  pass: { icon: '✓', cls: 'text-health-a-minus' },
  fail: { icon: '✗', cls: 'text-[#ef4444]' },
  warn: { icon: '⚠', cls: 'text-amber' },
  info: { icon: 'ℹ', cls: 'text-[#60a5fa]' },
  crash: { icon: '💥', cls: 'text-[#ef4444]' },
};

const SOURCE_ICON: Record<CronSource, string> = {
  cron: '⏰',
  persistent: '📌',
  session: '💬',
  loop: '🔁',
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
  {
    type: 'patrol' as CronTaskType,
    label: 'patrol',
    desc: '错峰巡检',
    tasks: [
      { name: 'tsc-check', interval: '全项目', recurring: true },
      { name: 'test-suite', interval: '全项目', recurring: true },
      { name: 'pr-review', interval: '周一三五', recurring: true },
      { name: 'data-sync', interval: '每日', recurring: true },
    ],
  },
];

interface CronDashboardProps {
  selectedProject: string | null;
}

export function CronDashboard({ selectedProject }: CronDashboardProps) {
  const { data } = useCronData();
  const health = useHealthStatus();
  const [filterType, setFilterType] = useState<CronTaskType | null>(null);
  const [filterResult, setFilterResult] = useState<CronResult | null>(null);
  const [filterTask, setFilterTask] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return data.filter((d) => {
      if (selectedProject && d.project !== selectedProject) return false;
      if (filterType && d.taskType !== filterType) return false;
      if (filterResult && d.result !== filterResult) return false;
      if (filterTask && d.taskName !== filterTask) return false;
      return true;
    });
  }, [data, selectedProject, filterType, filterResult, filterTask]);

  const today = new Date().toISOString().slice(0, 10);

  const stats = useMemo(() => {
    const todayEntries = filtered.filter((d) => d.date === today);
    const passCount = todayEntries.filter((d) => d.result === 'pass').length;
    const failCount = todayEntries.filter((d) => d.result === 'fail').length;
    const totalDuration = todayEntries.reduce((s, d) => s + d.durationSec, 0);
    const avgDuration = todayEntries.length > 0 ? Math.round(totalDuration / todayEntries.length) : 0;
    const passRate = todayEntries.length > 0 ? Math.round((passCount / todayEntries.length) * 100) : 0;
    const budgetCapTotal = todayEntries.reduce((s, d) => s + (d.budgetCap ?? 0), 0);
    return { runs: todayEntries.length, passRate, avgDuration, failCount, budgetCapTotal };
  }, [filtered, today]);

  const heatmap = useMemo(() => {
    const days: Array<{ date: string; total: number; pass: number; fail: number; rate: number }> = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().slice(0, 10);
      const dayEntries = data.filter((e) => e.date === dateStr);
      const pass = dayEntries.filter((e) => e.result === 'pass').length;
      const fail = dayEntries.filter((e) => e.result === 'fail' || e.result === 'crash').length;
      const total = dayEntries.length;
      const rate = total > 0 ? pass / total : -1;
      days.push({ date: dateStr, total, pass, fail, rate });
    }
    return days;
  }, [data]);

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

  const modeStats = useMemo(() => {
    const result: Record<string, { lastUsed: string; runs: number }> = {};
    for (const mode of AUTOPILOT_MODES) {
      const modeEntries = data.filter((d) => d.taskType === mode.type);
      const lastEntry = [...modeEntries].sort((a, b) =>
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
    { key: 'patrol', label: 'PATROL' },
    { key: 'data-sync', label: 'SYNC' },
    { key: 'pr-review', label: 'PR' },
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

      {/* Health status bar */}
      <div className={`flex items-center gap-2 mb-3 px-2 py-1 text-[10px] border ${
        health.issues.length === 0 ? 'border-health-a-minus/40 bg-health-a-minus/10' : 'border-[#ef4444]/40 bg-[#ef4444]/10'
      }`}>
        <span className={health.issues.length === 0 ? 'text-health-a-minus' : 'text-[#ef4444]'}>
          {health.issues.length === 0 ? '●' : '▲'}
        </span>
        <span>{health.issues.length === 0 ? 'System OK' : `${health.issues.length} issue${health.issues.length > 1 ? 's' : ''}`}</span>
        <span className="text-text-muted">·</span>
        <span className="text-text-muted">Auth: {health.claudeAuth}</span>
        <span className="text-text-muted">·</span>
        <span className="text-text-muted">Last exec: {health.lastExecAge} ago</span>
        {health.issues.length > 0 && (
          <span className="text-[#ef4444] ml-auto">{health.issues.join(' · ')}</span>
        )}
      </div>

      {/* 7-day heatmap */}
      <div className="flex items-end gap-1 mb-3">
        {heatmap.map((day) => {
          const bg = day.total === 0
            ? 'bg-text-muted/10'
            : day.rate >= 0.8
              ? 'bg-health-a-minus/60'
              : day.rate >= 0.5
                ? 'bg-amber/60'
                : 'bg-[#ef4444]/60';
          return (
            <div key={day.date} className="flex flex-col items-center gap-0.5">
              <div className="text-[8px] text-text-muted">{day.total || '·'}</div>
              <div className={`w-6 h-4 ${bg}`} title={`${day.date}: ${day.pass}/${day.total} pass`} />
              <div className="text-[8px] text-text-muted">{day.date.slice(8)}</div>
            </div>
          );
        })}
        <span className="text-[8px] text-text-muted ml-2">7d</span>
      </div>

      {/* Stats bar */}
      <div className="flex flex-wrap gap-4 mb-4 text-[11px]">
        <div><span className="text-text-muted">今日：</span><span className="font-bold">{stats.runs} 次</span></div>
        <div><span className="text-text-muted">通过率：</span><span className="font-bold">{stats.passRate}%</span></div>
        <div><span className="text-text-muted">平均耗时：</span><span className="font-bold">{formatDuration(stats.avgDuration)}</span></div>
        <div><span className="text-text-muted">失败：</span><span className="font-bold text-[#ef4444]">{stats.failCount}</span></div>
        {stats.budgetCapTotal > 0 && (
          <div><span className="text-text-muted">预算上限：</span><span className="font-bold">${stats.budgetCapTotal.toFixed(2)}</span></div>
        )}
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
        {filterTask && (
          <>
            <span className="text-text-muted text-[10px] mx-1">|</span>
            <button
              onClick={() => setFilterTask(null)}
              className="px-2 py-0.5 text-[10px] border bg-text-main text-card-bg"
            >
              {filterTask} ✕
            </button>
          </>
        )}
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
                  const ri = RESULT_ICON[entry.result] ?? RESULT_ICON.info;
                  const srcIcon = entry.source ? SOURCE_ICON[entry.source] ?? '' : '';
                  return (
                    <div key={`${date}-${i}`} className="flex items-center gap-2 text-[11px] py-0.5">
                      <span className="text-text-muted w-[36px] shrink-0">{entry.time}</span>
                      <span className={`w-[14px] shrink-0 ${ri.cls}`}>{ri.icon}</span>
                      {srcIcon && <span className="w-[14px] shrink-0 text-[10px]" title={entry.source}>{srcIcon}</span>}
                      {entry.isOffPeak && <span className="w-[14px] shrink-0 text-[10px] text-[#3b82f6]" title="off-peak">🌙</span>}
                      <button
                        className="w-[120px] shrink-0 truncate text-left hover:underline"
                        onClick={() => setFilterTask(filterTask === entry.taskName ? null : entry.taskName)}
                      >
                        {entry.taskName}
                      </button>
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
      <div className="grid grid-cols-4 gap-3">
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
