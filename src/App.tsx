import { PortfolioGrid } from './components/PortfolioGrid';
import { TokenAnalytics } from './components/TokenAnalytics';
import { SessionLog } from './components/SessionLog';
import { usePortfolioData } from './hooks/usePortfolioData';

export default function App() {
  const { data } = usePortfolioData();

  return (
    <div className="dot-grid min-h-screen">
      <div className="relative z-10 max-w-[1200px] mx-auto px-6 py-8">
        {/* Header */}
        <header className="mb-8">
          <div className="flex items-center gap-4 mb-2">
            <h1 className="font-pixel text-[20px] text-text-main tracking-wide">
              DEVBOARD
            </h1>
            <span className="blink" />
          </div>
          <p className="text-[12px] text-text-muted">
            snapshot: {data.date} · project management dashboard
          </p>
        </header>

        <hr className="pixel-divider mb-8" />

        {/* Module 1: Portfolio Overview */}
        <PortfolioGrid />

        <hr className="pixel-divider my-8" />

        {/* Module 2: Token Analytics */}
        <TokenAnalytics />

        <hr className="pixel-divider my-8" />

        {/* Module 3: Session Log */}
        <SessionLog />

        <hr className="pixel-divider my-8" />

        <div className="pixel-border bg-card-bg p-6 min-h-[200px] flex items-center justify-center mb-8">
          <span className="font-pixel text-[9px] text-mid-gray">
            TIMELINE · PHASE 3
          </span>
        </div>

        {/* Footer */}
        <footer className="text-center py-4 text-[10px] text-text-muted">
          <span className="font-pixel text-[7px]">
            DEVBOARD v0.1.0 · built with Vite + React + Tailwind
          </span>
        </footer>
      </div>
    </div>
  );
}
