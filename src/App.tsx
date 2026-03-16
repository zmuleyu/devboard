import { useState, useCallback, lazy, Suspense } from 'react';
import { AlertBanner } from './components/AlertBanner';
import { TabBar } from './components/TabBar';
import { LoadingPlaceholder } from './components/LoadingPlaceholder';
import { usePortfolioData } from './hooks/usePortfolioData';

const PortfolioTab = lazy(() => import('./components/tabs/PortfolioTab'));
const DevOpsTab = lazy(() => import('./components/tabs/DevOpsTab'));
const AnalyticsTab = lazy(() => import('./components/tabs/AnalyticsTab'));
const KnowledgeTab = lazy(() => import('./components/tabs/KnowledgeTab'));

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

        {/* Tab Content */}
        <Suspense fallback={<LoadingPlaceholder />}>
          {/* ── Portfolio Tab ── */}
          {visitedTabs.has('portfolio') && (
            <div style={{ display: activeTab === 'portfolio' ? 'block' : 'none' }}>
              <PortfolioTab selectedProject={selectedProject} onSelectProject={setSelectedProject} />
            </div>
          )}

          {/* ── DevOps Tab ── */}
          {visitedTabs.has('devops') && (
            <div style={{ display: activeTab === 'devops' ? 'block' : 'none' }}>
              <DevOpsTab selectedProject={selectedProject} />
            </div>
          )}

          {/* ── Analytics Tab ── */}
          {visitedTabs.has('analytics') && (
            <div style={{ display: activeTab === 'analytics' ? 'block' : 'none' }}>
              <AnalyticsTab selectedProject={selectedProject} onSelectProject={setSelectedProject} />
            </div>
          )}

          {/* ── Knowledge Tab ── */}
          {visitedTabs.has('knowledge') && (
            <div style={{ display: activeTab === 'knowledge' ? 'block' : 'none' }}>
              <KnowledgeTab />
            </div>
          )}
        </Suspense>

        {/* Footer */}
        <footer className="text-center py-4 text-[10px] text-text-muted">
          <span className="font-pixel text-[7px]">
            DEVBOARD v0.8.0 · devboard.cybernium.cn
          </span>
        </footer>
      </div>
    </div>
  );
}
