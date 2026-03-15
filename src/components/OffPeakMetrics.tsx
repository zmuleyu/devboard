import { useMemo } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import { useCronData } from '../hooks/useCronData';

const OFF_PEAK_START = 1;
const OFF_PEAK_END = 7;
const OFF_PEAK_COLOR = '#3b82f6';
const DAYTIME_COLOR = '#706858';

function isOffPeakTime(time: string): boolean {
  const h = parseInt(time.split(':')[0], 10);
  return h >= OFF_PEAK_START && h < OFF_PEAK_END;
}

export function OffPeakMetrics() {
  const { data } = useCronData();

  const { pieData, trendData, stats } = useMemo(() => {
    // Classify all entries by off-peak status
    const offPeak = data.filter((d) => d.isOffPeak ?? isOffPeakTime(d.time));
    const daytime = data.filter((d) => !(d.isOffPeak ?? isOffPeakTime(d.time)));

    // Pie chart data
    const pie = [
      { name: '错峰', value: offPeak.length, color: OFF_PEAK_COLOR },
      { name: '白天', value: daytime.length, color: DAYTIME_COLOR },
    ];

    // 7-day trend
    const now = new Date();
    const last7 = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(now);
      d.setDate(d.getDate() - (6 - i));
      return d.toISOString().slice(0, 10);
    });

    const trend = last7.map((date) => {
      const dayEntries = data.filter((d) => d.date === date);
      const dayOffPeak = dayEntries.filter((d) => d.isOffPeak ?? isOffPeakTime(d.time));
      return {
        date: date.slice(5),
        offPeak: dayOffPeak.length,
        daytime: dayEntries.length - dayOffPeak.length,
      };
    });

    // Token savings estimate: off-peak tasks get 2x credits
    // Estimate based on budget caps or task count
    const offPeakBudget = offPeak.reduce((s, d) => s + (d.budgetCap ?? 0.30), 0);
    const equivalentSaving = offPeakBudget; // 2x means you save the same amount

    return {
      pieData: pie,
      trendData: trend,
      stats: {
        totalTasks: data.length,
        offPeakCount: offPeak.length,
        offPeakPct: data.length > 0 ? Math.round((offPeak.length / data.length) * 100) : 0,
        estimatedSaving: equivalentSaving.toFixed(2),
        cronCount: data.filter((d) => d.source === 'cron' || d.source === 'persistent').length,
        sessionCount: data.filter((d) => !d.source || d.source === 'session' || d.source === 'loop').length,
      },
    };
  }, [data]);

  if (data.length === 0) {
    return (
      <div className="pixel-border bg-card-bg p-4">
        <h2 className="font-pixel text-[10px] mb-1">OFF-PEAK METRICS</h2>
        <p className="text-[10px] text-text-muted">暂无数据。任务执行后将展示错峰利用率。</p>
      </div>
    );
  }

  return (
    <div className="pixel-border bg-card-bg p-4">
      <h2 className="font-pixel text-[10px] mb-1">OFF-PEAK METRICS</h2>
      <p className="text-[10px] text-text-muted mb-4">
        错峰双倍利用率 · {OFF_PEAK_START}:00–{OFF_PEAK_END}:00 窗口
      </p>

      <div className="grid grid-cols-2 gap-4">
        {/* Left: Donut chart + stats */}
        <div>
          <ResponsiveContainer width="100%" height={120}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={30}
                outerRadius={48}
                dataKey="value"
                startAngle={90}
                endAngle={-270}
                stroke="none"
              >
                {pieData.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  fontFamily: 'JetBrains Mono',
                  fontSize: 11,
                  border: '2px solid #2a2a2a',
                  boxShadow: '2px 2px 0 #2a2a2a',
                }}
              />
            </PieChart>
          </ResponsiveContainer>

          {/* Stats under donut */}
          <div className="text-center text-[11px] space-y-1">
            <div>
              <span className="text-[#3b82f6] font-bold text-[14px]">{stats.offPeakPct}%</span>
              <span className="text-text-muted ml-1">错峰执行</span>
            </div>
            <div className="text-text-muted text-[10px]">
              {stats.offPeakCount} 错峰 / {stats.totalTasks} 总计
            </div>
          </div>
        </div>

        {/* Right: 7-day trend bar chart */}
        <div>
          <div className="font-pixel text-[8px] text-text-muted mb-1">7 DAY TREND</div>
          <ResponsiveContainer width="100%" height={120}>
            <BarChart data={trendData} margin={{ top: 0, right: 0, bottom: 0, left: -15 }}>
              <XAxis
                dataKey="date"
                tick={{ fontSize: 8, fontFamily: 'JetBrains Mono' }}
                stroke="#706858"
              />
              <YAxis
                tick={{ fontSize: 8, fontFamily: 'JetBrains Mono' }}
                stroke="#706858"
                allowDecimals={false}
              />
              <Tooltip
                contentStyle={{
                  fontFamily: 'JetBrains Mono',
                  fontSize: 11,
                  border: '2px solid #2a2a2a',
                  boxShadow: '2px 2px 0 #2a2a2a',
                }}
              />
              <Bar dataKey="offPeak" stackId="a" fill={OFF_PEAK_COLOR} name="错峰" />
              <Bar dataKey="daytime" stackId="a" fill={DAYTIME_COLOR} name="白天" />
            </BarChart>
          </ResponsiveContainer>

          {/* Extra stats */}
          <div className="space-y-1 mt-2 text-[10px]">
            <div className="flex justify-between">
              <span className="text-text-muted">等效节省：</span>
              <span className="text-[#3b82f6] font-bold">${stats.estimatedSaving}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-muted">外部 Cron：</span>
              <span>{stats.cronCount}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-muted">Session 内：</span>
              <span>{stats.sessionCount}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Optimization hint */}
      {stats.offPeakPct < 30 && stats.totalTasks > 5 && (
        <div className="mt-3 px-2 py-1 border border-[#3b82f6]/40 bg-[#3b82f6]/10 text-[10px] text-[#3b82f6]">
          💡 错峰利用率较低（{stats.offPeakPct}%）。考虑将更多巡检任务移到 01:00-07:00 窗口以获得双倍额度。
        </div>
      )}
    </div>
  );
}
