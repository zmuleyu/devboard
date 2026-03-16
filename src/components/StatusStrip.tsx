import { useMemo } from 'react';
import { usePortfolioData } from '../hooks/usePortfolioData';
import { useCronData } from '../hooks/useCronData';
import { useTokenData } from '../hooks/useTokenData';
import { calcDailyCost } from '../utils/cost';
import { formatTokens } from '../utils/format';

export function StatusStrip() {
  const { data: portfolio } = usePortfolioData();
  const { data: cronLog } = useCronData();
  const { data: tokenDaily } = useTokenData();

  const stats = useMemo(() => {
    // Count TODOs across projects
    const todoCount = portfolio.projects.filter(p => p.topTodo && p.topTodo !== '-').length;

    // Cron: count unique tasks seen in logs
    const uniqueTasks = new Set(cronLog.map(e => e.taskName));
    const totalTasks = 8; // Known total from claude-cron config

    // Today's token consumption
    const today = new Date().toISOString().slice(0, 10);
    const todayEntry = tokenDaily.find(e => e.date === today);
    const todayTokens = todayEntry?.totalTokens ?? 0;
    const todayCost = todayEntry ? calcDailyCost(todayEntry.byModel).total : 0;

    // Alerts: uncommitted changes + health warnings
    const alertCount = portfolio.projects.filter(
      p => p.uncommittedChanges > 0 || p.healthTrend === '\u2193'
    ).length;

    return { todoCount, activeTasks: uniqueTasks.size, totalTasks, todayTokens, todayCost, alertCount };
  }, [portfolio, cronLog, tokenDaily]);

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
      <StatusCard
        icon="\u{1F4CB}"
        value={String(stats.todoCount)}
        label="\u5F85\u529E\u4E8B\u9879"
        sub={`\u8DE8 ${stats.todoCount} \u4E2A\u9879\u76EE`}
        color="#86efac"
      />
      <StatusCard
        icon="\u23F0"
        value={`${stats.activeTasks}/${stats.totalTasks}`}
        label="Cron \u6D3B\u8DC3"
        sub="\u67E5\u770B\u5B9A\u65F6\u4EFB\u52A1 \u2192"
        color="#fbbf24"
      />
      <StatusCard
        icon="\u{1F4CA}"
        value={formatTokens(stats.todayTokens)}
        label="\u4ECA\u65E5 Token"
        sub={`\u2248 $${stats.todayCost.toFixed(2)}`}
        color="#818cf8"
      />
      <StatusCard
        icon="\u26A0\uFE0F"
        value={String(stats.alertCount)}
        label="\u9700\u5173\u6CE8"
        sub={stats.alertCount > 0 ? '\u5C55\u5F00\u67E5\u770B\u8BE6\u60C5' : '\u4E00\u5207\u6B63\u5E38'}
        color={stats.alertCount > 0 ? '#f87171' : '#86efac'}
      />
    </div>
  );
}

function StatusCard({ icon, value, label, sub, color }: {
  icon: string; value: string; label: string; sub: string; color: string;
}) {
  return (
    <div
      className="pixel-border bg-card-bg p-3 text-center"
      style={{ borderLeftColor: color, borderLeftWidth: 3 }}
    >
      <div className="text-base mb-1">{icon}</div>
      <div className="font-pixel text-[14px] text-text-main">{value}</div>
      <div className="text-[10px] text-text-muted mt-1">{label}</div>
      <div className="text-[9px] mt-1" style={{ color }}>{sub}</div>
    </div>
  );
}
