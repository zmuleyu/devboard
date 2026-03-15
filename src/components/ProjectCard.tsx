import { useState } from 'react';
import type { ProjectStatus, HealthGrade, Ecosystem } from '../types';

const healthColors: Record<HealthGrade, string> = {
  A: 'bg-health-a',
  'A-': 'bg-health-a-minus',
  'B-': 'bg-health-b-minus',
  C: 'bg-health-c',
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

export function ProjectCard({ project }: { project: ProjectStatus }) {
  const [expanded, setExpanded] = useState(false);
  const eco = ecosystemStyles[project.ecosystem];
  const healthColor = healthColors[project.health];

  return (
    <div
      className="pixel-border pixel-hover bg-card-bg p-0 flex flex-col"
      onClick={() => setExpanded(!expanded)}
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
          tests
        </span>
        <span className="text-grid-dot">|</span>
        <span title="branch" className="truncate">
          {project.branch}
        </span>
        {project.uncommittedChanges > 0 && (
          <>
            <span className="text-grid-dot">|</span>
            <span className="text-amber font-bold">
              {project.uncommittedChanges} uncommitted
            </span>
          </>
        )}
      </div>

      <hr className="pixel-divider" />

      {/* Last Commit */}
      <div className="px-3 py-2 text-[11px]">
        <div className="flex items-center justify-between mb-1">
          <span className="text-text-muted">last commit</span>
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
              <span className="text-text-muted">role</span>
              <span className="font-pixel text-[7px]">
                {roleLabels[project.role] || project.role}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-text-muted">tech debt</span>
              <span className={project.techDebtMarkers > 0 ? 'text-amber font-bold' : ''}>
                {project.techDebtMarkers} marker{project.techDebtMarkers !== 1 ? 's' : ''}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-text-muted">path</span>
              <span className="truncate ml-2 text-text-muted" title={project.path}>
                {project.path.replace(/\\/g, '/').split('/').slice(-2).join('/')}
              </span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
