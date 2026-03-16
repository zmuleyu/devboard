import { useMemo } from 'react';
import { usePortfolioData } from '../hooks/usePortfolioData';
import { useSessionData } from '../hooks/useSessionData';
import { formatTokens } from '../utils/format';
import { daysSince } from '../utils/format';

interface ScoredProject {
  name: string;
  todo: string;
  urgency: 'critical' | 'suggested' | 'optional';
  urgencyScore: number;
  estimatedTokens: number;
  reason: string;
  lastTouched: string; // "today" | "2d ago" | etc.
}

export function TaskSuggestions() {
  const { data: portfolio } = usePortfolioData();
  const { data: sessions } = useSessionData();

  const suggestions = useMemo<ScoredProject[]>(() => {
    const today = new Date().toISOString().slice(0, 10);

    // Build session stats per project
    const projectStats: Record<string, {
      totalTokens: number;
      count: number;
      lastDate: string;
      touchedToday: boolean;
    }> = {};

    for (const session of sessions) {
      for (const project of session.projectsTouched) {
        if (!projectStats[project]) {
          projectStats[project] = { totalTokens: 0, count: 0, lastDate: '', touchedToday: false };
        }
        const share = session.tokenUsed / session.projectsTouched.length;
        projectStats[project].totalTokens += share;
        projectStats[project].count += 1;
        if (session.date > projectStats[project].lastDate) {
          projectStats[project].lastDate = session.date;
        }
        if (session.date === today) {
          projectStats[project].touchedToday = true;
        }
      }
    }

    return portfolio.projects
      .filter(p => p.status !== 'completed')
      .map(p => {
        const stats = projectStats[p.name];
        const avgTokens = stats ? Math.round(stats.totalTokens / stats.count) : 500_000;
        const touchedToday = stats?.touchedToday ?? false;

        // --- Urgency score (0-100, weight 40%) ---
        let urgencyScore = 0;
        let reason = '';

        // Timeline deadline
        if (p.timeline?.target) {
          const daysLeft = Math.ceil(
            (new Date(p.timeline.target).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
          );
          if (daysLeft < 0) {
            urgencyScore += 40;
            reason = `目标日已过期 ${Math.abs(daysLeft)} 天`;
          } else if (daysLeft <= 7) {
            urgencyScore += 30;
            reason = `目标日临近，剩 ${daysLeft} 天`;
          }
        }

        // Health degradation
        if (p.healthTrend === '↓') {
          urgencyScore += 20;
          if (!reason) reason = `健康度下降 (${p.health})`;
        }

        // Uncommitted changes
        if (p.uncommittedChanges > 0) {
          urgencyScore += 15;
          if (!reason) reason = `${p.uncommittedChanges} 处未提交变更`;
        }

        // Long inactive
        const inactive = daysSince(p.lastCommitDate);
        if (inactive > 14 && p.status !== 'paused') {
          urgencyScore += 10;
          if (!reason) reason = `${inactive} 天无提交`;
        }

        // --- Cost efficiency score (0-100, weight 30%) ---
        // Lower token cost = higher efficiency score
        const costScore = avgTokens < 500_000 ? 80
          : avgTokens < 1_000_000 ? 60
          : avgTokens < 2_000_000 ? 40
          : 20;

        // --- Context switch cost (0-100, weight 30%) ---
        // Recently touched = low switch cost = high score
        const switchScore = touchedToday ? 90
          : stats?.lastDate === today ? 80
          : inactive <= 1 ? 70
          : inactive <= 3 ? 50
          : inactive <= 7 ? 30
          : 10;

        if (!reason && touchedToday) reason = '刚做过，切换成本低';
        if (!reason && p.topTodo && p.topTodo !== '-') reason = `待办: ${p.topTodo}`;
        if (!reason) reason = '可安排';

        // Composite score
        const totalScore = urgencyScore * 0.4 + costScore * 0.3 + switchScore * 0.3;

        // Urgency label
        const urgency: ScoredProject['urgency'] =
          urgencyScore >= 30 ? 'critical'
          : urgencyScore >= 15 ? 'suggested'
          : 'optional';

        // Last touched display
        const lastTouched = touchedToday ? '今天'
          : stats?.lastDate ? `${daysSince(stats.lastDate)}d ago`
          : '无记录';

        return {
          name: p.name,
          todo: p.topTodo || '-',
          urgency,
          urgencyScore: totalScore,
          estimatedTokens: avgTokens,
          reason,
          lastTouched,
        };
      })
      .sort((a, b) => b.urgencyScore - a.urgencyScore);
  }, [portfolio, sessions]);

  const urgencyDisplay = {
    critical:  { label: '紧急', bg: 'bg-[#ef4444]/20', text: 'text-[#f87171]', dot: '#f87171' },
    suggested: { label: '建议', bg: 'bg-amber/20', text: 'text-amber', dot: '#fbbf24' },
    optional:  { label: '可选', bg: 'bg-[#86efac]/20', text: 'text-[#86efac]', dot: '#86efac' },
  };

  return (
    <div className="pixel-border bg-card-bg p-4">
      <div className="flex items-center justify-between mb-1">
        <h2 className="font-pixel text-[10px] text-text-main">TASK SUGGESTIONS</h2>
        <span className="text-[10px] text-text-muted">{suggestions.length} 个活跃项目</span>
      </div>
      <p className="text-[10px] text-text-muted mb-4">
        基于紧急度 · 成本效率 · 上下文切换成本的综合排序
      </p>

      <div className="space-y-2">
        {suggestions.map((s) => {
          const u = urgencyDisplay[s.urgency];
          return (
            <div
              key={s.name}
              className="pixel-border bg-board-bg p-3 flex items-start gap-3"
              style={{ borderLeftColor: u.dot, borderLeftWidth: 3 }}
            >
              {/* Left: urgency badge + project info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-pixel text-[9px] text-text-main">{s.name}</span>
                  <span className={`text-[8px] px-1.5 py-0.5 rounded ${u.bg} ${u.text} font-pixel`}>
                    {u.label}
                  </span>
                </div>
                <div className="text-[10px] text-text-muted truncate">{s.reason}</div>
                {s.todo !== '-' && (
                  <div className="text-[10px] text-amber mt-0.5 truncate">
                    TODO: {s.todo}
                  </div>
                )}
              </div>

              {/* Right: stats */}
              <div className="text-right shrink-0 text-[10px]" style={{ fontFamily: 'JetBrains Mono' }}>
                <div className="text-text-muted">~{formatTokens(s.estimatedTokens)}</div>
                <div className="text-text-muted">{s.lastTouched}</div>
              </div>
            </div>
          );
        })}
      </div>

      {suggestions.length === 0 && (
        <p className="text-[10px] text-text-muted italic text-center py-4">
          无活跃项目数据
        </p>
      )}
    </div>
  );
}
