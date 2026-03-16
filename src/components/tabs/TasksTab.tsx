import { useMemo } from 'react';
import { useCronData } from '../../hooks/useCronData';
import { useTaskConfig } from '../../hooks/useTaskConfig';
import { TaskManager } from '../TaskManager';
import { ExecutionLog } from '../ExecutionLog';

export default function TasksTab() {
  const { data: cronLog } = useCronData();
  const { data: taskConfig } = useTaskConfig();

  const summaryStats = useMemo(() => {
    const activeTasks = taskConfig.filter(t => t.enabled).length;
    const totalTasks = taskConfig.length;

    // 7-day pass rate
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const recentLogs = cronLog.filter(e => e.date >= weekAgo);
    const passRate = recentLogs.length > 0
      ? Math.round((recentLogs.filter(e => e.result === 'pass').length / recentLogs.length) * 100)
      : 0;

    // Failed tasks today
    const today = now.toISOString().slice(0, 10);
    const failedToday = cronLog.filter(e => e.date === today && e.result === 'fail');

    return { activeTasks, totalTasks, passRate, failedToday };
  }, [cronLog, taskConfig]);

  return (
    <>
      {/* Summary Strip */}
      <div className="pixel-border bg-card-bg p-3 mb-6 flex flex-wrap items-center gap-4 text-[11px]">
        <span className="text-text-muted">
          {'任务: '}
          <span className="font-bold text-text-main">{summaryStats.activeTasks}</span>
          {' 活跃 / '}{summaryStats.totalTasks}{' 总'}
        </span>
        <span className="text-grid-dot">{'\u00B7'}</span>
        <span className="text-text-muted">
          {'通过率: '}
          <span
            className="font-bold"
            style={{ color: summaryStats.passRate >= 80 ? '#86efac' : '#fbbf24' }}
          >
            {summaryStats.passRate}%
          </span>
          {' (7天)'}
        </span>
        {summaryStats.failedToday.length > 0 && (
          <>
            <span className="text-grid-dot">{'\u00B7'}</span>
            <span style={{ color: '#f87171' }}>
              {'\u26A0 '}{summaryStats.failedToday.map(f => f.taskName).join(', ')}{' 今日失败'}
            </span>
          </>
        )}
      </div>

      <TaskManager />
      <hr className="pixel-divider my-8" />
      <ExecutionLog />
    </>
  );
}
