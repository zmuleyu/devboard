import { useState, useCallback, lazy, Suspense } from 'react';
import { TabBar } from './components/TabBar';
import { LoadingPlaceholder } from './components/LoadingPlaceholder';
import { usePortfolioData } from './hooks/usePortfolioData';

const ProjectsTab = lazy(() => import('./components/tabs/ProjectsTab'));
const TasksTab = lazy(() => import('./components/tabs/TasksTab'));
const UsageTab = lazy(() => import('./components/tabs/UsageTab'));
const CycleTab = lazy(() => import('./components/tabs/CycleTab'));
const RegistryTab = lazy(() => import('./components/tabs/RegistryTab'));

export default function App() {
  const { data } = usePortfolioData();
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('projects');
  const [visitedTabs, setVisitedTabs] = useState<Set<string>>(() => new Set(['projects']));

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

        <hr className="pixel-divider mb-8" />

        {/* Tab Navigation */}
        <TabBar activeTab={activeTab} onTabChange={handleTabChange} />

        {/* Tab Content */}
        <Suspense fallback={<LoadingPlaceholder />}>
          {/* ── Projects Tab ── */}
          {visitedTabs.has('projects') && (
            <div style={{ display: activeTab === 'projects' ? 'block' : 'none' }}>
              <ProjectsTab selectedProject={selectedProject} onSelectProject={setSelectedProject} />
            </div>
          )}

          {/* ── Tasks Tab ── */}
          {visitedTabs.has('tasks') && (
            <div style={{ display: activeTab === 'tasks' ? 'block' : 'none' }}>
              <TasksTab />
            </div>
          )}

          {/* ── Usage Tab ── */}
          {visitedTabs.has('usage') && (
            <div style={{ display: activeTab === 'usage' ? 'block' : 'none' }}>
              <UsageTab selectedProject={selectedProject} onSelectProject={setSelectedProject} />
            </div>
          )}

          {/* ── Cycle Tab ── */}
          {visitedTabs.has('cycle') && (
            <div style={{ display: activeTab === 'cycle' ? 'block' : 'none' }}>
              <CycleTab />
            </div>
          )}

          {/* ── Registry Tab ── */}
          {visitedTabs.has('registry') && (
            <div style={{ display: activeTab === 'registry' ? 'block' : 'none' }}>
              <RegistryTab />
            </div>
          )}
        </Suspense>

        {/* Footer */}
        <footer className="text-center py-4 text-[10px] text-text-muted">
          <span className="font-pixel text-[7px]">
            DEVBOARD v1.1.0 · devboard.cybernium.cn
          </span>
        </footer>
      </div>
    </div>
  );
}
