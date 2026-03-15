import { useMemo, useState } from 'react';
import { usePortfolioData } from '../hooks/usePortfolioData';
import { projectColor } from '../theme';
import { daysSince } from '../utils/format';

interface Alert {
  project: string;
  message: string;
  level: 'error' | 'warning';
}

export function AlertBanner() {
  const { data } = usePortfolioData();
  const [expanded, setExpanded] = useState(false);

  const alerts = useMemo(() => {
    const result: Alert[] = [];
    const today = new Date();

    for (const p of data.projects) {
      if (p.status === 'completed') continue;

      if (p.healthTrend === '↓') {
        result.push({ project: p.name, message: `健康度下滑（${p.health}）· 趋势 ↓`, level: 'warning' });
      }

      const days = daysSince(p.lastCommitDate);
      if (days > 14 && p.status !== 'paused') {
        result.push({ project: p.name, message: `${days}天无提交`, level: 'warning' });
      }

      if (p.timeline?.target) {
        const target = new Date(p.timeline.target);
        const diff = Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        if (diff < 0) {
          result.push({ project: p.name, message: `目标日期已过 (${p.timeline.target.slice(5)}) · 超期${Math.abs(diff)}天`, level: 'error' });
        } else if (diff <= 7) {
          result.push({ project: p.name, message: `目标日期临近 (${p.timeline.target.slice(5)}) · 剩余${diff}天`, level: 'warning' });
        }
      }

      if (p.uncommittedChanges >= 5) {
        result.push({ project: p.name, message: `${p.uncommittedChanges}处未提交变更`, level: 'warning' });
      }
    }

    // Sort: errors first
    return result.sort((a, b) => (a.level === 'error' ? -1 : 1) - (b.level === 'error' ? -1 : 1));
  }, [data.projects]);

  if (alerts.length === 0) return null;

  return (
    <div className="pixel-border bg-card-bg p-3 mb-2">
      <div
        className="flex items-center justify-between cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <span className="font-pixel text-[11px]" style={{ color: '#e8834a' }}>
          ⚠ {alerts.length} 项需关注
        </span>
        <span className="text-[11px] text-text-muted">
          {expanded ? '收起 ▴' : '展开 ▾'}
        </span>
      </div>

      {expanded && (
        <div className="mt-3 pt-3 border-t-2 border-dashed border-grid-dot space-y-1.5">
          {alerts.map((alert, i) => (
            <div key={i} className="flex items-center gap-3 text-[12px]">
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: alert.level === 'error' ? '#ef4444' : '#fbbf24' }}
              />
              <span
                className="font-bold text-[11px] shrink-0"
                style={{ color: projectColor(alert.project), minWidth: 110 }}
              >
                {alert.project}
              </span>
              <span className="text-text-muted text-[11px]">{alert.message}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
