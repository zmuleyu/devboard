import { CyclePlanner } from '../CyclePlanner';
import { UtilizationAnalytics } from '../UtilizationAnalytics';
import { TaskSuggestions } from '../TaskSuggestions';

export default function CycleTab() {
  return (
    <>
      <CyclePlanner />
      <hr className="pixel-divider my-6" />
      <UtilizationAnalytics />
      <hr className="pixel-divider my-6" />
      <TaskSuggestions />
    </>
  );
}
