import { useMemo } from 'react';
import { useSessionData } from '../hooks/useSessionData';
import { useUsageData } from '../hooks/useUsageData';
import { formatTokens } from '../utils/format';

const CYCLE_HOURS = 5;
const CYCLE_MS = CYCLE_HOURS * 60 * 60 * 1000;
// Updated: Claude promotional increase — budget significantly raised
const CYCLE_TOKEN_BUDGET = 15_000_000;

interface ProjectFitness {
  name: string;
  avgTokens: number;
  typicalModel: string;
  sessionCount: number;
  fitness: 'ok' | 'tight' | 'insufficient';
}

export function CyclePlanner() {
  const { data: sessions } = useSessionData();
  const { data: usageLogs } = useUsageData();

  const cycle = useMemo(() => {
    // Find today's date in CN timezone (usage-log uses tsCN)
    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);

    // Find first start event today from usage log
    const todayStarts = usageLogs.filter(
      e => e.event === 'start' && e.tsCN.startsWith(todayStr)
    );

    let cycleStartMs: number;
    if (todayStarts.length > 0) {
      // Parse the CN time for the first start
      cycleStartMs = new Date(todayStarts[0].tsCN).getTime();
    } else {
      // Default: assume cycle starts now
      cycleStartMs = now.getTime();
    }

    const cycleEndMs = cycleStartMs + CYCLE_MS;
    const elapsed = Math.max(0, now.getTime() - cycleStartMs);
    const remaining = Math.max(0, cycleEndMs - now.getTime());
    const progress = Math.min(1, elapsed / CYCLE_MS);

    // Estimate tokens used today from sessions
    const todaySessions = sessions.filter(s => s.date === todayStr);
    const tokensUsedToday = todaySessions.reduce((s, e) => s + e.tokenUsed, 0);
    const tokensRemaining = Math.max(0, CYCLE_TOKEN_BUDGET - tokensUsedToday);

    // Format times
    const formatTime = (ms: number) => {
      const d = new Date(ms);
      return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    };

    const formatRemaining = (ms: number) => {
      const h = Math.floor(ms / 3600000);
      const m = Math.floor((ms % 3600000) / 60000);
      return `${h}h ${m}m`;
    };

    // Count today's cycles (each 5h window)
    const cycleNumber = todayStarts.length > 0
      ? Math.floor(elapsed / CYCLE_MS) + 1
      : 1;

    return {
      startTime: formatTime(cycleStartMs),
      endTime: formatTime(cycleEndMs),
      currentTime: formatTime(now.getTime()),
      progress,
      elapsed: formatRemaining(elapsed),
      remaining: formatRemaining(remaining),
      tokensUsed: tokensUsedToday,
      tokensRemaining,
      sessionCount: todaySessions.length,
      cycleNumber,
    };
  }, [sessions, usageLogs]);

  const projectFitness = useMemo<ProjectFitness[]>(() => {
    // Compute average token consumption per project from sessions
    const projectStats: Record<string, { totalTokens: number; count: number; models: Record<string, number> }> = {};

    for (const session of sessions) {
      for (const project of session.projectsTouched) {
        if (!projectStats[project]) {
          projectStats[project] = { totalTokens: 0, count: 0, models: {} };
        }
        // Split tokens evenly among projects in the session
        const share = session.tokenUsed / session.projectsTouched.length;
        projectStats[project].totalTokens += share;
        projectStats[project].count += 1;
        projectStats[project].models[session.model] = (projectStats[project].models[session.model] || 0) + 1;
      }
    }

    return Object.entries(projectStats)
      .map(([name, stats]) => {
        const avgTokens = Math.round(stats.totalTokens / stats.count);
        // Determine typical model (most frequent)
        const typicalModel = Object.entries(stats.models)
          .sort((a, b) => b[1] - a[1])[0]?.[0] || 'sonnet';
        // Fitness based on remaining tokens
        const ratio = cycle.tokensRemaining > 0 ? avgTokens / cycle.tokensRemaining : 2;
        const fitness: ProjectFitness['fitness'] =
          ratio <= 0.5 ? 'ok' : ratio <= 0.8 ? 'tight' : 'insufficient';

        return { name, avgTokens, typicalModel, sessionCount: stats.count, fitness };
      })
      .sort((a, b) => a.avgTokens - b.avgTokens);
  }, [sessions, cycle.tokensRemaining]);

  const fitnessDisplay: Record<ProjectFitness['fitness'], { label: string; cls: string }> = {
    ok:           { label: 'OK',  cls: 'text-health-a-minus' },
    tight:        { label: '!!',  cls: 'text-amber' },
    insufficient: { label: 'NO',  cls: 'text-[#ef4444]' },
  };

  const modelDisplay: Record<string, { label: string; cls: string }> = {
    haiku:  { label: 'Haiku',  cls: 'text-health-a-minus' },
    sonnet: { label: 'Sonnet', cls: 'text-amber' },
    opus:   { label: 'Opus',   cls: 'text-[#c084fc]' },
  };

  return (
    <div className="pixel-border bg-card-bg p-4">
      <div className="flex items-center justify-between mb-1">
        <h2 className="font-pixel text-[10px] text-text-main">CYCLE PROGRESS</h2>
        <div className="flex items-center gap-3 text-[10px] text-text-muted">
          <span>周期 #{cycle.cycleNumber}</span>
          <span className="text-grid-dot">·</span>
          <span>{cycle.sessionCount} sessions</span>
        </div>
      </div>
      <p className="text-[10px] text-text-muted mb-4">
        5h 使用周期 — 额度 {formatTokens(CYCLE_TOKEN_BUDGET)} · 利用率 {cycle.tokensRemaining > 0 ? Math.round((cycle.tokensUsed / CYCLE_TOKEN_BUDGET) * 100) : 100}%
      </p>

      {/* Progress bar */}
      <div className="mb-4">
        <div className="flex items-center justify-between text-[10px] text-text-muted mb-1" style={{ fontFamily: 'JetBrains Mono' }}>
          <span>{cycle.startTime}</span>
          <span className="text-text-main font-bold">{cycle.currentTime}</span>
          <span>{cycle.endTime}</span>
        </div>
        <div className="w-full h-4 bg-board-bg border-2 border-pixel-black relative" style={{ imageRendering: 'pixelated' }}>
          {/* Elapsed portion */}
          <div
            className="absolute inset-y-0 left-0 bg-amber"
            style={{ width: `${Math.round(cycle.progress * 100)}%`, transition: 'width 0.3s' }}
          />
          {/* Current position marker */}
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-text-main"
            style={{ left: `${Math.round(cycle.progress * 100)}%` }}
          />
        </div>
        <div className="flex items-center justify-between text-[10px] mt-1">
          <span className="text-text-muted">
            elapsed: <span className="text-text-main font-bold">{cycle.elapsed}</span>
          </span>
          <span className="text-text-muted">
            remaining: <span className="text-amber font-bold">{cycle.remaining}</span>
          </span>
        </div>
      </div>

      {/* Token summary */}
      <div className="flex items-center gap-4 mb-4 text-[11px]" style={{ fontFamily: 'JetBrains Mono' }}>
        <div>
          <span className="font-pixel text-[8px] text-text-muted">USED</span>
          <div className="font-bold">{formatTokens(cycle.tokensUsed)}</div>
        </div>
        <div className="text-grid-dot">|</div>
        <div>
          <span className="font-pixel text-[8px] text-text-muted">REMAINING</span>
          <div className="font-bold text-amber">{formatTokens(cycle.tokensRemaining)}</div>
        </div>
        <div className="text-grid-dot">|</div>
        <div>
          <span className="font-pixel text-[8px] text-text-muted">BUDGET</span>
          <div className="font-bold">{formatTokens(CYCLE_TOKEN_BUDGET)}</div>
        </div>
      </div>

      {/* Project fitness table */}
      {projectFitness.length > 0 && (
        <div className="border-t-2 border-dashed border-grid-dot pt-3">
          <div className="font-pixel text-[8px] text-text-muted mb-2">PROJECT FITNESS</div>
          <div className="overflow-x-auto">
            <table className="w-full text-[11px]" style={{ fontFamily: 'JetBrains Mono' }}>
              <thead>
                <tr className="text-text-muted text-left font-pixel text-[7px]">
                  <th className="pb-1 pr-3">PROJECT</th>
                  <th className="pb-1 pr-3">AVG TOKENS</th>
                  <th className="pb-1 pr-3">MODEL</th>
                  <th className="pb-1 pr-3">SESSIONS</th>
                  <th className="pb-1">FIT</th>
                </tr>
              </thead>
              <tbody>
                {projectFitness.map(pf => {
                  const fit = fitnessDisplay[pf.fitness];
                  const model = modelDisplay[pf.typicalModel] ?? { label: pf.typicalModel, cls: 'text-text-muted' };
                  return (
                    <tr key={pf.name} className="border-t border-grid-dot/30">
                      <td className="py-1 pr-3 text-text-main">{pf.name}</td>
                      <td className="py-1 pr-3">{formatTokens(pf.avgTokens)}</td>
                      <td className={`py-1 pr-3 ${model.cls}`}>{model.label}</td>
                      <td className="py-1 pr-3 text-text-muted">{pf.sessionCount}</td>
                      <td className={`py-1 font-pixel text-[8px] ${fit.cls}`}>{fit.label}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
