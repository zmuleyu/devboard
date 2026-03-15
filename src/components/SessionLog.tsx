import { useMemo } from 'react';
import { useSessionData } from '../hooks/useSessionData';

const MODEL_STYLES: Record<string, string> = {
  haiku: 'bg-health-a-minus text-pixel-black',
  sonnet: 'bg-amber text-card-bg',
  opus: 'bg-pixel-black text-card-bg',
};

function formatTokens(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(0)}K`;
  return String(value);
}

export function SessionLog() {
  const { data } = useSessionData();

  const stats = useMemo(() => {
    const totalTokens = data.reduce((s, d) => s + d.tokenUsed, 0);
    const totalCommits = data.reduce((s, d) => s + d.commitsCreated, 0);

    // Find most active project
    const projectCounts: Record<string, number> = {};
    data.forEach((d) =>
      d.projectsTouched.forEach((p) => {
        projectCounts[p] = (projectCounts[p] || 0) + 1;
      })
    );
    const topProject = Object.entries(projectCounts).sort(
      (a, b) => b[1] - a[1]
    )[0];

    return {
      sessionCount: data.length,
      totalTokens,
      totalCommits,
      topProject: topProject ? topProject[0] : '-',
    };
  }, [data]);

  return (
    <div className="pixel-border bg-card-bg p-4">
      <h2 className="font-pixel text-[10px] mb-4">SESSION LOG</h2>

      {/* Stats bar */}
      <div className="flex flex-wrap gap-4 mb-4 text-[11px]">
        <div>
          <span className="text-text-muted">sessions: </span>
          <span className="font-bold">{stats.sessionCount}</span>
        </div>
        <div>
          <span className="text-text-muted">tokens: </span>
          <span className="font-bold">{formatTokens(stats.totalTokens)}</span>
        </div>
        <div>
          <span className="text-text-muted">commits: </span>
          <span className="font-bold">{stats.totalCommits}</span>
        </div>
        <div>
          <span className="text-text-muted">top: </span>
          <span className="font-bold text-amber">{stats.topProject}</span>
        </div>
      </div>

      <hr className="pixel-divider mb-3" />

      {/* Session list */}
      <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
        {data.map((session, i) => (
          <div
            key={i}
            className="pixel-border-sm bg-board-bg p-3 text-[11px]"
          >
            {/* Row 1: date + model + tokens */}
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2">
                <span className="font-bold">{session.date}</span>
                <span className="text-text-muted">{session.startTime}</span>
                <span
                  className={`font-pixel text-[7px] px-1.5 py-0.5 ${MODEL_STYLES[session.model] || ''}`}
                >
                  {session.model.toUpperCase()}
                </span>
              </div>
              <div className="flex items-center gap-3 text-text-muted">
                <span>{session.duration}</span>
                <span className="font-bold text-text-main">
                  {formatTokens(session.tokenUsed)}
                </span>
              </div>
            </div>

            {/* Row 2: summary */}
            <p className="text-text-main mb-1.5 truncate">{session.summary}</p>

            {/* Row 3: projects + commits */}
            <div className="flex items-center justify-between">
              <div className="flex flex-wrap gap-1">
                {session.projectsTouched.map((p) => (
                  <span
                    key={p}
                    className="text-[9px] px-1.5 py-0.5 bg-card-bg border border-grid-dot text-text-muted"
                  >
                    {p}
                  </span>
                ))}
              </div>
              <span className="text-text-muted text-[10px]">
                {session.commitsCreated} commit{session.commitsCreated !== 1 ? 's' : ''}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
