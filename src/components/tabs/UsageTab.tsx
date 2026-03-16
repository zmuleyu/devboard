import { useState, useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { useTokenData } from '../../hooks/useTokenData';
import { useConfig } from '../../hooks/useConfig';
import { calcDailyCost } from '../../utils/cost';
import { aggregateByWeek, aggregateByMonth } from '../../utils/aggregate';
import { formatTokens } from '../../utils/format';
import { MODEL_COLORS, projectColor } from '../../theme';
import { BudgetForecast } from '../BudgetForecast';
import { SessionLog } from '../SessionLog';
import { UsageDashboard } from '../UsageDashboard';
import { Timeline } from '../Timeline';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type TimeGranularity = 'day' | 'week' | 'month';
type SectionKey = 'sessions' | 'heatmap' | 'budget' | 'timeline';

interface Props {
  selectedProject: string | null;
  onSelectProject: (p: string | null) => void;
}

// ---------------------------------------------------------------------------
// BigNumberCard (local component)
// ---------------------------------------------------------------------------

interface BigNumberCardProps {
  active: boolean;
  onClick: () => void;
  period: string;
  tokens: number;
  cost: number;
  trend: { direction: 'up' | 'down' | 'flat'; pct: number; label: string };
}

function BigNumberCard({ active, onClick, period, tokens, cost, trend }: BigNumberCardProps) {
  const trendIcon = trend.direction === 'up' ? '\u2191' : trend.direction === 'down' ? '\u2193' : '\u2192';
  const trendColor =
    trend.direction === 'up' ? '#ef4444' : trend.direction === 'down' ? '#4ade80' : '#9ca3af';

  return (
    <button
      onClick={onClick}
      className={`pixel-border bg-card-bg p-3 text-left transition-all ${
        active ? 'ring-2 ring-amber ring-offset-2 ring-offset-board-bg' : 'opacity-70 hover:opacity-90'
      }`}
    >
      <div className="font-pixel text-[7px] text-text-muted mb-2">{period}</div>
      <div className="font-pixel text-[14px] text-text-main leading-tight mb-1">
        {formatTokens(tokens)}
      </div>
      <div className="text-[11px] text-text-muted mb-1">${cost.toFixed(2)}</div>
      <div className="text-[10px] flex items-center gap-1" style={{ color: trendColor }}>
        <span>{trendIcon}{trend.pct}%</span>
        <span className="text-text-muted">{trend.label}</span>
      </div>
    </button>
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function computeTrend(
  current: number,
  previous: number,
  label: string
): { direction: 'up' | 'down' | 'flat'; pct: number; label: string } {
  if (previous === 0) return { direction: current > 0 ? 'up' : 'flat', pct: current > 0 ? 100 : 0, label };
  const change = ((current - previous) / previous) * 100;
  const absPct = Math.abs(Math.round(change));
  if (change > 5) return { direction: 'up', pct: absPct, label };
  if (change < -5) return { direction: 'down', pct: absPct, label };
  return { direction: 'flat', pct: absPct, label };
}

/** Estimate cost for a project on a given day by applying the day's model cost ratio */
function estimateProjectCost(
  projectTokens: number,
  dayByModel: { haiku: number; sonnet: number; opus: number },
  dayTotal: number
): number {
  if (dayTotal === 0 || projectTokens === 0) return 0;
  const dayCost = calcDailyCost(dayByModel);
  const costPerToken = dayCost.total / dayTotal;
  return projectTokens * costPerToken;
}

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

function isoWeekStart(date: Date): string {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  return d.toISOString().slice(0, 10);
}

// ---------------------------------------------------------------------------
// UsageTab Component
// ---------------------------------------------------------------------------

export default function AnalyticsTab({ selectedProject, onSelectProject }: Props) {
  const { data } = useTokenData();
  const { data: config } = useConfig();
  const [timeGranularity, setTimeGranularity] = useState<TimeGranularity>('day');
  const [expandedSection, setExpandedSection] = useState<SectionKey | null>(null);

  const toggle = (key: SectionKey) =>
    setExpandedSection((prev) => (prev === key ? null : key));

  // ── Layer 1: Big numbers ──

  const today = todayStr();
  const weekStart = isoWeekStart(new Date());
  const monthStart = today.slice(0, 7);

  // Today
  const todayData = useMemo(() => {
    const entry = data.find((d) => d.date === today);
    const tokens = entry?.totalTokens ?? 0;
    const cost = entry ? calcDailyCost(entry.byModel).total : 0;
    // Yesterday for trend
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yStr = yesterday.toISOString().slice(0, 10);
    const yEntry = data.find((d) => d.date === yStr);
    const yTokens = yEntry?.totalTokens ?? 0;
    const trend = computeTrend(tokens, yTokens, 'vs \u6628\u65E5');
    return { tokens, cost, trend };
  }, [data, today]);

  // This week
  const weekData = useMemo(() => {
    const thisWeek = data.filter((d) => d.date >= weekStart);
    const tokens = thisWeek.reduce((s, d) => s + d.totalTokens, 0);
    const cost = thisWeek.reduce((s, d) => s + calcDailyCost(d.byModel).total, 0);
    // Previous week
    const prevWeekEnd = new Date(weekStart);
    prevWeekEnd.setDate(prevWeekEnd.getDate() - 1);
    const prevWeekStart = isoWeekStart(prevWeekEnd);
    const prevWeekStartStr = prevWeekStart;
    const prevWeek = data.filter((d) => d.date >= prevWeekStartStr && d.date < weekStart);
    // Compare same number of elapsed days
    const elapsedDays = thisWeek.length;
    const prevTokens = prevWeek.slice(0, elapsedDays).reduce((s, d) => s + d.totalTokens, 0);
    const trend = computeTrend(tokens, prevTokens, 'vs \u4E0A\u5468');
    return { tokens, cost, trend };
  }, [data, weekStart]);

  // This month
  const monthData = useMemo(() => {
    const thisMonth = data.filter((d) => d.date.startsWith(monthStart));
    const tokens = thisMonth.reduce((s, d) => s + d.totalTokens, 0);
    const cost = thisMonth.reduce((s, d) => s + calcDailyCost(d.byModel).total, 0);
    // Previous month same period
    const now = new Date();
    const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const prevMonthPrefix = prevMonth.toISOString().slice(0, 7);
    const dayOfMonth = now.getDate();
    const prevMonthData = data.filter((d) => {
      if (!d.date.startsWith(prevMonthPrefix)) return false;
      const dom = parseInt(d.date.slice(8, 10), 10);
      return dom <= dayOfMonth;
    });
    const prevTokens = prevMonthData.reduce((s, d) => s + d.totalTokens, 0);
    const trend = computeTrend(tokens, prevTokens, 'vs \u4E0A\u6708\u540C\u671F');
    return { tokens, cost, trend };
  }, [data, monthStart]);

  // ── Budget bars ──

  const budgetInfo = useMemo(() => {
    const budget = config.weeklyTokenBudget;
    const weekRatio = budget > 0 ? weekData.tokens / budget : 0;
    const weekColor = weekRatio >= 1 ? '#f87171' : weekRatio >= config.warningThreshold ? '#fbbf24' : '#86efac';
    // Estimate monthly: 4.33 weeks
    const monthBudget = budget * 4.33;
    const monthRatio = monthBudget > 0 ? monthData.tokens / monthBudget : 0;
    const monthColor = monthRatio >= 1 ? '#f87171' : monthRatio >= config.warningThreshold ? '#fbbf24' : '#86efac';
    return { budget, weekRatio, weekColor, monthBudget, monthRatio, monthColor };
  }, [config, weekData, monthData]);

  // ── Project usage ──

  const projectUsage = useMemo(() => {
    // Filter data range based on granularity
    let filtered = data;
    if (timeGranularity === 'day') {
      filtered = data.filter((d) => d.date === today);
    } else if (timeGranularity === 'week') {
      filtered = data.filter((d) => d.date >= weekStart);
    } else {
      filtered = data.filter((d) => d.date.startsWith(monthStart));
    }

    const totals: Record<string, { tokens: number; cost: number }> = {};
    for (const d of filtered) {
      for (const [project, tokens] of Object.entries(d.byProject)) {
        if (!totals[project]) totals[project] = { tokens: 0, cost: 0 };
        totals[project].tokens += tokens;
        totals[project].cost += estimateProjectCost(tokens, d.byModel, d.totalTokens);
      }
    }

    const totalTokens = Object.values(totals).reduce((s, v) => s + v.tokens, 0);
    return Object.entries(totals)
      .sort((a, b) => b[1].tokens - a[1].tokens)
      .map(([name, v]) => ({
        name,
        value: v.tokens,
        cost: v.cost,
        pct: totalTokens > 0 ? Math.round((v.tokens / totalTokens) * 100) : 0,
      }));
  }, [data, timeGranularity, today, weekStart, monthStart]);

  // ── Layer 2: Trend chart data ──

  const chartData = useMemo(() => {
    if (timeGranularity === 'day') {
      return data.slice(-7).map((d) => ({
        label: d.date.slice(5),
        haiku: d.byModel.haiku,
        sonnet: d.byModel.sonnet,
        opus: d.byModel.opus,
      }));
    }
    if (timeGranularity === 'week') {
      const weeks = aggregateByWeek(data).slice(-4);
      return weeks.map((w) => ({
        label: w.weekStart.slice(5),
        haiku: w.byModel.haiku,
        sonnet: w.byModel.sonnet,
        opus: w.byModel.opus,
      }));
    }
    // month
    const months = aggregateByMonth(data).slice(-6);
    return months.map((m) => ({
      label: m.month.slice(2), // "26-01"
      haiku: m.byModel.haiku,
      sonnet: m.byModel.sonnet,
      opus: m.byModel.opus,
    }));
  }, [data, timeGranularity]);

  // ── Collapsible sections config ──

  const sections: Array<{ key: SectionKey; icon: string; label: string }> = [
    { key: 'sessions', icon: '\uD83D\uDD50', label: 'Session \u5386\u53F2' },
    { key: 'heatmap', icon: '\uD83D\uDD25', label: '\u6D3B\u8DC3\u65F6\u95F4\u70ED\u529B\u56FE' },
    { key: 'budget', icon: '\uD83D\uDCC8', label: '\u9884\u7B97\u9884\u6D4B WMA' },
    { key: 'timeline', icon: '\uD83D\uDCC5', label: '\u9879\u76EE \u00D7 \u65E5\u671F\u65F6\u95F4\u8F74' },
  ];

  return (
    <>
      {/* ═══════ Layer 1: Big Numbers + Project Usage ═══════ */}

      {/* Time granularity selector - 3 big cards */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <BigNumberCard
          active={timeGranularity === 'day'}
          onClick={() => setTimeGranularity('day')}
          period="\u4ECA\u65E5"
          tokens={todayData.tokens}
          cost={todayData.cost}
          trend={todayData.trend}
        />
        <BigNumberCard
          active={timeGranularity === 'week'}
          onClick={() => setTimeGranularity('week')}
          period="\u672C\u5468"
          tokens={weekData.tokens}
          cost={weekData.cost}
          trend={weekData.trend}
        />
        <BigNumberCard
          active={timeGranularity === 'month'}
          onClick={() => setTimeGranularity('month')}
          period="\u672C\u6708"
          tokens={monthData.tokens}
          cost={monthData.cost}
          trend={monthData.trend}
        />
      </div>

      {/* Budget progress - compact */}
      <div className="mb-4 pixel-border bg-card-bg p-3">
        {/* Week budget */}
        <div className="flex justify-between text-[9px] text-text-muted mb-1">
          <span className="font-pixel">\u5468\u9884\u7B97</span>
          <span>
            {formatTokens(weekData.tokens)} / {formatTokens(budgetInfo.budget)}
          </span>
        </div>
        <div className="h-2 bg-board-bg pixel-border-sm overflow-hidden mb-2">
          <div
            style={{
              width: `${Math.min(budgetInfo.weekRatio * 100, 100)}%`,
              backgroundColor: budgetInfo.weekColor,
              height: '100%',
              transition: 'width 0.3s',
            }}
          />
        </div>

        {/* Month budget estimate */}
        <div className="flex justify-between text-[9px] text-text-muted mb-1">
          <span className="font-pixel">\u6708\u9884\u7B97\uFF08\u4F30\u7B97\uFF09</span>
          <span>
            {formatTokens(monthData.tokens)} / {formatTokens(Math.round(budgetInfo.monthBudget))}
          </span>
        </div>
        <div className="h-2 bg-board-bg pixel-border-sm overflow-hidden">
          <div
            style={{
              width: `${Math.min(budgetInfo.monthRatio * 100, 100)}%`,
              backgroundColor: budgetInfo.monthColor,
              height: '100%',
              transition: 'width 0.3s',
            }}
          />
        </div>
      </div>

      {/* Project usage - always visible */}
      <div className="pixel-border bg-card-bg p-4 mb-6">
        <h3 className="font-pixel text-[9px] text-text-muted mb-3">
          \u9879\u76EE\u7528\u91CF\u5206\u5E03
          <span className="ml-2 text-[8px] font-normal">
            ({timeGranularity === 'day' ? '\u4ECA\u65E5' : timeGranularity === 'week' ? '\u672C\u5468' : '\u672C\u6708'})
          </span>
        </h3>
        {projectUsage.length === 0 ? (
          <p className="text-[10px] text-text-muted italic">\u65E0\u9879\u76EE\u6570\u636E</p>
        ) : (
          projectUsage.map((p) => (
            <div key={p.name} className="flex items-center gap-2 mb-2 text-[11px]">
              <span className="w-24 truncate text-text-main font-bold">{p.name}</span>
              <div className="flex-1 h-2 bg-board-bg pixel-border-sm overflow-hidden">
                <div
                  style={{ width: `${p.pct}%`, backgroundColor: projectColor(p.name) }}
                  className="h-full transition-all"
                />
              </div>
              <span className="text-text-muted w-16 text-right">{formatTokens(p.value)}</span>
              <span className="text-text-muted w-12 text-right">${p.cost.toFixed(2)}</span>
            </div>
          ))
        )}
      </div>

      {/* ═══════ Layer 2: Trend Chart ═══════ */}

      <div className="pixel-border bg-card-bg p-4 mb-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-pixel text-[9px] text-text-muted">
            {timeGranularity === 'day'
              ? '\u6BCF\u65E5\u6D88\u8017\u8D8B\u52BF\uFF08\u8FD1 7 \u5929\uFF09'
              : timeGranularity === 'week'
              ? '\u6BCF\u5468\u6D88\u8017\u8D8B\u52BF\uFF08\u8FD1 4 \u5468\uFF09'
              : '\u6BCF\u6708\u6D88\u8017\u8D8B\u52BF\uFF08\u8FD1 6 \u6708\uFF09'}
          </h3>
          <div className="flex items-center gap-2 text-[8px]">
            {Object.entries(MODEL_COLORS).map(([model, color]) => (
              <div key={model} className="flex items-center gap-1">
                <div
                  style={{ width: 8, height: 8, backgroundColor: color, border: '1px solid #2a2a2a' }}
                />
                <span className="text-text-muted">{model}</span>
              </div>
            ))}
          </div>
        </div>
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#d5d0c8" />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 9, fontFamily: 'JetBrains Mono' }}
                stroke="#706858"
              />
              <YAxis
                tickFormatter={formatTokens}
                tick={{ fontSize: 9, fontFamily: 'JetBrains Mono' }}
                stroke="#706858"
                width={50}
              />
              <Tooltip
                formatter={(value, name) => [formatTokens(Number(value)), String(name)]}
                contentStyle={{
                  fontFamily: 'JetBrains Mono',
                  fontSize: 11,
                  border: '2px solid #2a2a2a',
                  boxShadow: '2px 2px 0 #2a2a2a',
                }}
              />
              <Legend wrapperStyle={{ fontSize: 10, fontFamily: 'JetBrains Mono' }} />
              <Bar dataKey="haiku" stackId="model" fill={MODEL_COLORS.haiku} />
              <Bar dataKey="sonnet" stackId="model" fill={MODEL_COLORS.sonnet} />
              <Bar dataKey="opus" stackId="model" fill={MODEL_COLORS.opus} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-[10px] text-text-muted italic py-8 text-center">\u6682\u65E0\u56FE\u8868\u6570\u636E</p>
        )}
      </div>

      {/* ═══════ Layer 3: Collapsible Details ═══════ */}

      {sections.map(({ key, icon, label }) => (
        <div key={key} className="pixel-border bg-card-bg mb-3">
          <button
            className="w-full p-3 flex items-center justify-between text-[11px] cursor-pointer"
            onClick={() => toggle(key)}
          >
            <span>
              {icon} {label}
            </span>
            <span className="text-text-muted">{expandedSection === key ? '\u25B4' : '\u25BE'}</span>
          </button>
          {expandedSection === key && (
            <div className="p-4 border-t-2 border-dashed border-grid-dot">
              {key === 'sessions' && (
                <SessionLog selectedProject={selectedProject} onSelectProject={onSelectProject} />
              )}
              {key === 'heatmap' && <UsageDashboard />}
              {key === 'budget' && <BudgetForecast />}
              {key === 'timeline' && <Timeline selectedProject={selectedProject} />}
            </div>
          )}
        </div>
      ))}
    </>
  );
}
