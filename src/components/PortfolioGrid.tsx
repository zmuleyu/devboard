import { useMemo } from 'react';
import { usePortfolioData } from '../hooks/usePortfolioData';
import { usePortfolioHistory } from '../hooks/usePortfolioHistory';
import { ProjectCard } from './ProjectCard';
import { ECOSYSTEM_LABELS } from '../theme';
import { healthScore } from '../utils/format';
import type { Ecosystem } from '../types';

const ecosystemOrder: Ecosystem[] = ['cybernium', 'ziyou', 'standalone'];

interface PortfolioGridProps {
  selectedProject?: string | null;
  onSelectProject?: (name: string | null) => void;
}

export function PortfolioGrid({ selectedProject, onSelectProject }: PortfolioGridProps) {
  const { data } = usePortfolioData();
  const { data: history } = usePortfolioHistory();

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

  const grouped = ecosystemOrder.reduce<Record<Ecosystem, typeof data.projects>>((acc, eco) => {
    acc[eco] = data.projects.filter((p) => p.ecosystem === eco);
    return acc;
  }, {} as Record<Ecosystem, typeof data.projects>);

  return (
    <section className="relative z-10">
      <div className="flex items-center gap-3 mb-6">
        <h2 className="font-pixel text-[11px] text-text-main">项目全景</h2>
        <span className="font-pixel text-[8px] text-text-muted">{data.projects.length} 个项目</span>
        <span className="blink" />
      </div>

      {ecosystemOrder.map((eco) => {
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
                  onSelect={() => onSelectProject?.(selectedProject === project.name ? null : project.name)}
                  healthHistory={healthHistoryMap[project.name]}
                />
              ))}
            </div>
          </div>
        );
      })}
    </section>
  );
}
