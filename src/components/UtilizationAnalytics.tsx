import { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
} from 'recharts';
import { useTokenData } from '../hooks/useTokenData';
import { useSessionData } from '../hooks/useSessionData';

const CYCLE_TOKEN_BUDGET = 15_000_000;

interface DayUtilization {
  date: string;
  label: string;
  utilization: number;
  tokens: number;
}

export function UtilizationAnalytics() {
  const { data: tokenDaily } = useTokenData();
  const { data: sessions } = useSessionData();

  const utilData = useMemo<DayUtilization[]>(() => {
    const last7 = tokenDaily.slice(-7);
    return last7.map(d => ({
      date: d.date,
      label: d.date.slice(5), // "03-16"
      utilization: Math.round((d.totalTokens / CYCLE_TOKEN_BUDGET) * 100),
      tokens: d.totalTokens,
    }));
  }, [tokenDaily]);

  const stats = useMemo(() => {
    if (utilData.length === 0) return { current: 0, avg7d: 0, trend: 'stable' as const };

    const current = utilData[utilData.length - 1]?.utilization ?? 0;
    const avg7d = Math.round(utilData.reduce((s, d) => s + d.utilization, 0) / utilData.length);

    // Trend: compare last 3 days avg vs full 7 days
    const last3 = utilData.slice(-3);
    const avg3d = last3.length > 0
      ? Math.round(last3.reduce((s, d) => s + d.utilization, 0) / last3.length)
      : 0;
    const trend = avg3d > avg7d * 1.15 ? 'up' as const
      : avg3d < avg7d * 0.85 ? 'down' as const
      : 'stable' as const;

    return { current, avg7d, trend };
  }, [utilData]);

  // Idle time detection: gaps > 30min between sessions today
  const idleMinutes = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    const todaySessions = sessions
      .filter(s => s.date === today && s.startTime)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));

    if (todaySessions.length < 2) return 0;

    let totalIdle = 0;
    for (let i = 1; i < todaySessions.length; i++) {
      const prev = todaySessions[i - 1];
      const curr = todaySessions[i];
      // Parse duration of previous session
      const prevDurMatch = prev.duration.match(/(\d+)m/);
      const prevDurMin = prevDurMatch ? parseInt(prevDurMatch[1]) : 30;

      // Estimate end time of previous session
      const [ph, pm] = prev.startTime.split(':').map(Number);
      const prevEndMin = ph * 60 + pm + prevDurMin;

      const [ch, cm] = curr.startTime.split(':').map(Number);
      const currStartMin = ch * 60 + cm;

      const gap = currStartMin - prevEndMin;
      if (gap > 30) totalIdle += gap;
    }
    return totalIdle;
  }, [sessions]);

  const trendDisplay = {
    up: { label: '↑ 提升', color: '#86efac' },
    down: { label: '↓ 下降', color: '#fbbf24' },
    stable: { label: '→ 稳定', color: '#9ca3af' },
  };

  const td = trendDisplay[stats.trend];

  return (
    <div className="pixel-border bg-card-bg p-4">
      <div className="flex items-center justify-between mb-1">
        <h2 className="font-pixel text-[10px] text-text-main">UTILIZATION</h2>
        <span className="text-[10px]" style={{ color: td.color }}>{td.label}</span>
      </div>
      <p className="text-[10px] text-text-muted mb-4">
        5h 周期利用率分析 — 额度使用效率追踪
      </p>

      {/* Metric cards */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <MetricCard
          label="当前周期"
          value={`${stats.current}%`}
          color={stats.current >= 80 ? '#86efac' : stats.current >= 50 ? '#fbbf24' : '#f87171'}
          sub={stats.current < 50 ? '利用率偏低' : stats.current >= 80 ? '利用充分' : '中等水平'}
        />
        <MetricCard
          label="7 天均值"
          value={`${stats.avg7d}%`}
          color="#818cf8"
          sub="日均利用率"
        />
        <MetricCard
          label="效率趋势"
          value={td.label}
          color={td.color}
          sub={stats.trend === 'up' ? '利用效率在提升' : stats.trend === 'down' ? '考虑优化安排' : '保持当前节奏'}
        />
      </div>

      {/* Idle time alert */}
      {idleMinutes > 0 && (
        <div className="pixel-border bg-board-bg p-2 mb-4 text-[10px]">
          <span style={{ color: '#fbbf24' }}>⏸</span>
          <span className="text-text-muted ml-2">
            今日周期内有 <span className="text-amber font-bold">{idleMinutes}min</span> 空闲间隔（session 间 &gt;30min 的间隔）
          </span>
        </div>
      )}

      {/* 7-day utilization chart */}
      {utilData.length > 0 && (
        <div>
          <p className="text-[9px] text-text-muted mb-2 font-pixel">7 天利用率</p>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={utilData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#d5d0c8" />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 9, fontFamily: 'JetBrains Mono' }}
                stroke="#706858"
              />
              <YAxis
                domain={[0, 100]}
                tick={{ fontSize: 9, fontFamily: 'JetBrains Mono' }}
                stroke="#706858"
                width={35}
                tickFormatter={v => `${v}%`}
              />
              <Tooltip
                formatter={(value) => [`${Number(value)}%`, '利用率']}
                contentStyle={{
                  fontFamily: 'JetBrains Mono',
                  fontSize: 11,
                  border: '2px solid #2a2a2a',
                  boxShadow: '2px 2px 0 #2a2a2a',
                }}
              />
              <ReferenceLine y={80} stroke="#86efac" strokeDasharray="4 4" label={{ value: '80%', fontSize: 8, fill: '#86efac' }} />
              <ReferenceLine y={50} stroke="#fbbf24" strokeDasharray="4 4" label={{ value: '50%', fontSize: 8, fill: '#fbbf24' }} />
              <Bar
                dataKey="utilization"
                fill="#818cf8"
                radius={[2, 2, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

function MetricCard({ label, value, color, sub }: {
  label: string; value: string; color: string; sub: string;
}) {
  return (
    <div className="pixel-border bg-board-bg p-3 text-center">
      <div className="text-[9px] text-text-muted font-pixel mb-1">{label}</div>
      <div className="font-pixel text-[14px] font-bold" style={{ color }}>{value}</div>
      <div className="text-[9px] text-text-muted mt-1">{sub}</div>
    </div>
  );
}
