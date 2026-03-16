import { CronDashboard } from '../CronDashboard';
import { AgentLogViewer } from '../AgentLogViewer';
import { AgentTimeline } from '../AgentTimeline';
import { OffPeakMetrics } from '../OffPeakMetrics';

interface Props {
  selectedProject: string | null;
}

export default function DevOpsTab({ selectedProject }: Props) {
  return (
    <>
      <CronDashboard selectedProject={selectedProject} />
      <hr className="pixel-divider my-8" />
      <AgentLogViewer />
      <hr className="pixel-divider my-8" />
      <AgentTimeline selectedProject={selectedProject} />
      <hr className="pixel-divider my-8" />
      <OffPeakMetrics />
    </>
  );
}
