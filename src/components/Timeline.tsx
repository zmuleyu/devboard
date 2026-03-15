import { useMemo } from 'react';
import { useSessionData } from '../hooks/useSessionData';
import { usePortfolioData } from '../hooks/usePortfolioData';
import { MODEL_COLORS, projectColor } from '../theme';

const MODEL_DOT = MODEL_COLORS;

function getWeekDates(sessions: { date: string }[]): string[] {
  if (sessions.length === 0) return [];
  const dates = sessions.map((s) => s.date);
  const min = dates.reduce((a, b) => (a < b ? a : b));
  const max = dates.reduce((a, b) => (a > b ? a : b));
  const result: string[] = [];
  const d = new Date(min);
  const end = new Date(max);
  while (d <= end) {
    result.push(d.toISOString().slice(0, 10));
    d.setDate(d.getDate() + 1);
  }
  return result;
}

interface TimelineProps {
  selectedProject?: string | null;
}

export function Timeline({ selectedProject }: TimelineProps) {
  const { data: sessions } = useSessionData();
  const { data: portfolio } = usePortfolioData();

  const projects = useMemo(
    () => portfolio.projects.map((p) => p.name),
    [portfolio]
  );

  const dates = useMemo(() => getWeekDates(sessions), [sessions]);

  // Build activity map: project -> date -> sessions
  const activityMap = useMemo(() => {
    const map: Record<string, Record<string, typeof sessions>> = {};
    projects.forEach((p) => (map[p] = {}));
    sessions.forEach((s) => {
      s.projectsTouched.forEach((p) => {
        if (!map[p]) map[p] = {};
        if (!map[p][s.date]) map[p][s.date] = [];
        map[p][s.date].push(s);
      });
    });
    return map;
  }, [sessions, projects]);

  // Show every other date label to avoid crowding
  const labelInterval = Math.max(1, Math.floor(dates.length / 8));

  return (
    <div className="pixel-border bg-card-bg p-4">
      <h2 className="font-pixel text-[10px] mb-1">时间线</h2>
      <p className="text-[10px] text-text-muted mb-4">各项目每日活跃度热图，色块颜色代表使用模型</p>

      <div className="overflow-x-auto">
        <div style={{ minWidth: Math.max(600, dates.length * 28 + 120) }}>
          {/* Date header */}
          <div className="flex" style={{ marginLeft: 120 }}>
            {dates.map((date, i) => (
              <div
                key={date}
                className="text-[8px] text-text-muted text-center"
                style={{ width: 28 }}
              >
                {i % labelInterval === 0 ? date.slice(5) : ''}
              </div>
            ))}
          </div>

          {/* Project rows */}
          {projects.map((project) => {
            const dimmed = selectedProject !== null && selectedProject !== project;
            return (
            <div key={project} className="flex items-center h-7" style={{ opacity: dimmed ? 0.25 : 1, transition: 'opacity 0.15s' }}>
              <div
                className="text-[10px] truncate shrink-0 font-bold"
                style={{ width: 120, color: projectColor(project) }}
                title={project}
              >
                {project}
              </div>
              <div className="flex items-center">
                {dates.map((date) => {
                  const daySessions = activityMap[project]?.[date];
                  return (
                    <div
                      key={date}
                      className="flex items-center justify-center"
                      style={{ width: 28, height: 28 }}
                    >
                      {daySessions ? (
                        <div className="relative group">
                          <div
                            className="rounded-sm"
                            style={{
                              width: Math.min(8 + daySessions.length * 4, 18),
                              height: Math.min(8 + daySessions.length * 4, 18),
                              backgroundColor:
                                MODEL_DOT[
                                  daySessions[daySessions.length - 1].model
                                ] || '#e8834a',
                              border: '1px solid #2a2a2a',
                            }}
                          />
                          {/* Tooltip */}
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block z-50 pixel-border-sm bg-card-bg p-2 whitespace-nowrap text-[9px]">
                            <div className="font-bold mb-1">
                              {project} · {date}
                            </div>
                            {daySessions.map((s, i) => (
                              <div key={i} className="text-text-muted">
                                {s.model} · {s.duration} · {s.summary.slice(0, 40)}...
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div
                          className="rounded-sm bg-grid-dot"
                          style={{ width: 4, height: 4, opacity: 0.3 }}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-3 text-[9px] text-text-muted">
        {Object.entries(MODEL_DOT).map(([model, color]) => (
          <div key={model} className="flex items-center gap-1">
            <div
              className="rounded-sm"
              style={{
                width: 8,
                height: 8,
                backgroundColor: color,
                border: '1px solid #2a2a2a',
              }}
            />
            {model}
          </div>
        ))}
        <span className="ml-2">色块大小 = 会话次数</span>
      </div>
    </div>
  );
}
