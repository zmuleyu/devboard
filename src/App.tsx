import { useState } from 'react';
import { AlertBanner } from './components/AlertBanner';
import { PortfolioGrid } from './components/PortfolioGrid';
import { TokenAnalytics } from './components/TokenAnalytics';
import { BudgetForecast } from './components/BudgetForecast';
import { SessionLog } from './components/SessionLog';
import { Timeline } from './components/Timeline';
import { ProjectTasks } from './components/ProjectTasks';
import { RoadmapGantt } from './components/RoadmapGantt';
import { CronDashboard } from './components/CronDashboard';
import { AgentLogViewer } from './components/AgentLogViewer';
import { AgentTimeline } from './components/AgentTimeline';
import { OffPeakMetrics } from './components/OffPeakMetrics';
import { UsageDashboard } from './components/UsageDashboard';
import { KnowledgeArchive } from './components/KnowledgeArchive';
import { ConversationTimeline } from './components/ConversationTimeline';
import { usePortfolioData } from './hooks/usePortfolioData';

export default function App() {
  const { data } = usePortfolioData();
  const [selectedProject, setSelectedProject] = useState<string | null>(null);

  return (
    <div className="dot-grid min-h-screen">
      <div className="relative z-10 max-w-[1200px] mx-auto px-6 py-8">
        {/* Header */}
        <header className="mb-8">
          <div className="flex items-center gap-4 mb-2">
            <h1 className="font-pixel text-[20px] text-text-main tracking-wide">DEVBOARD</h1>
            <span className="blink" />
          </div>
          <p className="text-[12px] text-text-muted">
            快照：{data.date} · 项目管理看板
            {selectedProject && (
              <span className="ml-3 text-amber font-bold">
                · 筛选：{selectedProject}
                <button className="ml-2 underline text-text-muted font-normal" onClick={() => setSelectedProject(null)}>
                  清除
                </button>
              </span>
            )}
          </p>
        </header>

        {/* Alert Banner */}
        <AlertBanner />

        <hr className="pixel-divider mb-8" />

        {/* Module 1: Portfolio Overview */}
        <PortfolioGrid selectedProject={selectedProject} onSelectProject={setSelectedProject} />

        <hr className="pixel-divider my-8" />

        {/* Module 2: Token Analytics */}
        <TokenAnalytics />

        <hr className="pixel-divider my-8" />

        {/* Module 14: Budget Forecast */}
        <BudgetForecast />

        <hr className="pixel-divider my-8" />

        {/* Module 3: Session Log */}
        <SessionLog selectedProject={selectedProject} onSelectProject={setSelectedProject} />

        <hr className="pixel-divider my-8" />

        {/* Module 7: Cron Dashboard */}
        <CronDashboard selectedProject={selectedProject} />

        <hr className="pixel-divider my-8" />

        {/* Module 8: Agent Log Viewer */}
        <AgentLogViewer />

        <hr className="pixel-divider my-8" />

        {/* Module 9: 24h Agent Timeline */}
        <AgentTimeline selectedProject={selectedProject} />

        <hr className="pixel-divider my-8" />

        {/* Module 10: Off-Peak Metrics */}
        <OffPeakMetrics />

        <hr className="pixel-divider my-8" />

        {/* Module 11: Usage Tracker */}
        <UsageDashboard />

        <hr className="pixel-divider my-8" />

        {/* Module 12: Knowledge Archive */}
        <KnowledgeArchive />

        <hr className="pixel-divider my-8" />

        {/* Module 13: Conversation Timeline */}
        <ConversationTimeline />

        <hr className="pixel-divider my-8" />

        {/* Module 4: Timeline */}
        <Timeline selectedProject={selectedProject} />

        <hr className="pixel-divider my-8" />

        {/* Module 5: Project Tasks */}
        <ProjectTasks selectedProject={selectedProject} />

        <hr className="pixel-divider my-8" />

        {/* Module 6: Roadmap Gantt */}
        <RoadmapGantt selectedProject={selectedProject} onSelectProject={setSelectedProject} />

        {/* Footer */}
        <footer className="text-center py-4 text-[10px] text-text-muted">
          <span className="font-pixel text-[7px]">
            DEVBOARD v0.6.0 · built with Vite + React + Tailwind
          </span>
        </footer>
      </div>
    </div>
  );
}
