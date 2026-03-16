import { useMemo } from 'react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  ResponsiveContainer,
} from 'recharts';
import { useTokenData } from '../hooks/useTokenData';
import { useConfig } from '../hooks/useConfig';
import { MODEL_COLORS, projectColor } from '../theme';
import { formatTokens } from '../utils/format';

function formatDate(dateStr: string): string {
  return dateStr.slice(5); // "03-15"
}

// Weekly budget reference (daily equivalent)
const WEEKLY_NORMAL = 15_000_000 / 7; // ~2.14M/day
const WEEKLY_RED = 30_000_000 / 7; // ~4.29M/day

export function TokenAnalytics() {
  const { data } = useTokenData();
  const { data: config } = useConfig();

  const weeklyStats = useMemo(() => {
    const currentWeekTokens = data.slice(-7).reduce((s, d) => s + d.totalTokens, 0);
    const prevWeekTokens = data.slice(-14, -7).reduce((s, d) => s + d.totalTokens, 0);
    const trend = currentWeekTokens > prevWeekTokens ? '↑' : currentWeekTokens < prevWeekTokens ? '↓' : '→';
    const budget = config.weeklyTokenBudget;
    const ratio = budget > 0 ? currentWeekTokens / budget : 0;
    const budgetColor = ratio >= 1 ? '#f87171' : ratio >= config.warningThreshold ? '#fbbf24' : '#86efac';
    return { currentWeekTokens, prevWeekTokens, trend, budget, ratio, budgetColor };
  }, [data, config]);

  const chartData = useMemo(
    () =>
      data.map((d) => ({
        date: formatDate(d.date),
        total: d.totalTokens,
        haiku: d.byModel.haiku,
        sonnet: d.byModel.sonnet,
        opus: d.byModel.opus,
      })),
    [data]
  );

  // Aggregate byProject across all days
  const projectData = useMemo(() => {
    const totals: Record<string, number> = {};
    data.forEach((d) => {
      Object.entries(d.byProject).forEach(([project, tokens]) => {
        totals[project] = (totals[project] || 0) + tokens;
      });
    });
    const total = Object.values(totals).reduce((s, v) => s + v, 0);
    return Object.entries(totals)
      .sort((a, b) => b[1] - a[1])
      .map(([name, value]) => ({
        name,
        value,
        pct: total > 0 ? Math.round((value / total) * 100) : 0,
      }));
  }, [data]);

  return (
    <div className="pixel-border bg-card-bg p-4">
      <div className="flex items-center justify-between mb-1">
        <h2 className="font-pixel text-[10px]">Token 分析</h2>
        <div className="flex items-center gap-3 text-[11px]">
          <span className="text-text-muted">本周：</span>
          <span className="font-bold">{formatTokens(weeklyStats.currentWeekTokens)}</span>
          <span>{weeklyStats.trend}</span>
        </div>
      </div>
      <p className="text-[10px] text-text-muted mb-3">统计 Claude Code 各项目 token 消耗，帮助识别高消耗工作</p>

      {/* Weekly budget progress */}
      <div className="mb-4 px-1">
        <div className="flex justify-between text-[9px] text-text-muted mb-1">
          <span>周预算进度</span>
          <span>{formatTokens(weeklyStats.currentWeekTokens)} / {formatTokens(weeklyStats.budget)}</span>
        </div>
        <div className="h-2 bg-board-bg pixel-border-sm overflow-hidden">
          <div
            style={{
              width: `${Math.min(weeklyStats.ratio * 100, 100)}%`,
              backgroundColor: weeklyStats.budgetColor,
              height: '100%',
              transition: 'width 0.3s',
            }}
          />
        </div>
        <div className="text-[9px] mt-1" style={{ color: weeklyStats.budgetColor }}>
          {weeklyStats.ratio >= 1
            ? '⚠ 已超出预算'
            : weeklyStats.ratio >= config.warningThreshold
            ? `⚠ 接近上限（${Math.round(weeklyStats.ratio * 100)}%）`
            : `剩余 ${formatTokens(weeklyStats.budget - weeklyStats.currentWeekTokens)}`}
        </div>
      </div>

      {/* Daily trend area chart */}
      <div className="mb-6">
        <p className="text-[9px] text-text-muted mb-2 font-pixel">每日消耗趋势</p>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#d5d0c8" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 9, fontFamily: 'JetBrains Mono' }}
              stroke="#706858"
            />
            <YAxis
              tickFormatter={formatTokens}
              tick={{ fontSize: 9, fontFamily: 'JetBrains Mono' }}
              stroke="#706858"
              width={45}
            />
            <Tooltip
              formatter={(value) => formatTokens(Number(value))}
              contentStyle={{
                fontFamily: 'JetBrains Mono',
                fontSize: 11,
                border: '2px solid #2a2a2a',
                boxShadow: '2px 2px 0 #2a2a2a',
              }}
            />
            <ReferenceLine
              y={WEEKLY_NORMAL}
              stroke="#4ade80"
              strokeDasharray="4 4"
              label={{ value: '15M/wk', fontSize: 8, fill: '#4ade80' }}
            />
            <ReferenceLine
              y={WEEKLY_RED}
              stroke="#ef4444"
              strokeDasharray="4 4"
              label={{ value: '30M/wk', fontSize: 8, fill: '#ef4444' }}
            />
            <Area
              type="monotone"
              dataKey="total"
              stroke="#e8834a"
              fill="#e8834a"
              fillOpacity={0.15}
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <hr className="pixel-divider mb-4" />

      {/* Model breakdown + Project distribution side by side */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Model stacked bar */}
        <div>
          <p className="text-[9px] text-text-muted mb-2 font-pixel">按模型</p>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#d5d0c8" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 9, fontFamily: 'JetBrains Mono' }}
                stroke="#706858"
              />
              <YAxis
                tickFormatter={formatTokens}
                tick={{ fontSize: 9, fontFamily: 'JetBrains Mono' }}
                stroke="#706858"
                width={45}
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
              <Bar dataKey="haiku"  stackId="model" fill={MODEL_COLORS.haiku} />
              <Bar dataKey="sonnet" stackId="model" fill={MODEL_COLORS.sonnet} />
              <Bar dataKey="opus"   stackId="model" fill={MODEL_COLORS.opus} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Project distribution donut */}
        <div>
          <p className="text-[9px] text-text-muted mb-2 font-pixel">按项目</p>
          {projectData.length > 0 ? (
            <div className="flex items-center gap-4">
              <ResponsiveContainer width="50%" height={180}>
                <PieChart>
                  <Pie
                    data={projectData}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={75}
                    dataKey="value"
                    strokeWidth={1}
                    stroke="#2a2a2a"
                  >
                    {projectData.map((entry) => (
                      <Cell key={entry.name} fill={projectColor(entry.name)} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value, _name, props) => [
                      `${formatTokens(Number(value))} (${props.payload.pct}%)`,
                      props.payload.name,
                    ]}
                    contentStyle={{
                      fontFamily: 'JetBrains Mono',
                      fontSize: 10,
                      border: '2px solid #2a2a2a',
                      boxShadow: '2px 2px 0 #2a2a2a',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              {/* Legend */}
              <div className="flex flex-col gap-1.5 text-[10px] flex-1 min-w-0">
                {projectData.map((entry) => (
                  <div key={entry.name} className="flex items-center gap-1.5 min-w-0">
                    <div
                      className="shrink-0"
                      style={{
                        width: 8,
                        height: 8,
                        backgroundColor: projectColor(entry.name),
                        border: '1px solid #2a2a2a',
                      }}
                    />
                    <span className="truncate text-text-muted">{entry.name}</span>
                    <span className="shrink-0 font-bold ml-auto">{entry.pct}%</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-[10px] text-text-muted italic">No project data</p>
          )}
        </div>
      </div>
    </div>
  );
}
