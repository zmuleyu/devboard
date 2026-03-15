import { useState } from 'react';
import { LineChart, Line } from 'recharts';
import type { ProjectStatus, HealthGrade, Ecosystem } from '../types';

const healthColors: Record<HealthGrade, string> = {
  A: 'bg-health-a',
  'A-': 'bg-health-a-minus',
  B: 'bg-health-b-minus',
  'B-': 'bg-health-b-minus',
  C: 'bg-health-c',
  'C-': 'bg-health-c',
};

const ecosystemStyles: Record<Ecosystem, { label: string; bg: string }> = {
  cybernium: { label: 'CYBER', bg: 'bg-amber text-card-bg' },
  ziyou: { label: 'ZIYOU', bg: 'bg-pixel-black text-card-bg' },
  standalone: { label: 'SOLO', bg: 'bg-mid-gray text-card-bg' },
};

const roleLabels: Record<string, string> = {
  infra: 'INFRA',
  app: 'APP',
  presentation: 'WEB',
  tool: 'TOOL',
};

function daysAgo(dateStr: string): string {
  const diff = Math.floor(
    (Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24)
  );
  if (diff === 0) return 'today';
  if (diff === 1) return '1d ago';
  return `${diff}d ago`;
}

interface ProjectCardProps {
  project: ProjectStatus;
  isSelected?: boolean;
  onSelect?: () => void;
  healthHistory?: number[];
}

export function ProjectCard({ project, isSelected, onSelect, healthHistory }: ProjectCardProps) {
  const [expanded, setExpanded] = useState(false);
  const eco = ecosystemStyles[project.ecosystem];
  const healthColor = healthColors[project.health];

  return (
    <div
      className="pixel-border pixel-hover bg-card-bg p-0 flex flex-col"
      style={isSelected ? { outline: '2px solid #e8834a', outlineOffset: '2px' } : undefined}
      onClick={() => { setExpanded(!expanded); onSelect?.(); }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 pt-3 pb-2">
        <span
          className={`font-pixel text-[7px] px-2 py-1 pixel-border-sm ${eco.bg}`}
        >
          {eco.label}
        </span>
        <div className="flex items-center gap-1.5">
          <span
            className={`inline-block w-3 h-3 pixel-border-sm ${healthColor}`}
          />
          <span className="font-pixel text-[9px]">
            {project.health}
          </span>
          <span className="text-sm" title="trend">
            {project.healthTrend}
          </span>
        </div>
      </div>

      {/* Project Name */}
      <div className="px-3 pb-2">
        <h3 className="font-pixel text-[10px] leading-relaxed truncate">
          {project.name}
        </h3>
      </div>

      <hr className="pixel-divider" />

      {/* Stats */}
      <div className="px-3 py-2 flex items-center gap-3 text-[11px] text-text-muted">
        <span title="tests">
          <span className="font-bold text-text-main">{project.testCount}</span>{' '}
          个测试
        </span>
        <span className="text-grid-dot">|</span>
        <span title="branch" className="truncate">
          {project.branch}
        </span>
        {project.uncommittedChanges > 0 && (
          <>
            <span className="text-grid-dot">|</span>
            <span className="text-amber font-bold">
              {project.uncommittedChanges} 个未提交
            </span>
          </>
        )}
      </div>

      <hr className="pixel-divider" />

      {/* Last Commit */}
      <div className="px-3 py-2 text-[11px]">
        <div className="flex items-center justify-between mb-1">
          <span className="text-text-muted">最近提交</span>
          <span className="text-text-muted">{daysAgo(project.lastCommitDate)}</span>
        </div>
        <p className="text-[10px] text-text-main truncate leading-relaxed">
          {project.lastCommitMessage}
        </p>
      </div>

      <hr className="pixel-divider" />

      {/* Top Todo */}
      <div className="px-3 py-2 text-[11px] mt-auto">
        <span className="text-text-muted">TODO: </span>
        <span className="text-amber font-bold">{project.topTodo}</span>
      </div>

      {/* Expanded Detail */}
      {expanded && (
        <>
          <hr className="pixel-divider" />
          <div className="px-3 py-2 text-[10px] bg-board-bg space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-text-muted">类型</span>
              <span className="font-pixel text-[7px]">
                {roleLabels[project.role] || project.role}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-text-muted">技术债</span>
              <span className={project.techDebtMarkers > 0 ? 'text-amber font-bold' : ''}>
                {project.techDebtMarkers} 处
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-text-muted">路径</span>
              <span className="truncate ml-2 text-text-muted" title={project.path}>
                {project.path.replace(/\\/g, '/').split('/').slice(-2).join('/')}
              </span>
            </div>
            {healthHistory && healthHistory.length >= 2 && (() => {
              const last = healthHistory[healthHistory.length - 1];
              const sparkColor = last >= 3.5 ? '#86efac' : last >= 2.5 ? '#fbbf24' : '#f87171';
              const sparkData = healthHistory.map((v, i) => ({ i, v }));
              return (
                <div className="flex items-center justify-between mt-1">
                  <span className="text-text-muted">趋势（{healthHistory.length}周）</span>
                  <LineChart width={48} height={20} data={sparkData} margin={{ top: 2, right: 0, bottom: 2, left: 0 }}>
                    <Line type="monotone" dataKey="v" stroke={sparkColor} dot={false} strokeWidth={1.5} isAnimationActive={false} />
                  </LineChart>
                </div>
              );
            })()}
          </div>
        </>
      )}
    </div>
  );
}
