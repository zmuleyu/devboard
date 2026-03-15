import { useMemo, useState } from 'react';
import { useUsageData } from '../hooks/useUsageData';
import { MODEL_COLORS } from '../theme';

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const DAYS = ['日', '一', '二', '三', '四', '五', '六'];

// US ET peak hours mapped to CST: 20:00-02:00 CST = peak
function isPeakHour(hour: number): boolean {
  return hour >= 20 || hour < 2;
}

function formatHour(h: number): string {
  return `${h.toString().padStart(2, '0')}:00`;
}

export function UsageDashboard() {
  const { data } = useUsageData();
  const [viewMode, setViewMode] = useState<'heatmap' | 'stats'>('heatmap');

  // Parse session starts into hour-of-day buckets
  const hourlyDistribution = useMemo(() => {
    const counts = new Array(24).fill(0);
    const offPeakCounts = new Array(24).fill(0);
    for (const entry of data) {
      if (entry.event !== 'start') continue;
      const hour = parseInt(entry.tsCN.split('T')[1]?.split(':')[0] ?? '0');
      counts[hour]++;
      if (entry.offPeak) offPeakCounts[hour]++;
    }
    return { counts, offPeakCounts };
  }, [data]);

  // Day-of-week distribution
  const weekdayDistribution = useMemo(() => {
    const counts = new Array(7).fill(0);
    for (const entry of data) {
      if (entry.event !== 'start') continue;
      const date = new Date(entry.ts);
      counts[date.getDay()]++;
    }
    return counts;
  }, [data]);

  // Model distribution
  const modelDistribution = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const entry of data) {
      if (entry.event !== 'start') continue;
      const model = entry.model.replace('claude-', '').split('-')[0] || 'unknown';
      counts[model] = (counts[model] || 0) + 1;
    }
    return counts;
  }, [data]);

  // Summary stats
  const stats = useMemo(() => {
    const starts = data.filter(e => e.event === 'start');
    const totalSessions = starts.length;
    const offPeakSessions = starts.filter(e => e.offPeak).length;
    const offPeakRate = totalSessions > 0 ? Math.round((offPeakSessions / totalSessions) * 100) : 0;

    // Most active hour
    const maxHourIdx = hourlyDistribution.counts.indexOf(Math.max(...hourlyDistribution.counts));

    // Last 7 days sessions
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recent = starts.filter(e => new Date(e.ts) >= sevenDaysAgo).length;

    // Unique projects
    const projects = new Set(starts.map(e => {
      const parts = e.cwd.replace(/\\/g, '/').split('/');
      return parts[parts.length - 1] || parts[parts.length - 2] || 'unknown';
    }));

    return {
      totalSessions,
      offPeakRate,
      peakHour: formatHour(maxHourIdx),
      recentSessions: recent,
      uniqueProjects: projects.size,
    };
  }, [data, hourlyDistribution]);

  // 5h window estimation
  const windowInfo = useMemo(() => {
    const starts = data.filter(e => e.event === 'start').sort((a, b) => a.ts.localeCompare(b.ts));
    if (starts.length === 0) return null;

    const lastStart = new Date(starts[starts.length - 1].ts);
    const windowEnd = new Date(lastStart.getTime() + 5 * 60 * 60 * 1000);
    const now = new Date();

    if (now < windowEnd) {
      const remainMs = windowEnd.getTime() - now.getTime();
      const remainH = Math.floor(remainMs / 3600000);
      const remainM = Math.floor((remainMs % 3600000) / 60000);
      return { active: true, remaining: `${remainH}h ${remainM}m`, resetTime: windowEnd.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }) };
    }
    return { active: false, remaining: 'ready', resetTime: '' };
  }, [data]);

  const maxCount = Math.max(...hourlyDistribution.counts, 1);

  if (data.length === 0) {
    return (
      <section>
        <h2 className="section-title">USAGE TRACKER</h2>
        <div className="pixel-card p-4 text-center text-text-muted text-[11px]">
          暂无用量数据。新 session 开始后会自动采集。
        </div>
      </section>
    );
  }

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <h2 className="section-title">USAGE TRACKER</h2>
        <div className="flex gap-2">
          <button
            className={`px-2 py-0.5 text-[10px] border ${viewMode === 'heatmap' ? 'border-amber text-amber' : 'border-border text-text-muted'}`}
            onClick={() => setViewMode('heatmap')}
          >
            HEATMAP
          </button>
          <button
            className={`px-2 py-0.5 text-[10px] border ${viewMode === 'stats' ? 'border-amber text-amber' : 'border-border text-text-muted'}`}
            onClick={() => setViewMode('stats')}
          >
            STATS
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
        <div className="pixel-card p-3 text-center">
          <div className="text-[18px] font-pixel text-amber">{stats.totalSessions}</div>
          <div className="text-[9px] text-text-muted mt-1">TOTAL SESSIONS</div>
        </div>
        <div className="pixel-card p-3 text-center">
          <div className="text-[18px] font-pixel text-green">{stats.offPeakRate}%</div>
          <div className="text-[9px] text-text-muted mt-1">OFF-PEAK RATE</div>
        </div>
        <div className="pixel-card p-3 text-center">
          <div className="text-[18px] font-pixel text-purple">{stats.peakHour}</div>
          <div className="text-[9px] text-text-muted mt-1">MOST ACTIVE</div>
        </div>
        <div className="pixel-card p-3 text-center">
          <div className="text-[18px] font-pixel text-text-main">{stats.recentSessions}</div>
          <div className="text-[9px] text-text-muted mt-1">LAST 7 DAYS</div>
        </div>
        <div className="pixel-card p-3 text-center">
          {windowInfo ? (
            <>
              <div className={`text-[18px] font-pixel ${windowInfo.active ? 'text-amber' : 'text-green'}`}>
                {windowInfo.active ? windowInfo.remaining : 'READY'}
              </div>
              <div className="text-[9px] text-text-muted mt-1">
                {windowInfo.active ? `RESETS ${windowInfo.resetTime}` : '5H WINDOW'}
              </div>
            </>
          ) : (
            <>
              <div className="text-[18px] font-pixel text-text-muted">--</div>
              <div className="text-[9px] text-text-muted mt-1">5H WINDOW</div>
            </>
          )}
        </div>
      </div>

      {viewMode === 'heatmap' ? (
        /* 24h Heatmap */
        <div className="pixel-card p-4">
          <div className="text-[10px] text-text-muted mb-3">
            24H SESSION DISTRIBUTION (CST)
            <span className="ml-3">
              <span className="inline-block w-2 h-2 mr-1" style={{ backgroundColor: '#86efac' }} />off-peak
              <span className="inline-block w-2 h-2 ml-2 mr-1" style={{ backgroundColor: '#ef4444' }} />peak
            </span>
          </div>
          <div className="grid grid-cols-24 gap-[2px]">
            {HOURS.map(h => {
              const count = hourlyDistribution.counts[h];
              const intensity = count / maxCount;
              const peak = isPeakHour(h);
              const bg = count === 0
                ? '#1a1a2e'
                : peak
                  ? `rgba(239, 68, 68, ${0.2 + intensity * 0.8})`
                  : `rgba(134, 239, 172, ${0.2 + intensity * 0.8})`;
              return (
                <div key={h} className="flex flex-col items-center">
                  <div
                    className="w-full aspect-square rounded-sm"
                    style={{ backgroundColor: bg }}
                    title={`${formatHour(h)}: ${count} sessions${peak ? ' (peak)' : ' (off-peak)'}`}
                  />
                  {h % 3 === 0 && (
                    <span className="text-[7px] text-text-muted mt-1">{h.toString().padStart(2, '0')}</span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Day-of-week mini bars */}
          <div className="mt-4 flex gap-2 justify-center">
            {weekdayDistribution.map((count, i) => {
              const maxDay = Math.max(...weekdayDistribution, 1);
              const height = Math.max(4, (count / maxDay) * 32);
              return (
                <div key={i} className="flex flex-col items-center gap-1">
                  <div
                    className="w-4 rounded-sm"
                    style={{
                      height: `${height}px`,
                      backgroundColor: (i === 0 || i === 6) ? '#86efac' : '#e8834a',
                      opacity: count === 0 ? 0.2 : 1,
                    }}
                    title={`${DAYS[i]}: ${count} sessions`}
                  />
                  <span className="text-[8px] text-text-muted">{DAYS[i]}</span>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* Stats View */
        <div className="pixel-card p-4">
          <div className="text-[10px] text-text-muted mb-3">MODEL DISTRIBUTION</div>
          <div className="flex gap-4">
            {Object.entries(modelDistribution).sort((a, b) => b[1] - a[1]).map(([model, count]) => {
              const total = Object.values(modelDistribution).reduce((s, v) => s + v, 0);
              const pct = Math.round((count / total) * 100);
              const color = MODEL_COLORS[model as keyof typeof MODEL_COLORS] ?? '#9ca3af';
              return (
                <div key={model} className="flex-1">
                  <div className="flex items-end gap-1 mb-1">
                    <span className="text-[16px] font-pixel" style={{ color }}>{pct}%</span>
                    <span className="text-[9px] text-text-muted">{model}</span>
                  </div>
                  <div className="h-1.5 bg-surface rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: color }} />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-4 text-[10px] text-text-muted">
            <div className="flex justify-between py-1 border-b border-border">
              <span>Total sessions</span><span className="text-text-main">{stats.totalSessions}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-border">
              <span>Off-peak sessions</span><span className="text-green">{stats.offPeakRate}%</span>
            </div>
            <div className="flex justify-between py-1 border-b border-border">
              <span>Peak hour</span><span className="text-amber">{stats.peakHour} CST</span>
            </div>
            <div className="flex justify-between py-1">
              <span>Active projects</span><span className="text-text-main">{stats.uniqueProjects}</span>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
