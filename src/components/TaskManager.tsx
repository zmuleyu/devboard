import { useState, useMemo } from 'react';
import { useCronData } from '../hooks/useCronData';
import { useTaskConfig } from '../hooks/useTaskConfig';
import type { TaskConfig } from '../hooks/useTaskConfig';
import type { CronLogEntry, CronResult } from '../types';
import { formatDuration } from '../utils/format';

const RESULT_DOT: Record<CronResult, { color: string; label: string }> = {
  pass:  { color: '#86efac', label: 'PASS' },
  fail:  { color: '#ef4444', label: 'FAIL' },
  warn:  { color: '#fbbf24', label: 'WARN' },
  info:  { color: '#60a5fa', label: 'INFO' },
  crash: { color: '#ef4444', label: 'CRASH' },
};

interface TaskStats {
  totalRuns: number;
  passRate: number;
  avgDuration: number;
  consecutivePass: number;
  consecutiveFail: number;
  lastResult: CronResult | null;
  lastRunTime: string | null;
  heatmap: Array<{ date: string; total: number; pass: number; fail: number }>;
}

function computeTaskStats(taskName: string, cronLog: CronLogEntry[]): TaskStats {
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const weekAgoStr = weekAgo.toISOString().slice(0, 10);

  // Match task entries (case-insensitive, also matches partial names)
  const taskEntries = cronLog.filter(
    (e) => e.taskName.toLowerCase() === taskName.toLowerCase()
      || e.taskName.toLowerCase().replace(/[\s-]/g, '') === taskName.toLowerCase().replace(/[\s-]/g, '')
  );
  const recentEntries = taskEntries.filter((e) => e.date >= weekAgoStr);

  // Sort by time descending for consecutive counting
  const sorted = [...taskEntries].sort(
    (a, b) => `${b.date}T${b.time}`.localeCompare(`${a.date}T${a.time}`)
  );

  // Consecutive pass/fail from most recent
  let consecutivePass = 0;
  let consecutiveFail = 0;
  if (sorted.length > 0) {
    const firstResult = sorted[0].result;
    if (firstResult === 'pass') {
      for (const e of sorted) {
        if (e.result === 'pass') consecutivePass++;
        else break;
      }
    } else if (firstResult === 'fail' || firstResult === 'crash') {
      for (const e of sorted) {
        if (e.result === 'fail' || e.result === 'crash') consecutiveFail++;
        else break;
      }
    }
  }

  // 7-day heatmap
  const heatmap: Array<{ date: string; total: number; pass: number; fail: number }> = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().slice(0, 10);
    const dayEntries = recentEntries.filter((e) => e.date === dateStr);
    heatmap.push({
      date: dateStr,
      total: dayEntries.length,
      pass: dayEntries.filter((e) => e.result === 'pass').length,
      fail: dayEntries.filter((e) => e.result === 'fail' || e.result === 'crash').length,
    });
  }

  const passCount = recentEntries.filter((e) => e.result === 'pass').length;
  const totalDuration = recentEntries.reduce((s, e) => s + e.durationSec, 0);

  return {
    totalRuns: recentEntries.length,
    passRate: recentEntries.length > 0 ? Math.round((passCount / recentEntries.length) * 100) : 0,
    avgDuration: recentEntries.length > 0 ? Math.round(totalDuration / recentEntries.length) : 0,
    consecutivePass,
    consecutiveFail,
    lastResult: sorted[0]?.result ?? null,
    lastRunTime: sorted[0] ? `${sorted[0].date} ${sorted[0].time}` : null,
    heatmap,
  };
}

function HeatmapRow({ heatmap }: { heatmap: TaskStats['heatmap'] }) {
  return (
    <div className="flex items-end gap-0.5">
      {heatmap.map((day) => {
        const bg = day.total === 0
          ? 'bg-text-muted/10'
          : day.fail > 0
            ? 'bg-[#ef4444]/60'
            : 'bg-health-a-minus/60';
        return (
          <div key={day.date} className="flex flex-col items-center gap-0.5">
            <div
              className={`w-5 h-3 ${bg}`}
              title={`${day.date}: ${day.pass}p / ${day.fail}f / ${day.total}t`}
            />
            <div className="text-[7px] text-text-muted">{day.date.slice(8)}</div>
          </div>
        );
      })}
    </div>
  );
}

function TaskDetail({ task, stats }: { task: TaskConfig; stats: TaskStats }) {
  return (
    <div className="flex-1 min-w-0">
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <span
          className="w-2.5 h-2.5 inline-block shrink-0"
          style={{
            backgroundColor: task.enabled
              ? (stats.lastResult ? RESULT_DOT[stats.lastResult].color : '#86efac')
              : '#706858',
          }}
        />
        <h3 className="font-pixel text-[12px] text-text-main">{task.name}</h3>
        <span className={`text-[9px] px-1.5 py-0.5 border ${
          task.enabled ? 'border-health-a-minus/40 text-health-a-minus' : 'border-text-muted/40 text-text-muted'
        }`}>
          {task.enabled ? 'ENABLED' : 'DISABLED'}
        </span>
      </div>

      {/* Goal */}
      <div className="mb-3">
        <div className="font-pixel text-[8px] text-text-muted mb-1">GOAL</div>
        <p className="text-[11px] text-text-main leading-relaxed">{task.goal}</p>
      </div>

      {/* Execution */}
      <div className="mb-3">
        <div className="font-pixel text-[8px] text-text-muted mb-1">EXECUTION</div>
        <p className="text-[10px] text-text-muted font-mono">{task.execution}</p>
      </div>

      {/* Schedule info */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div>
          <div className="font-pixel text-[8px] text-text-muted mb-1">SCHEDULE</div>
          <p className="text-[11px] text-text-main">{task.schedule}</p>
          <p className="text-[9px] text-text-muted mt-0.5">{task.scheduleReason}</p>
        </div>
        <div>
          <div className="font-pixel text-[8px] text-text-muted mb-1">BUDGET</div>
          <p className="text-[11px] text-text-main">{task.budgetPerRun}</p>
        </div>
      </div>

      {/* 7-day stats */}
      <div className="border border-text-muted/20 p-3 mb-3">
        <div className="font-pixel text-[8px] text-text-muted mb-2">7-DAY STATS</div>
        <div className="flex flex-wrap gap-4 text-[10px] mb-3">
          <div>
            <span className="text-text-muted">Runs: </span>
            <span className="font-bold text-text-main">{stats.totalRuns}</span>
          </div>
          <div>
            <span className="text-text-muted">Pass rate: </span>
            <span
              className="font-bold"
              style={{ color: stats.passRate >= 80 ? '#86efac' : stats.passRate >= 50 ? '#fbbf24' : '#ef4444' }}
            >
              {stats.passRate}%
            </span>
          </div>
          <div>
            <span className="text-text-muted">Avg: </span>
            <span className="font-bold text-text-main">{formatDuration(stats.avgDuration)}</span>
          </div>
          {stats.consecutivePass > 1 && (
            <div>
              <span className="text-health-a-minus">{stats.consecutivePass}x pass streak</span>
            </div>
          )}
          {stats.consecutiveFail > 0 && (
            <div>
              <span className="text-[#ef4444]">{stats.consecutiveFail}x fail streak</span>
            </div>
          )}
        </div>

        {/* Heatmap */}
        <div className="font-pixel text-[7px] text-text-muted mb-1">HEATMAP (7d)</div>
        <HeatmapRow heatmap={stats.heatmap} />
      </div>

      {/* Last execution */}
      {stats.lastRunTime && (
        <div className="text-[10px] text-text-muted">
          Last run: <span className="text-text-main">{stats.lastRunTime}</span>
          {stats.lastResult && (
            <span
              className="ml-2 px-1 py-0.5 text-[9px] border"
              style={{
                borderColor: RESULT_DOT[stats.lastResult].color + '66',
                color: RESULT_DOT[stats.lastResult].color,
              }}
            >
              {RESULT_DOT[stats.lastResult].label}
            </span>
          )}
        </div>
      )}
      {!stats.lastRunTime && (
        <div className="text-[10px] text-text-muted">No execution history</div>
      )}
    </div>
  );
}

export function TaskManager() {
  const { data: taskConfig, loading: configLoading } = useTaskConfig();
  const { data: cronLog, loading: cronLoading } = useCronData();
  const [selectedTask, setSelectedTask] = useState<string | null>(null);
  const [showDisabled, setShowDisabled] = useState(true);

  // Compute stats per task
  const taskStats = useMemo(() => {
    const map: Record<string, TaskStats> = {};
    for (const task of taskConfig) {
      map[task.name] = computeTaskStats(task.name, cronLog);
    }
    return map;
  }, [taskConfig, cronLog]);

  // Sort: failed tasks first, then enabled, then disabled
  const sortedTasks = useMemo(() => {
    return [...taskConfig].sort((a, b) => {
      const statsA = taskStats[a.name];
      const statsB = taskStats[b.name];
      const aFailed = statsA?.lastResult === 'fail' || statsA?.lastResult === 'crash';
      const bFailed = statsB?.lastResult === 'fail' || statsB?.lastResult === 'crash';
      if (aFailed && !bFailed) return -1;
      if (!aFailed && bFailed) return 1;
      if (a.enabled && !b.enabled) return -1;
      if (!a.enabled && b.enabled) return 1;
      return 0;
    });
  }, [taskConfig, taskStats]);

  const enabledTasks = sortedTasks.filter((t) => t.enabled);
  const disabledTasks = sortedTasks.filter((t) => !t.enabled);

  // Auto-select first task
  const activeTaskName = selectedTask ?? sortedTasks[0]?.name ?? null;
  const activeTask = taskConfig.find((t) => t.name === activeTaskName) ?? null;
  const activeStats = activeTaskName ? taskStats[activeTaskName] : null;

  if (configLoading || cronLoading) {
    return (
      <div className="pixel-border bg-card-bg p-4">
        <h2 className="font-pixel text-[10px] mb-1">TASK MANAGER</h2>
        <p className="text-[10px] text-text-muted">Loading...</p>
      </div>
    );
  }

  if (taskConfig.length === 0) {
    return (
      <div className="pixel-border bg-card-bg p-4">
        <h2 className="font-pixel text-[10px] mb-1">TASK MANAGER</h2>
        <p className="text-[10px] text-text-muted">No task config loaded. Add task-config.json to data/.</p>
      </div>
    );
  }

  return (
    <div className="pixel-border bg-card-bg p-4">
      <h2 className="font-pixel text-[10px] mb-1">TASK MANAGER</h2>
      <p className="text-[10px] text-text-muted mb-4">
        {enabledTasks.length} 活跃 · {disabledTasks.length} 待启用 · 选择任务查看详情
      </p>

      <div className="flex gap-4" style={{ minHeight: 280 }}>
        {/* Left: Task list */}
        <div className="w-[200px] shrink-0 border-r border-text-muted/20 pr-3 space-y-0.5 overflow-y-auto" style={{ maxHeight: 400 }}>
          {/* Enabled tasks */}
          {enabledTasks.map((task) => {
            const stats = taskStats[task.name];
            const isFailed = stats?.lastResult === 'fail' || stats?.lastResult === 'crash';
            const isActive = activeTaskName === task.name;
            return (
              <button
                key={task.name}
                onClick={() => setSelectedTask(task.name)}
                className={`w-full text-left px-2 py-1.5 text-[10px] border transition-colors ${
                  isActive
                    ? 'bg-text-main/10 border-text-main/30'
                    : 'border-transparent hover:border-text-muted/20'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <span
                    className={`w-2 h-2 shrink-0 ${isFailed ? 'animate-pulse' : ''}`}
                    style={{
                      backgroundColor: isFailed
                        ? '#ef4444'
                        : stats?.lastResult
                          ? RESULT_DOT[stats.lastResult].color
                          : '#86efac',
                    }}
                  />
                  <span className={`truncate ${isActive ? 'text-text-main font-bold' : 'text-text-main'}`}>
                    {task.name}
                  </span>
                </div>
                <div className="text-[8px] text-text-muted mt-0.5 ml-3.5">
                  {task.schedule}
                  {stats && stats.totalRuns > 0 && (
                    <span className="ml-1">
                      · {stats.passRate}%
                    </span>
                  )}
                </div>
              </button>
            );
          })}

          {/* Disabled tasks section */}
          {disabledTasks.length > 0 && (
            <>
              <button
                onClick={() => setShowDisabled(!showDisabled)}
                className="w-full text-left px-2 py-1 text-[9px] text-text-muted font-pixel mt-2 hover:text-text-main"
              >
                {showDisabled ? '- ' : '+ '}DISABLED ({disabledTasks.length})
              </button>
              {showDisabled && disabledTasks.map((task) => {
                const isActive = activeTaskName === task.name;
                return (
                  <button
                    key={task.name}
                    onClick={() => setSelectedTask(task.name)}
                    className={`w-full text-left px-2 py-1.5 text-[10px] border transition-colors ${
                      isActive
                        ? 'bg-text-main/10 border-text-main/30'
                        : 'border-transparent hover:border-text-muted/20'
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 shrink-0 bg-text-muted/40" />
                      <span className={`truncate ${isActive ? 'text-text-muted font-bold' : 'text-text-muted'}`}>
                        {task.name}
                      </span>
                    </div>
                    <div className="text-[8px] text-text-muted/60 mt-0.5 ml-3.5">
                      {task.schedule}
                    </div>
                  </button>
                );
              })}
            </>
          )}
        </div>

        {/* Right: Detail panel */}
        <div className="flex-1 min-w-0 pl-1">
          {activeTask && activeStats ? (
            <TaskDetail task={activeTask} stats={activeStats} />
          ) : (
            <div className="flex items-center justify-center h-full text-[11px] text-text-muted">
              Select a task to view details
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
