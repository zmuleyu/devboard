import { StatusStrip } from '../StatusStrip';
import { PortfolioGrid } from '../PortfolioGrid';
import { AlertBanner } from '../AlertBanner';
import { RoadmapGantt } from '../RoadmapGantt';

interface Props {
  selectedProject: string | null;
  onSelectProject: (p: string | null) => void;
}

export default function ProjectsTab({ selectedProject, onSelectProject }: Props) {
  return (
    <>
      <RoadmapGantt selectedProject={selectedProject} onSelectProject={onSelectProject} />
      <hr className="pixel-divider my-6" />
      <StatusStrip />
      <AlertBanner />
      <hr className="pixel-divider my-6" />
      <PortfolioGrid selectedProject={selectedProject} onSelectProject={onSelectProject} />
    </>
  );
}
