import { useMemo, useState } from 'react';
import { usePortfolioData } from '../hooks/usePortfolioData';
import { projectColor } from '../theme';
import type { Ecosystem, ProjectStatus } from '../types';

const ecosystemOrder: Ecosystem[] = ['cybernium', 'ziyou', 'standalone'];
const ecosystemLabels: Record<Ecosystem, string> = {
  cybernium: 'CYBERNIUM',
  ziyou: 'ZIYOU',
  standalone: 'STANDALONE',
};

const WEEKS = 8;
const MS_PER_DAY = 1000 * 60 * 60 * 24;

function getWindowDates() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const start = new Date(today.getTime() - 28 * MS_PER_DAY);
  const end = new Date(today.getTime() + 28 * MS_PER_DAY);
  return { today, start, end, span: end.getTime() - start.getTime() };
}

function weekLabels(windowStart: Date): string[] {
  const labels: string[] = [];
  for (let i = 0; i < WEEKS; i++) {
    const d = new Date(windowStart.getTime() + i * 7 * MS_PER_DAY);
    labels.push(`${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`);
  }
  return labels;
}

function barPosition(start: string, target: string, windowStart: Date, windowSpan: number) {
  const s = Math.max(new Date(start).getTime(), windowStart.getTime());
  const e = Math.min(new Date(target).getTime(), windowStart.getTime() + windowSpan);
  if (e <= s) return null;
  const left = ((s - windowStart.getTime()) / windowSpan) * 100;
  const width = ((e - s) / windowSpan) * 100;
  return { left: `${left}%`, width: `${width}%` };
}

interface RoadmapGanttProps {
  selectedProject?: string | null;
  onSelectProject?: (name: string | null) => void;
}

export function RoadmapGantt({ selectedProject, onSelectProject }: RoadmapGanttProps) {
  const { data } = usePortfolioData();
  const [expandedProject, setExpandedProject] = useState<string | null>(null);

  const win = useMemo(getWindowDates, []);
  const labels = useMemo(() => weekLabels(win.start), [win.start]);
  const todayPct = useMemo(
    () => ((win.today.getTime() - win.start.getTime()) / win.span) * 100,
    [win],
  );

  const grouped = useMemo(() => {
    return ecosystemOrder.reduce<Record<Ecosystem, ProjectStatus[]>>((acc, eco) => {
      acc[eco] = data.projects.filter((p) => p.ecosystem === eco);
      return acc;
    }, {} as Record<Ecosystem, ProjectStatus[]>);
  }, [data.projects]);

  const handleRowClick = (name: string) => {
    setExpandedProject(expandedProject === name ? null : name);
    onSelectProject?.(selectedProject === name ? null : name);
  };

  return (
    <div className="pixel-border bg-card-bg p-4">
      <h2 className="font-pixel text-[12px] mb-1">项目路线图</h2>
      <p className="text-[11px] text-text-muted mb-4">8周滚动视窗 · 点击项目行查看详情</p>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-[10px] text-text-muted mb-4">
        <span className="flex items-center gap-1">
          <span className="w-3 h-2 rounded-sm" style={{ background: '#4ade80' }} /> 进行中
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-2 rounded-sm" style={{ background: '#ef4444' }} /> 超期
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-2 rounded-sm border border-dashed border-text-muted" /> 规划中
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-2 rounded-sm" style={{ background: '#4ade80', opacity: 0.4 }} /> 已完成
        </span>
        <span className="flex items-center gap-1">
          <span className="font-bold" style={{ color: '#e8834a' }}>|</span> 今天
        </span>
      </div>

      {/* Chart */}
      <div className="overflow-x-auto">
        {/* Week headers */}
        <div className="flex ml-[140px] mb-1 border-b-2 border-grid-dot pb-1.5">
          {labels.map((label, i) => (
            <div
              key={i}
              className="flex-1 text-center text-[10px] min-w-[60px]"
              style={{
                color: i === Math.floor(WEEKS * todayPct / 100) ? '#e8834a' : undefined,
                fontWeight: i === Math.floor(WEEKS * todayPct / 100) ? 'bold' : undefined,
              }}
            >
              {label}
            </div>
          ))}
        </div>

        <div className="relative">
          {/* Grid lines */}
          {Array.from({ length: WEEKS }, (_, i) => (
            <div
              key={i}
              className="absolute top-0 bottom-0 w-px bg-grid-dot opacity-40"
              style={{ left: `calc(140px + ${(i / WEEKS) * 100}% * (1 - 140px / 100%))` }}
            />
          ))}

          {/* Today line */}
          <div
            className="absolute top-0 bottom-0 w-0.5 z-10 opacity-80"
            style={{ left: `calc(140px + ${todayPct}% * (1 - 140px / 100%))`, background: '#e8834a' }}
          >
            <span className="absolute -top-4 -left-2.5 font-pixel text-[6px]" style={{ color: '#e8834a' }}>
              今天
            </span>
          </div>

          {/* Ecosystem groups */}
          {ecosystemOrder.map((eco) => {
            const projects = grouped[eco];
            if (!projects?.length) return null;
            return (
              <div key={eco}>
                {/* Ecosystem label */}
                <div className="flex items-center gap-2 pt-3 pb-1.5">
                  <span className="font-pixel text-[7px] text-text-muted">{ecosystemLabels[eco]}</span>
                  <div className="flex-1 border-t border-dashed border-grid-dot" />
                </div>

                {/* Project rows */}
                {projects.map((p) => {
                  const dimmed = selectedProject !== null && selectedProject !== undefined && selectedProject !== p.name;
                  const isExpanded = expandedProject === p.name;
                  const bar = p.timeline ? barPosition(p.timeline.start, p.timeline.target, win.start, win.span) : null;
                  const today = new Date();
                  const isOverdue = p.timeline?.target && new Date(p.timeline.target) < today && p.status !== 'completed';
                  const isPlanned = p.status === 'planned';
                  const isCompleted = p.status === 'completed';
                  const isPaused = p.status === 'paused';

                  let barBg: string;
                  let barStyle: React.CSSProperties = {};
                  if (isOverdue) {
                    barBg = '#ef4444';
                  } else if (isPaused) {
                    barBg = '#9ca3af';
                    barStyle.opacity = 0.4;
                  } else if (isCompleted) {
                    barBg = projectColor(p.name);
                    barStyle.opacity = 0.5;
                  } else {
                    barBg = projectColor(p.name);
                  }

                  return (
                    <div key={p.name}>
                      <div
                        className="flex items-center h-[36px] border-b border-grid-dot/50 cursor-pointer hover:bg-black/[0.02]"
                        style={{ opacity: dimmed ? 0.3 : 1, transition: 'opacity 0.15s' }}
                        onClick={() => handleRowClick(p.name)}
                      >
                        {/* Project name */}
                        <div
                          className="w-[140px] shrink-0 text-[11px] font-bold pr-2 text-right truncate"
                          style={{ color: projectColor(p.name) }}
                        >
                          {p.name}
                        </div>

                        {/* Gantt track */}
                        <div className="flex-1 relative h-[18px] min-w-[480px]">
                          {bar ? (
                            <div
                              className="absolute h-[14px] top-[2px] rounded-sm"
                              style={{
                                left: bar.left,
                                width: bar.width,
                                background: isPlanned ? 'none' : barBg,
                                border: isPlanned ? '1.5px dashed #b5a898' : undefined,
                                ...barStyle,
                              }}
                            >
                              <span
                                className="absolute top-px left-1.5 text-[8px] font-bold whitespace-nowrap overflow-hidden"
                                style={{
                                  color: isPlanned ? '#706858' : '#fff',
                                  textShadow: isPlanned ? 'none' : '1px 1px 0 rgba(0,0,0,0.3)',
                                }}
                              >
                                {p.topTodo}
                              </span>
                              {isOverdue && (
                                <span className="absolute -right-10 top-0 font-pixel text-[6px]" style={{ color: '#ef4444' }}>
                                  超期
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-[9px] text-text-muted absolute top-1 left-2">
                              未设置时间线
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Detail panel */}
                      {isExpanded && (
                        <DetailPanel project={p} />
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function DetailPanel({ project: p }: { project: ProjectStatus }) {
  const today = new Date();

  return (
    <div className="bg-card-bg border-t-2 border-dashed border-grid-dot px-4 py-3 mb-1">
      {/* Timeline */}
      {p.timeline && (
        <div className="mb-3">
          <span className="font-pixel text-[8px] text-text-muted">时间线</span>
          <p className="text-[12px] mt-1">
            {p.timeline.start} → {p.timeline.target}
            <span className="text-text-muted ml-2">
              {(() => {
                const diff = Math.ceil((new Date(p.timeline.target).getTime() - today.getTime()) / MS_PER_DAY);
                if (diff < 0) return `超期${Math.abs(diff)}天`;
                if (diff === 0) return '今天到期';
                return `剩余${diff}天`;
              })()}
            </span>
          </p>
        </div>
      )}

      {/* Milestones */}
      {p.milestones && p.milestones.length > 0 && (
        <div className="mb-3">
          <div className="flex items-center gap-2 mb-2">
            <span className="font-pixel text-[8px] text-text-muted">里程碑</span>
            <div className="flex-1 border-t border-dashed border-grid-dot" />
          </div>
          <div className="space-y-1">
            {p.milestones.map((m, i) => (
              <div key={i} className="flex items-center gap-2 text-[12px]">
                <span
                  className="w-4 h-4 shrink-0 flex items-center justify-center text-[9px]"
                  style={{
                    border: '2px solid #2a2a2a',
                    background: m.done ? '#4ade80' : 'transparent',
                  }}
                >
                  {m.done ? '✓' : ''}
                </span>
                <span className="flex-1">{m.label}</span>
                <span className="text-[10px] text-text-muted">{m.date.slice(5)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Dependencies */}
      {p.dependencies && p.dependencies.length > 0 && (
        <div className="mb-3">
          <div className="flex items-center gap-2 mb-2">
            <span className="font-pixel text-[8px] text-text-muted">项目依赖</span>
            <div className="flex-1 border-t border-dashed border-grid-dot" />
          </div>
          {p.dependencies.map((dep) => (
            <div key={dep} className="flex items-center gap-2 text-[12px]">
              <span className="text-text-muted">→</span>
              <span className="font-bold" style={{ color: projectColor(dep) }}>{dep}</span>
            </div>
          ))}
        </div>
      )}

      {/* Notes */}
      {p.notes && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="font-pixel text-[8px] text-text-muted">开发备注</span>
            <div className="flex-1 border-t border-dashed border-grid-dot" />
          </div>
          <div className="text-[11px] leading-relaxed bg-board-bg p-3 border border-grid-dot whitespace-pre-line">
            {p.notes}
          </div>
        </div>
      )}
    </div>
  );
}
