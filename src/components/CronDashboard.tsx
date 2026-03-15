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
