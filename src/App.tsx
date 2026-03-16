import { useState, useCallback } from 'react';
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
import { TopicSummaries } from './components/TopicSummaries';
import { TabBar } from './components/TabBar';
import { usePortfolioData } from './hooks/usePortfolioData';

export default function App() {
  const { data } = usePortfolioData();
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('portfolio');
  const [visitedTabs, setVisitedTabs] = useState<Set<string>>(() => new Set(['portfolio']));

  const handleTabChange = useCallback((key: string) => {
    setActiveTab(key);
    setVisitedTabs((prev) => {
      if (prev.has(key)) return prev;
      return new Set(prev).add(key);
    });
    window.scrollTo({ top: 0 });
  }, []);

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

        {/* Tab Navigation */}
        <TabBar activeTab={activeTab} onTabChange={handleTabChange} />

        {/* ── Portfolio Tab ── */}
        {visitedTabs.has('portfolio') && (
          <div style={{ display: activeTab === 'portfolio' ? 'block' : 'none' }}>
            <PortfolioGrid selectedProject={selectedProject} onSelectProject={setSelectedProject} />
            <hr className="pixel-divider my-8" />
            <Timeline selectedProject={selectedProject} />
            <hr className="pixel-divider my-8" />
            <ProjectTasks selectedProject={selectedProject} />
            <hr className="pixel-divider my-8" />
            <RoadmapGantt selectedProject={selectedProject} onSelectProject={setSelectedProject} />
          </div>
        )}

        {/* ── DevOps Tab ── */}
        {visitedTabs.has('devops') && (
          <div style={{ display: activeTab === 'devops' ? 'block' : 'none' }}>
            <CronDashboard selectedProject={selectedProject} />
            <hr className="pixel-divider my-8" />
            <AgentLogViewer />
            <hr className="pixel-divider my-8" />
            <AgentTimeline selectedProject={selectedProject} />
            <hr className="pixel-divider my-8" />
            <OffPeakMetrics />
          </div>
        )}

        {/* ── Analytics Tab ── */}
        {visitedTabs.has('analytics') && (
          <div style={{ display: activeTab === 'analytics' ? 'block' : 'none' }}>
            <TokenAnalytics />
            <hr className="pixel-divider my-8" />
            <BudgetForecast />
            <hr className="pixel-divider my-8" />
            <SessionLog selectedProject={selectedProject} onSelectProject={setSelectedProject} />
            <hr className="pixel-divider my-8" />
            <UsageDashboard />
          </div>
        )}

        {/* ── Knowledge Tab ── */}
        {visitedTabs.has('knowledge') && (
          <div style={{ display: activeTab === 'knowledge' ? 'block' : 'none' }}>
            <KnowledgeArchive />
            <hr className="pixel-divider my-8" />
            <ConversationTimeline />
            <hr className="pixel-divider my-8" />
            <TopicSummaries />
          </div>
        )}

        {/* Footer */}
        <footer className="text-center py-4 text-[10px] text-text-muted">
          <span className="font-pixel text-[7px]">
            DEVBOARD v0.7.0 · devboard.cybernium.cn
          </span>
        </footer>
      </div>
    </div>
  );
}
