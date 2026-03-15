import { useMemo } from 'react';
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceArea,
} from 'recharts';
import { useCronData } from '../hooks/useCronData';
import { projectColor } from '../theme';
import type { CronResult } from '../types';

const RESULT_COLOR: Record<CronResult, string> = {
  pass: '#4ade80',
  fail: '#ef4444',
  warn: '#fbbf24',
  info: '#60a5fa',
  crash: '#ef4444',
};

const OFF_PEAK_START = 1;
const OFF_PEAK_END = 7;

interface AgentTimelineProps {
  selectedProject: string | null;
}

export function AgentTimeline({ selectedProject }: AgentTimelineProps) {
  const { data } = useCronData();

  // Build scatter data: x = hour (decimal), y = day index, color = result
  const { points, dayLabels, stats } = useMemo(() => {
    const now = new Date();
    const last7 = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(now);
      d.setDate(d.getDate() - (6 - i));
      return d.toISOString().slice(0, 10);
    });

    const filtered = data.filter(
      (d) => !selectedProject || d.project === selectedProject,
    );

    const pts = filtered
      .filter((d) => last7.includes(d.date))
      .map((d) => {
        const [hh, mm] = d.time.split(':').map(Number);
        const hour = hh + mm / 60;
        const dayIdx = last7.indexOf(d.date);
        const isOffPeak = hh >= OFF_PEAK_START && hh < OFF_PEAK_END;
        return {
          x: hour,
          y: dayIdx,
          result: d.result,
          color: RESULT_COLOR[d.result] ?? '#9ca3af',
          projectColor: projectColor(d.project),
          taskName: d.taskName,
          project: d.project,
          detail: d.detail,
          time: d.time,
          date: d.date,
          isOffPeak,
          size: Math.max(40, Math.min(d.durationSec * 3, 200)),
        };
      });

    const offPeakCount = pts.filter((p) => p.isOffPeak).length;
    const passCount = pts.filter((p) => p.result === 'pass').length;
    const failCount = pts.filter((p) => p.result === 'fail').length;

    return {
      points: pts,
      dayLabels: last7.map((d) => d.slice(5)),
      stats: {
        total: pts.length,
        offPeakCount,
        offPeakPct: pts.length > 0 ? Math.round((offPeakCount / pts.length) * 100) : 0,
        passCount,
        failCount,
        passRate: pts.length > 0 ? Math.round((passCount / pts.length) * 100) : 0,
      },
    };
  }, [data, selectedProject]);

  if (points.length === 0) {
    return (
      <div className="pixel-border bg-card-bg p-4">
        <h2 className="font-pixel text-[10px] mb-1">24H AGENT TIMELINE</h2>
        <p className="text-[10px] text-text-muted">
          暂无 7 天内的执行数据。任务执行后将在此展示 24h 活动分布。
        </p>
      </div>
    );
  }

  return (
    <div className="pixel-border bg-card-bg p-4">
      <h2 className="font-pixel text-[10px] mb-1">24H AGENT TIMELINE</h2>
      <p className="text-[10px] text-text-muted mb-4">
        最近 7 天 Agent 活动分布 · 蓝色区域为错峰窗口
      </p>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={180}>
        <ScatterChart margin={{ top: 5, right: 10, bottom: 5, left: 35 }}>
          {/* Off-peak window highlight */}
          <ReferenceArea
            x1={OFF_PEAK_START}
            x2={OFF_PEAK_END}
            y1={-0.5}
            y2={6.5}
            fill="#3b82f6"
            fillOpacity={0.08}
            strokeOpacity={0}
          />
          <XAxis
            type="number"
            dataKey="x"
            domain={[0, 24]}
            ticks={[0, 3, 6, 9, 12, 15, 18, 21, 24]}
            tickFormatter={(v: number) => `${v}h`}
            tick={{ fontSize: 9, fontFamily: 'JetBrains Mono' }}
            stroke="#706858"
          />
          <YAxis
            type="number"
            dataKey="y"
            domain={[-0.5, 6.5]}
            ticks={[0, 1, 2, 3, 4, 5, 6]}
            tickFormatter={(v: number) => dayLabels[v] ?? ''}
            tick={{ fontSize: 9, fontFamily: 'JetBrains Mono' }}
            stroke="#706858"
            width={35}
          />
          <Tooltip
            content={({ payload }) => {
              if (!payload?.[0]) return null;
              const d = payload[0].payload;
              return (
                <div
                  className="bg-card-bg border-2 border-text-main p-2 text-[10px]"
                  style={{ boxShadow: '2px 2px 0 #2a2a2a' }}
                >
                  <div className="font-bold">{d.date} {d.time}</div>
                  <div style={{ color: d.color }}>{d.taskName}</div>
                  <div style={{ color: d.projectColor }}>{d.project}</div>
                  <div className="text-text-muted">{d.detail}</div>
                  {d.isOffPeak && <div className="text-[#3b82f6]">🌙 错峰</div>}
                </div>
              );
            }}
          />
          <Scatter
            data={points}
            shape={(props: { cx?: number; cy?: number; payload?: { color: string } }) => (
              <circle
                cx={props.cx ?? 0}
                cy={props.cy ?? 0}
                r={5}
                fill={props.payload?.color ?? '#888'}
                fillOpacity={0.8}
                stroke={props.payload?.color ?? '#888'}
                strokeWidth={1}
              />
            )}
          />
        </ScatterChart>
      </ResponsiveContainer>

      {/* Stats bar */}
      <div className="flex flex-wrap gap-4 mt-3 text-[11px]">
        <div>
          <span className="text-text-muted">总任务：</span>
          <span className="font-bold">{stats.total}</span>
        </div>
        <div>
          <span className="text-text-muted">通过率：</span>
          <span className="font-bold text-health-a-minus">{stats.passRate}%</span>
        </div>
        <div>
          <span className="text-[#ef4444]">✗ {stats.failCount}</span>
        </div>
        <div>
          <span className="text-text-muted">错峰：</span>
          <span className="text-[#3b82f6] font-bold">{stats.offPeakCount}</span>
          <span className="text-text-muted"> ({stats.offPeakPct}%)</span>
        </div>
      </div>
    </div>
  );
}
