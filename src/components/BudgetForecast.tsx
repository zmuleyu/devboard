import { useMemo } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
} from 'recharts';
import { useTokenData } from '../hooks/useTokenData';
import { useConfig } from '../hooks/useConfig';
import { formatTokens } from '../utils/format';

// --- Pure helpers ---

/** ISO week start (Monday) for a given date */
function isoWeekStart(date: Date): string {
  const d = new Date(date);
  const day = d.getDay(); // 0=Sun..6=Sat
  const diff = day === 0 ? -6 : 1 - day; // shift to Monday
  d.setDate(d.getDate() + diff);
  return d.toISOString().slice(0, 10);
}

/** Weighted moving average over up to 14 days of daily values */
function calcWMA(dailyValues: number[]): number {
  if (dailyValues.length === 0) return 0;
  let sumWeighted = 0;
  let sumWeights = 0;
  // dailyValues[0] = most recent
  for (let i = 0; i < Math.min(dailyValues.length, 14); i++) {
    const w = i < 3 ? 3 : i < 7 ? 2 : 1;
    sumWeighted += dailyValues[i] * w;
    sumWeights += w;
  }
  return sumWeighted / sumWeights;
}

type Trend = 'ACCELERATING' | 'STEADY' | 'DECELERATING';

function detectTrend(dailyValues: number[]): Trend {
  if (dailyValues.length < 5) return 'STEADY';
  const avg3 = dailyValues.slice(0, 3).reduce((s, v) => s + v, 0) / 3;
  const len7 = Math.min(dailyValues.length, 7);
  const avg7 = dailyValues.slice(0, len7).reduce((s, v) => s + v, 0) / len7;
  if (avg7 === 0) return 'STEADY';
  if (avg3 > avg7 * 1.5) return 'ACCELERATING';
  if (avg3 < avg7 * 0.5) return 'DECELERATING';
  return 'STEADY';
}

const TREND_DISPLAY: Record<Trend, { label: string; color: string }> = {
  ACCELERATING: { label: 'ACCELERATING ▲', color: '#ef4444' },
  STEADY:       { label: 'STEADY →',       color: '#9ca3af' },
  DECELERATING: { label: 'DECELERATING ▼', color: '#4ade80' },
};

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

// --- Component ---

export function BudgetForecast() {
  const { data } = useTokenData();
  const { data: config } = useConfig();
  const budget = config.weeklyTokenBudget;

  const forecast = useMemo(() => {
    if (data.length === 0) return null;

    const today = new Date();
    const weekStartStr = isoWeekStart(today);

    // This week's actual data
    const thisWeek = data.filter((d) => d.date >= weekStartStr);
    const weekUsed = thisWeek.reduce((s, d) => s + d.totalTokens, 0);
    const daysElapsed = thisWeek.length;
    const remainingDays = Math.max(0, 7 - daysElapsed);

    // All historical daily totals, most recent first
    const allDaily = [...data].reverse().map((d) => d.totalTokens);
    const wma = calcWMA(allDaily);
    const trend = detectTrend(allDaily);
    const projected = weekUsed + remainingDays * wma;
    const ratio = budget > 0 ? projected / budget : 0;

    // Build chart data (7 points: Mon-Sun)
    const chartData = DAY_LABELS.map((label, i) => {
      const dayIndex = i; // 0=Mon..6=Sun
      if (dayIndex < daysElapsed) {
        // Actual cumulative
        const cumulative = thisWeek.slice(0, dayIndex + 1).reduce((s, d) => s + d.totalTokens, 0);
        return { day: label, actual: cumulative, forecast: undefined, upper: undefined, lower: undefined };
      } else {
        // Forecast cumulative
        const actualEnd = weekUsed;
        const futureDays = dayIndex - daysElapsed + 1;
        const fc = actualEnd + futureDays * wma;
        return {
          day: label,
          actual: dayIndex === daysElapsed ? weekUsed : undefined, // bridge point
          forecast: fc,
          upper: fc * 1.2,
          lower: fc * 0.8,
        };
      }
    });

    // Add bridge: last actual day also starts forecast
    if (daysElapsed > 0 && daysElapsed < 7) {
      chartData[daysElapsed - 1].forecast = weekUsed;
      chartData[daysElapsed - 1].upper = weekUsed * 1.2;
      chartData[daysElapsed - 1].lower = weekUsed * 0.8;
    }

    return { weekUsed, wma, projected, ratio, trend, remainingDays, chartData };
  }, [data, budget]);

  if (!forecast) {
    return (
      <div className="pixel-border bg-card-bg p-4">
        <h2 className="font-pixel text-[10px] mb-2">Token 预算预测</h2>
        <p className="text-[10px] text-text-muted italic">数据不足，无法预测</p>
      </div>
    );
  }

  const { weekUsed, wma, projected, ratio, trend, remainingDays, chartData } = forecast;
  const trendInfo = TREND_DISPLAY[trend];
  const remaining = budget - projected;

  // Status
  const status = ratio > 1
    ? { label: 'OVER BUDGET', color: '#ef4444', icon: '◆', suggestion: '建议切换至 Haiku', pulse: true }
    : ratio >= 0.8
    ? { label: 'CAUTION', color: '#fbbf24', icon: '▲', suggestion: '考虑减少 Opus 使用', pulse: false }
    : { label: 'ON TRACK', color: '#4ade80', icon: '●', suggestion: '额度充足', pulse: false };

  return (
    <div className="pixel-border bg-card-bg p-4">
      <div className="flex items-center justify-between mb-1">
        <h2 className="font-pixel text-[10px]">Token 预算预测</h2>
        <span className="text-[9px]" style={{ color: trendInfo.color }}>{trendInfo.label}</span>
      </div>
      <p className="text-[10px] text-text-muted mb-3">基于加权移动平均预测本周 token 消耗趋势</p>

      <div className="grid grid-cols-1 md:grid-cols-[1fr_140px_120px] gap-4">
        {/* Chart */}
        <div>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#d5d0c8" />
              <XAxis dataKey="day" tick={{ fontSize: 9, fontFamily: 'JetBrains Mono' }} stroke="#706858" />
              <YAxis tickFormatter={formatTokens} tick={{ fontSize: 9, fontFamily: 'JetBrains Mono' }} stroke="#706858" width={45} />
              <Tooltip
                formatter={(value) => formatTokens(Number(value))}
                contentStyle={{ fontFamily: 'JetBrains Mono', fontSize: 11, border: '2px solid #2a2a2a', boxShadow: '2px 2px 0 #2a2a2a' }}
              />
              <ReferenceLine y={budget} stroke="#ef4444" strokeDasharray="4 4" label={{ value: '15M', fontSize: 8, fill: '#ef4444' }} />
              {/* Confidence band */}
              <Area type="monotone" dataKey="upper" stroke="none" fill="#c084fc" fillOpacity={0.05} />
              <Area type="monotone" dataKey="lower" stroke="none" fill="#ffffff" fillOpacity={0} />
              {/* Forecast line */}
              <Area type="monotone" dataKey="forecast" stroke="#c084fc" strokeWidth={2} strokeDasharray="6 3" fill="#c084fc" fillOpacity={0.08} />
              {/* Actual line */}
              <Area type="monotone" dataKey="actual" stroke="#e8834a" strokeWidth={2} fill="#e8834a" fillOpacity={0.15} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Stats panel */}
        <div className="flex flex-col gap-2 text-[11px]" style={{ fontFamily: 'JetBrains Mono' }}>
          <div>
            <span className="text-[9px] text-text-muted font-pixel">本周已用</span>
            <div className="font-bold">{formatTokens(weekUsed)}</div>
          </div>
          <div>
            <span className="text-[9px] text-text-muted font-pixel">预计终值</span>
            <div className="font-bold">{formatTokens(projected)}</div>
          </div>
          <div>
            <span className="text-[9px] text-text-muted font-pixel">日均(WMA)</span>
            <div className="font-bold">{formatTokens(wma)}</div>
          </div>
          <div>
            <span className="text-[9px] text-text-muted font-pixel">剩余额度</span>
            <div className="font-bold" style={{ color: remaining < 0 ? '#ef4444' : undefined }}>
              {remaining < 0 ? '-' : ''}{formatTokens(Math.abs(remaining))}
            </div>
          </div>
          <div className="text-[9px] mt-1">
            <span className="text-text-muted font-pixel">剩余天数</span>
            <span className="ml-2 font-bold">{remainingDays}</span>
          </div>
        </div>

        {/* Status card */}
        <div
          className={`flex flex-col items-center justify-center p-3 rounded text-center ${status.pulse ? 'animate-pulse' : ''}`}
          style={{ border: `2px solid ${status.color}`, backgroundColor: `${status.color}1a` }}
        >
          <span className="text-[18px]">{status.icon}</span>
          <span className="font-pixel text-[9px] font-bold mt-1" style={{ color: status.color }}>
            {status.label}
          </span>
          <span className="text-[9px] text-text-muted mt-2">{status.suggestion}</span>
        </div>
      </div>
    </div>
  );
}
