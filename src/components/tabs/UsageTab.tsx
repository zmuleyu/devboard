import { TokenAnalytics } from '../TokenAnalytics';
import { BudgetForecast } from '../BudgetForecast';
import { SessionLog } from '../SessionLog';
import { UsageDashboard } from '../UsageDashboard';

interface Props {
  selectedProject: string | null;
  onSelectProject: (p: string | null) => void;
}

export default function AnalyticsTab({ selectedProject, onSelectProject }: Props) {
  return (
    <>
      <TokenAnalytics />
      <hr className="pixel-divider my-8" />
      <BudgetForecast />
      <hr className="pixel-divider my-8" />
      <SessionLog selectedProject={selectedProject} onSelectProject={onSelectProject} />
      <hr className="pixel-divider my-8" />
      <UsageDashboard />
    </>
  );
}
