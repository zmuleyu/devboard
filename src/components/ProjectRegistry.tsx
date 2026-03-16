import { useState, useMemo } from 'react';
import { useProjectRegistry, type ProjectRegistryEntry } from '../hooks/useProjectRegistry';
import { usePortfolioData } from '../hooks/usePortfolioData';

type EcoFilter = 'all' | 'cybernium' | 'ziyou' | 'standalone';

const FILTER_TABS: { key: EcoFilter; label: string }[] = [
  { key: 'all', label: 'ALL' },
  { key: 'cybernium', label: 'CYBERNIUM' },
  { key: 'ziyou', label: 'ZIYOU' },
  { key: 'standalone', label: 'STANDALONE' },
];

const PHASE_STYLE: Record<string, { label: string; cls: string }> = {
  '\u6D3B\u8DC3\u5F00\u53D1': { label: 'ACTIVE', cls: 'bg-health-a-minus text-card-bg' },
  '\u7EF4\u62A4':         { label: 'MAINT',  cls: 'bg-amber text-card-bg' },
  '\u5F52\u6863':         { label: 'ARCHIVE', cls: 'bg-mid-gray text-card-bg' },
};

const TYPE_STYLE: Record<string, string> = {
  'Web App':          'bg-[#6366f1]/20 text-[#6366f1]',
  'API Server':       'bg-[#10b981]/20 text-[#10b981]',
  'Browser Extension': 'bg-[#f97316]/20 text-[#f97316]',
  'Chrome Extension':  'bg-[#fb923c]/20 text-[#fb923c]',
  'Mobile App':       'bg-[#f59e0b]/20 text-[#f59e0b]',
  'MCP Server':       'bg-[#c084fc]/20 text-[#c084fc]',
  'Static Site':      'bg-[#60a5fa]/20 text-[#60a5fa]',
  'Documentation':    'bg-[#9ca3af]/20 text-[#9ca3af]',
  'CLI Tool':         'bg-[#14b8a6]/20 text-[#14b8a6]',
};

function hasIssues(entry: ProjectRegistryEntry): boolean {
  return entry.gitRemote === 'none' || !entry.hasClaudeMd || !entry.hasReadme;
}

export function ProjectRegistry() {
  const { data: registry, loading } = useProjectRegistry();
  const { data: portfolio } = usePortfolioData();
  const [filter, setFilter] = useState<EcoFilter>('all');
  const [issuesOnly, setIssuesOnly] = useState(false);
  const [expandedProject, setExpandedProject] = useState<string | null>(null);

  // Merge portfolio data for uncommitted changes info
  const portfolioMap = useMemo(() => {
    const map = new Map<string, { uncommittedChanges: number; health: string; testCount: number }>();
    for (const p of portfolio.projects) {
      map.set(p.name, { uncommittedChanges: p.uncommittedChanges, health: p.health, testCount: p.testCount });
    }
    return map;
  }, [portfolio]);

  const filtered = useMemo(() => {
    let items = registry;
    if (filter !== 'all') {
      items = items.filter(e => e.ecosystem === filter);
    }
    if (issuesOnly) {
      items = items.filter(hasIssues);
    }
    return items;
  }, [registry, filter, issuesOnly]);

  const issueCount = useMemo(() => registry.filter(hasIssues).length, [registry]);

  if (loading) {
    return (
      <div className="pixel-border bg-card-bg p-4">
        <h2 className="font-pixel text-[10px] mb-2">PROJECT REGISTRY</h2>
        <p className="text-center text-[10px] text-text-muted py-8 blink">LOADING...</p>
      </div>
    );
  }

  return (
    <div className="pixel-border bg-card-bg p-4">
      <div className="flex items-center justify-between mb-1">
        <h2 className="font-pixel text-[10px] text-text-main">PROJECT REGISTRY</h2>
        <span className="text-[10px] text-text-muted">{registry.length} projects</span>
      </div>
      <p className="text-[10px] text-text-muted mb-4">
        项目管理总览 - 技术栈、部署、文档状态
      </p>

      {/* Filter tabs */}
      <div className="flex items-center gap-1.5 mb-4 flex-wrap">
        {FILTER_TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`px-2.5 py-1 font-pixel text-[7px] cursor-pointer transition-colors ${
              filter === tab.key
                ? 'bg-pixel-black text-card-bg border-2 border-pixel-black'
                : 'bg-transparent text-text-muted border-2 border-[#706858]/40 hover:border-text-main/60'
            }`}
            style={filter === tab.key ? { boxShadow: '2px 2px 0 #2a2a2a' } : undefined}
          >
            {tab.label}
          </button>
        ))}
        <span className="text-grid-dot mx-1">|</span>
        <button
          onClick={() => setIssuesOnly(!issuesOnly)}
          className={`px-2.5 py-1 font-pixel text-[7px] cursor-pointer transition-colors ${
            issuesOnly
              ? 'bg-[#ef4444] text-card-bg border-2 border-[#ef4444]'
              : 'bg-transparent text-text-muted border-2 border-[#706858]/40 hover:border-text-main/60'
          }`}
        >
          !! {issueCount}
        </button>
      </div>

      {/* Project list */}
      <div className="space-y-0">
        {filtered.map(entry => {
          const isExpanded = expandedProject === entry.name;
          const pData = portfolioMap.get(entry.name);
          const typeStyle = TYPE_STYLE[entry.type] || 'bg-[#9ca3af]/20 text-[#9ca3af]';
          const phaseInfo = PHASE_STYLE[entry.currentPhase] || { label: entry.currentPhase, cls: 'bg-mid-gray text-card-bg' };
          const entryHasIssues = hasIssues(entry);

          return (
            <div key={entry.name} className="border-b border-grid-dot/30 last:border-b-0">
              {/* Row */}
              <button
                className="w-full text-left px-2 py-2.5 flex items-center gap-3 hover:bg-board-bg/50 transition-colors cursor-pointer"
                onClick={() => setExpandedProject(isExpanded ? null : entry.name)}
              >
                {/* Name + type */}
                <div className="flex items-center gap-2 min-w-0 flex-shrink-0" style={{ width: '180px' }}>
                  <span className="text-[11px] text-text-main font-bold truncate">{entry.name}</span>
                  <span className={`px-1.5 py-0.5 text-[8px] font-pixel flex-shrink-0 ${typeStyle}`}>
                    {entry.type.split(' ')[0].toUpperCase()}
                  </span>
                </div>

                {/* Tech stack tags */}
                <div className="flex-1 flex gap-1 flex-wrap min-w-0">
                  {entry.techStack.slice(0, 3).map(tech => (
                    <span
                      key={tech}
                      className="px-1.5 py-0.5 text-[9px] text-text-muted border border-grid-dot/40"
                    >
                      {tech}
                    </span>
                  ))}
                  {entry.techStack.length > 3 && (
                    <span className="text-[9px] text-text-muted">+{entry.techStack.length - 3}</span>
                  )}
                </div>

                {/* Deploy URL */}
                <div className="flex-shrink-0 w-[120px] text-[10px] truncate">
                  {entry.deployUrls.length > 0 ? (
                    <span
                      className="text-[#60a5fa] hover:underline"
                      onClick={(e) => {
                        e.stopPropagation();
                        window.open(`https://${entry.deployUrls[0]}`, '_blank');
                      }}
                    >
                      {entry.deployUrls[0]}
                    </span>
                  ) : (
                    <span className="text-text-muted">-</span>
                  )}
                </div>

                {/* Doc status icons */}
                <div className="flex items-center gap-1.5 flex-shrink-0 text-[10px]">
                  <span title="README" className={entry.hasReadme ? 'text-health-a-minus' : 'text-[#ef4444]'}>
                    R
                  </span>
                  <span title="CLAUDE.md" className={entry.hasClaudeMd ? 'text-health-a-minus' : 'text-[#ef4444]'}>
                    C
                  </span>
                  {entry.specCount > 0 && (
                    <span title="Specs" className="text-[#60a5fa]">{entry.specCount}s</span>
                  )}
                </div>

                {/* Git remote */}
                <div className="flex-shrink-0 w-[50px] text-[10px] text-right">
                  {entry.gitRemote === 'none' ? (
                    <span className="text-[#ef4444] font-pixel text-[7px]">NO-GIT</span>
                  ) : (
                    <span className="text-health-a-minus font-pixel text-[7px]">SYNC</span>
                  )}
                </div>

                {/* Issue indicator */}
                <div className="flex-shrink-0 w-3">
                  {entryHasIssues && <span className="text-[#ef4444] text-[10px]">!</span>}
                </div>
              </button>

              {/* Expanded detail */}
              {isExpanded && (
                <div className="px-3 pb-3 bg-board-bg">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px] pt-2">
                    {/* Left column */}
                    <div className="space-y-2">
                      <div>
                        <span className="font-pixel text-[8px] text-text-muted">DESCRIPTION</span>
                        <p className="text-text-main mt-0.5">{entry.description}</p>
                      </div>

                      {entry.setupCommand && (
                        <div>
                          <span className="font-pixel text-[8px] text-text-muted">SETUP</span>
                          <div
                            className="mt-0.5 px-2 py-1.5 text-[10px] bg-card-bg border-2 border-pixel-black text-text-main overflow-x-auto"
                            style={{ fontFamily: 'JetBrains Mono' }}
                          >
                            {entry.setupCommand}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Right column */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <div>
                          <span className="font-pixel text-[8px] text-text-muted">PHASE</span>
                          <div className="mt-0.5">
                            <span className={`px-2 py-0.5 font-pixel text-[7px] ${phaseInfo.cls}`}>
                              {phaseInfo.label}
                            </span>
                          </div>
                        </div>
                        {entry.version && (
                          <div>
                            <span className="font-pixel text-[8px] text-text-muted">VERSION</span>
                            <div className="mt-0.5 font-bold text-text-main" style={{ fontFamily: 'JetBrains Mono' }}>
                              {entry.version}
                            </div>
                          </div>
                        )}
                        {pData && (
                          <>
                            <div>
                              <span className="font-pixel text-[8px] text-text-muted">HEALTH</span>
                              <div className="mt-0.5 font-bold">{pData.health}</div>
                            </div>
                            <div>
                              <span className="font-pixel text-[8px] text-text-muted">TESTS</span>
                              <div className="mt-0.5 font-bold">{pData.testCount}</div>
                            </div>
                          </>
                        )}
                      </div>

                      {entry.deployUrls.length > 0 && (
                        <div>
                          <span className="font-pixel text-[8px] text-text-muted">DEPLOY URLS</span>
                          <div className="mt-0.5 flex flex-col gap-0.5">
                            {entry.deployUrls.map(url => (
                              <a
                                key={url}
                                href={`https://${url}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[#60a5fa] hover:underline text-[10px]"
                                style={{ fontFamily: 'JetBrains Mono' }}
                              >
                                {url}
                              </a>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Full tech stack */}
                      <div>
                        <span className="font-pixel text-[8px] text-text-muted">TECH STACK</span>
                        <div className="mt-0.5 flex gap-1 flex-wrap">
                          {entry.techStack.map(tech => (
                            <span
                              key={tech}
                              className="px-1.5 py-0.5 text-[9px] text-text-main border border-grid-dot/40 bg-card-bg"
                            >
                              {tech}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <p className="text-center text-[10px] text-text-muted py-6">
          {issuesOnly ? 'No issues found - all clear!' : 'No projects in this ecosystem'}
        </p>
      )}
    </div>
  );
}
