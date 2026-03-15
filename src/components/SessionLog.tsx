import { useMemo, useState } from 'react';
import { useSessionData } from '../hooks/useSessionData';
import { MODEL_COLORS, projectColor } from '../theme';
import { formatTokens } from '../utils/format';

const MODEL_TEXT: Record<string, string> = {
  haiku:  'bg-health-a-minus text-pixel-black',
  sonnet: 'bg-amber text-card-bg',
  opus:   'bg-pixel-black text-card-bg',
};

interface SessionLogProps {
  selectedProject?: string | null;
  onSelectProject?: (name: string | null) => void;
}

export function SessionLog({ selectedProject, onSelectProject }: SessionLogProps) {
  const { data } = useSessionData();
  const [filterModel, setFilterModel] = useState<string | null>(null);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  // Sync external selectedProject into local project filter
  const effectiveProjectFilter = selectedProject ?? null;

  const allProjects = useMemo(() => {
    const set = new Set<string>();
    data.forEach((d) => d.projectsTouched.forEach((p) => set.add(p)));
    return Array.from(set).sort();
  }, [data]);

  const filtered = useMemo(() => {
    return data.filter((d) => {
      if (filterModel && d.model !== filterModel) return false;
      if (effectiveProjectFilter && !d.projectsTouched.includes(effectiveProjectFilter)) return false;
      return true;
    });
  }, [data, filterModel, effectiveProjectFilter]);

  const stats = useMemo(() => {
    const totalTokens = data.reduce((s, d) => s + d.tokenUsed, 0);
    const totalCommits = data.reduce((s, d) => s + d.commitsCreated, 0);
    const projectCounts: Record<string, number> = {};
    data.forEach((d) =>
      d.projectsTouched.forEach((p) => {
        projectCounts[p] = (projectCounts[p] || 0) + 1;
      })
    );
    const topProject = Object.entries(projectCounts).sort((a, b) => b[1] - a[1])[0];
    return { sessionCount: data.length, totalTokens, totalCommits, topProject: topProject?.[0] ?? '-' };
  }, [data]);

  return (
    <div className="pixel-border bg-card-bg p-4">
      <h2 className="font-pixel text-[10px] mb-1">会话日志</h2>
      <p className="text-[10px] text-text-muted mb-4">记录每次开发会话的时长、模型和工作摘要</p>

      {/* Stats bar */}
      <div className="flex flex-wrap gap-4 mb-4 text-[11px]">
        <div><span className="text-text-muted">会话：</span><span className="font-bold">{stats.sessionCount} 次</span></div>
        <div><span className="text-text-muted">Token：</span><span className="font-bold">{formatTokens(stats.totalTokens)}</span></div>
        <div><span className="text-text-muted">提交：</span><span className="font-bold">{stats.totalCommits} 次</span></div>
        <div><span className="text-text-muted">主力项目：</span><span className="font-bold text-amber">{stats.topProject}</span></div>
      </div>

      <hr className="pixel-divider mb-3" />

      {/* Filter chips */}
      <div className="flex flex-wrap gap-2 mb-3">
        {/* Project chips */}
        {allProjects.map((p) => {
          const active = effectiveProjectFilter === p;
          return (
            <button
              key={p}
              onClick={() => onSelectProject?.(active ? null : p)}
              className="text-[9px] px-2 py-0.5 border transition-opacity"
              style={{
                borderColor: projectColor(p),
                color: active ? '#f5f4f1' : projectColor(p),
                backgroundColor: active ? projectColor(p) : 'transparent',
                opacity: effectiveProjectFilter && !active ? 0.4 : 1,
              }}
            >
              {p}
            </button>
          );
        })}

        {/* Divider */}
        {allProjects.length > 0 && <span className="text-text-muted text-[9px] self-center">|</span>}

        {/* Model chips */}
        {(['haiku', 'sonnet', 'opus'] as const).map((m) => {
          const active = filterModel === m;
          return (
            <button
              key={m}
              onClick={() => setFilterModel(active ? null : m)}
              className="font-pixel text-[7px] px-1.5 py-0.5 transition-opacity"
              style={{
                backgroundColor: active ? MODEL_COLORS[m] : 'transparent',
                border: `1px solid ${MODEL_COLORS[m]}`,
                color: active ? '#2a2a2a' : MODEL_COLORS[m],
                opacity: filterModel && !active ? 0.4 : 1,
              }}
            >
              {m.toUpperCase()}
            </button>
          );
        })}

        {/* Clear */}
        {(filterModel || effectiveProjectFilter) && (
          <button
            onClick={() => { setFilterModel(null); onSelectProject?.(null); }}
            className="text-[9px] text-text-muted underline"
          >
            清除
          </button>
        )}
      </div>

      {/* Session list */}
      <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
        {filtered.length === 0 ? (
          <p className="text-[11px] text-text-muted italic py-4 text-center">无匹配会话</p>
        ) : (
          filtered.map((session, i) => {
            const expanded = expandedIndex === i;
            return (
              <div
                key={i}
                className="pixel-border-sm bg-board-bg p-3 text-[11px] cursor-pointer"
                onClick={() => setExpandedIndex(expanded ? null : i)}
              >
                {/* Row 1: date + model + tokens */}
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="font-bold">{session.date}</span>
                    <span className="text-text-muted">{session.startTime}</span>
                    <span className={`font-pixel text-[7px] px-1.5 py-0.5 ${MODEL_TEXT[session.model] || ''}`}>
                      {session.model.toUpperCase()}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-text-muted">
                    <span>{session.duration}</span>
                    <span className="font-bold text-text-main">{formatTokens(session.tokenUsed)}</span>
                    <span className="text-[9px]">{expanded ? '▲' : '▼'}</span>
                  </div>
                </div>

                {/* Row 2: summary (expandable) */}
                <p className={`text-text-main mb-1.5 ${expanded ? '' : 'truncate'}`}>
                  {session.summary}
                </p>

                {/* Row 3: projects + commits */}
                <div className="flex items-center justify-between">
                  <div className="flex flex-wrap gap-1">
                    {session.projectsTouched.map((p) => (
                      <button
                        key={p}
                        onClick={(e) => { e.stopPropagation(); onSelectProject?.(effectiveProjectFilter === p ? null : p); }}
                        className="text-[9px] px-1.5 py-0.5 border"
                        style={{
                          borderColor: projectColor(p),
                          color: projectColor(p),
                          backgroundColor: 'transparent',
                        }}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                  <span className="text-text-muted text-[10px]">
                    {session.commitsCreated} 次提交
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
