import { useMemo, useState } from 'react';
import { usePortfolioData } from '../hooks/usePortfolioData';
import { useProjectRegistry } from '../hooks/useProjectRegistry';

interface ActionItem {
  project: string;
  severity: 'critical' | 'warning';
  message: string;
  command?: string;
}

interface CompletedItem {
  project: string;
  message: string;
}

export function RecoveryGuide() {
  const { data: portfolio } = usePortfolioData();
  const { data: registry } = useProjectRegistry();
  const [showCompleted, setShowCompleted] = useState(false);

  const { actions, completed } = useMemo(() => {
    const actionItems: ActionItem[] = [];
    const completedItems: CompletedItem[] = [];

    // Build a lookup from registry by name
    const regMap = new Map(registry.map(r => [r.name, r]));

    for (const project of portfolio.projects) {
      const reg = regMap.get(project.name);
      const issues: ActionItem[] = [];

      // Critical: uncommitted changes
      if (project.uncommittedChanges > 0) {
        const path = project.path.replace(/\\/g, '/');
        issues.push({
          project: project.name,
          severity: 'critical',
          message: `${project.uncommittedChanges} 个未提交变更`,
          command: `cd ${path} && git add -A && git commit -m "wip" && git push`,
        });
      }

      // Critical: no remote
      if (reg && reg.gitRemote === 'none') {
        issues.push({
          project: project.name,
          severity: 'critical',
          message: '无远程仓库 - 本地丢失不可恢复',
          command: 'gh repo create <name> --private && git remote add origin <url> && git push -u origin master',
        });
      }

      // Warning: no CLAUDE.md
      if (reg && !reg.hasClaudeMd) {
        issues.push({
          project: project.name,
          severity: 'warning',
          message: '缺少 CLAUDE.md - 新会话无法恢复上下文',
        });
      }

      // Warning: no README
      if (reg && !reg.hasReadme) {
        issues.push({
          project: project.name,
          severity: 'warning',
          message: '缺少 README.md',
        });
      }

      if (issues.length > 0) {
        actionItems.push(...issues);
      } else {
        completedItems.push({
          project: project.name,
          message: '远程同步 + 文档齐全',
        });
      }
    }

    // Also check registry entries not in portfolio (gaming-compliance, claude-cron, etc.)
    for (const reg of registry) {
      const inPortfolio = portfolio.projects.some(p => p.name === reg.name);
      if (inPortfolio) continue;

      const issues: ActionItem[] = [];

      if (reg.gitRemote === 'none') {
        issues.push({
          project: reg.name,
          severity: 'critical',
          message: '无远程仓库 - 本地丢失不可恢复',
        });
      }
      if (!reg.hasClaudeMd) {
        issues.push({
          project: reg.name,
          severity: 'warning',
          message: '缺少 CLAUDE.md',
        });
      }
      if (!reg.hasReadme) {
        issues.push({
          project: reg.name,
          severity: 'warning',
          message: '缺少 README.md',
        });
      }

      if (issues.length > 0) {
        actionItems.push(...issues);
      } else {
        completedItems.push({
          project: reg.name,
          message: '远程同步 + 文档齐全',
        });
      }
    }

    // Sort: critical first, then warning
    actionItems.sort((a, b) => {
      if (a.severity === b.severity) return a.project.localeCompare(b.project);
      return a.severity === 'critical' ? -1 : 1;
    });

    return { actions: actionItems, completed: completedItems };
  }, [portfolio, registry]);

  const criticalCount = actions.filter(a => a.severity === 'critical').length;
  const warningCount = actions.filter(a => a.severity === 'warning').length;

  // Recovery pack status items
  const packItems = [
    { label: 'MEMORY.md + memory files', ok: true },
    { label: 'Global CLAUDE.md + settings.json', ok: true },
    { label: 'Skills + Hooks', ok: true },
    { label: 'MCP config', ok: true },
  ];

  return (
    <div className="pixel-border bg-card-bg p-4">
      <div className="flex items-center justify-between mb-1">
        <h2 className="font-pixel text-[10px] text-text-main">RECOVERY GUIDE</h2>
        <div className="flex items-center gap-3 text-[10px]">
          {criticalCount > 0 && (
            <span className="text-[#ef4444] font-bold">{criticalCount} CRITICAL</span>
          )}
          {warningCount > 0 && (
            <span className="text-amber font-bold">{warningCount} WARNING</span>
          )}
          {criticalCount === 0 && warningCount === 0 && (
            <span className="text-health-a-minus font-bold">ALL CLEAR</span>
          )}
        </div>
      </div>
      <p className="text-[10px] text-text-muted mb-4">
        灾难恢复就绪度检查 - 确保所有项目可恢复
      </p>

      {/* Action items */}
      {actions.length > 0 && (
        <div className="space-y-2 mb-4">
          {actions.map((item, i) => (
            <div
              key={`${item.project}-${i}`}
              className="flex items-start gap-2 px-3 py-2 text-[11px]"
              style={{
                borderLeft: `3px solid ${item.severity === 'critical' ? '#ef4444' : '#fbbf24'}`,
                backgroundColor: item.severity === 'critical' ? '#ef44440a' : '#fbbf240a',
              }}
            >
              <span className="flex-shrink-0 font-pixel text-[8px] mt-0.5" style={{
                color: item.severity === 'critical' ? '#ef4444' : '#fbbf24',
              }}>
                {item.severity === 'critical' ? '!!' : '!'}
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-text-main">{item.project}</span>
                  <span className="text-text-muted">{item.message}</span>
                </div>
                {item.command && (
                  <div
                    className="mt-1 px-2 py-1 text-[10px] text-text-muted overflow-x-auto"
                    style={{ fontFamily: 'JetBrains Mono', backgroundColor: '#2a2a2a12' }}
                  >
                    {item.command}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Completed items - collapsible */}
      {completed.length > 0 && (
        <div className="mb-4">
          <button
            className="text-[10px] text-text-muted hover:text-text-main transition-colors cursor-pointer"
            onClick={() => setShowCompleted(!showCompleted)}
          >
            {showCompleted ? '▾' : '▸'} {completed.length} 个项目已就绪
          </button>
          {showCompleted && (
            <div className="mt-2 space-y-1">
              {completed.map(item => (
                <div
                  key={item.project}
                  className="flex items-center gap-2 px-3 py-1 text-[10px] text-text-muted"
                >
                  <span className="text-health-a-minus font-pixel text-[8px]">OK</span>
                  <span>{item.project}</span>
                  <span className="text-[9px]">{item.message}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Recovery pack status */}
      <div className="border-t-2 border-dashed border-grid-dot pt-3">
        <div className="font-pixel text-[8px] text-text-muted mb-2">RECOVERY PACK STATUS</div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1">
          {packItems.map(item => (
            <div key={item.label} className="flex items-center gap-2 text-[10px]">
              <span className={item.ok ? 'text-health-a-minus' : 'text-[#ef4444]'}>
                {item.ok ? 'OK' : '!!'}
              </span>
              <span className="text-text-muted">{item.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
