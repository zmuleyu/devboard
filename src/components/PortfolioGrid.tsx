import { useMemo, useState } from 'react';
import { usePortfolioData } from '../hooks/usePortfolioData';
import { usePortfolioHistory } from '../hooks/usePortfolioHistory';
import { ProjectCard } from './ProjectCard';
import { ProjectDetail } from './ProjectDetail';
import { ECOSYSTEM_LABELS } from '../theme';
import { healthScore } from '../utils/format';
import type { Ecosystem } from '../types';

const ecosystemOrder: Ecosystem[] = ['cybernium', 'ziyou', 'standalone'];

type FilterKey = Ecosystem | 'all';
const FILTER_TABS: { key: FilterKey; label: string }[] = [
  { key: 'all', label: 'ALL' },
  { key: 'cybernium', label: 'CYBERNIUM' },
  { key: 'ziyou', label: 'ZIYOU' },
  { key: 'standalone', label: 'STANDALONE' },
];

interface PortfolioGridProps {
  selectedProject?: string | null;
  onSelectProject?: (name: string | null) => void;
}

export function PortfolioGrid({ selectedProject, onSelectProject }: PortfolioGridProps) {
  const { data } = usePortfolioData();
  const { data: history } = usePortfolioHistory();
  const [filter, setFilter] = useState<FilterKey>('all');
  const [detailProject, setDetailProject] = useState<string | null>(null);

  // Build Map<projectName, healthScore[]> from portfolio history
  const healthHistoryMap = useMemo(() => {
    const map: Record<string, number[]> = {};
    history.forEach((snapshot) => {
      snapshot.projects.forEach((p) => {
        if (!map[p.name]) map[p.name] = [];
        map[p.name].push(healthScore(p.health));
      });
    });
    return map;
  }, [history]);

  const visibleEcosystems = filter === 'all' ? ecosystemOrder : [filter];

  const grouped = ecosystemOrder.reduce<Record<Ecosystem, typeof data.projects>>((acc, eco) => {
    acc[eco] = data.projects.filter((p) => p.ecosystem === eco);
    return acc;
  }, {} as Record<Ecosystem, typeof data.projects>);

  const detailProjectData = useMemo(() => {
    if (!detailProject) return null;
    return data.projects.find(p => p.name === detailProject) ?? null;
  }, [detailProject, data.projects]);

  const handleCardClick = (name: string) => {
    // Toggle detail panel
    const newDetail = detailProject === name ? null : name;
    setDetailProject(newDetail);
    // Also propagate selection up for cross-component filtering
    onSelectProject?.(selectedProject === name ? null : name);
  };

  return (
    <section className="relative z-10">
      <div className="flex items-center gap-3 mb-4">
        <h2 className="font-pixel text-[11px] text-text-main">{'\u9879\u76EE\u5168\u666F'}</h2>
        <span className="font-pixel text-[8px] text-text-muted">{data.projects.length} {'\u4E2A\u9879\u76EE'}</span>
        <span className="blink" />
      </div>

      {/* Ecosystem filter tabs */}
      <div className="flex gap-1.5 mb-6">
        {FILTER_TABS.map((tab) => (
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
      </div>

      {visibleEcosystems.map((eco) => {
        const projects = grouped[eco];
        if (!projects?.length) return null;
        return (
          <div key={eco} className="mb-8">
            {/* Ecosystem header */}
            <div className="flex items-center gap-3 mb-3">
              <span className="font-pixel text-[8px] text-text-muted">{ECOSYSTEM_LABELS[eco]}</span>
              <div className="flex-1 border-t border-dashed border-grid-dot" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {projects.map((project) => (
                <ProjectCard
                  key={project.name}
                  project={project}
                  isSelected={selectedProject === project.name}
                  onSelect={() => handleCardClick(project.name)}
                  healthHistory={healthHistoryMap[project.name]}
                />
              ))}
            </div>
          </div>
        );
      })}

      {/* Project Detail panel */}
      {detailProjectData && (
        <ProjectDetail
          project={detailProjectData}
          onClose={() => {
            setDetailProject(null);
            onSelectProject?.(null);
          }}
        />
      )}
    </section>
  );
}
