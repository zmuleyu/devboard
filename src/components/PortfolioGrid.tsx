import { usePortfolioData } from '../hooks/usePortfolioData';
import { ProjectCard } from './ProjectCard';
import type { Ecosystem } from '../types';

const ecosystemOrder: Ecosystem[] = ['cybernium', 'ziyou', 'standalone'];

export function PortfolioGrid() {
  const { data } = usePortfolioData();

  const sorted = [...data.projects].sort(
    (a, b) =>
      ecosystemOrder.indexOf(a.ecosystem) -
      ecosystemOrder.indexOf(b.ecosystem)
  );

  return (
    <section className="relative z-10">
      <div className="flex items-center gap-3 mb-6">
        <h2 className="font-pixel text-[11px] text-text-main">
          PORTFOLIO
        </h2>
        <span className="font-pixel text-[8px] text-text-muted">
          {data.projects.length} projects
        </span>
        <span className="blink" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {sorted.map((project) => (
          <ProjectCard key={project.name} project={project} />
        ))}
      </div>
    </section>
  );
}
