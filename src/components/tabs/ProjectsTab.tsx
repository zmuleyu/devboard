import { PortfolioGrid } from '../PortfolioGrid';
import { Timeline } from '../Timeline';
import { ProjectTasks } from '../ProjectTasks';
import { RoadmapGantt } from '../RoadmapGantt';

interface Props {
  selectedProject: string | null;
  onSelectProject: (p: string | null) => void;
}

export default function PortfolioTab({ selectedProject, onSelectProject }: Props) {
  return (
    <>
      <PortfolioGrid selectedProject={selectedProject} onSelectProject={onSelectProject} />
      <hr className="pixel-divider my-8" />
      <Timeline selectedProject={selectedProject} />
      <hr className="pixel-divider my-8" />
      <ProjectTasks selectedProject={selectedProject} />
      <hr className="pixel-divider my-8" />
      <RoadmapGantt selectedProject={selectedProject} onSelectProject={onSelectProject} />
    </>
  );
}
