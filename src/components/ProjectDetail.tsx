import type { ProjectStatus } from '../types';

interface Props {
  project: ProjectStatus;
  onClose: () => void;
}

export function ProjectDetail({ project, onClose }: Props) {
  return (
    <div className="pixel-border bg-board-bg p-4 my-4" style={{ borderColor: '#6366f1', borderWidth: 2 }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-pixel text-[11px] text-text-main">{project.name} &mdash; \u8BE6\u60C5</h3>
        <button
          onClick={onClose}
          className="text-text-muted text-[11px] hover:text-text-main"
        >
          \u2715 \u5173\u95ED
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Left column */}
        <div className="space-y-3">
          {/* Status */}
          <DetailItem label="\u72B6\u6001">
            <span className="font-pixel text-[8px]">
              {project.status === 'active' ? '\u{1F7E2} \u8FDB\u884C\u4E2D' :
               project.status === 'paused' ? '\u23F8 \u6682\u505C' :
               project.status === 'completed' ? '\u2705 \u5DF2\u5B8C\u6210' : '\u{1F4CB} \u8BA1\u5212\u4E2D'}
            </span>
          </DetailItem>

          {/* Branch & Git */}
          <DetailItem label="Git \u72B6\u6001">
            <span>{project.branch}</span>
            {project.uncommittedChanges > 0 && (
              <span className="text-amber font-bold ml-2">
                {project.uncommittedChanges} \u672A\u63D0\u4EA4
              </span>
            )}
          </DetailItem>

          {/* Path */}
          <DetailItem label="\u8DEF\u5F84">
            <span className="text-text-muted">{project.path.replace(/\\/g, '/')}</span>
          </DetailItem>

          {/* Tech Debt */}
          <DetailItem label="\u6280\u672F\u503A">
            <span className={project.techDebtMarkers > 0 ? 'text-amber font-bold' : ''}>
              {project.techDebtMarkers} \u5904
            </span>
          </DetailItem>
        </div>

        {/* Right column */}
        <div className="space-y-3">
          {/* Tests */}
          <DetailItem label="\u6D4B\u8BD5">
            <span className="font-bold text-text-main">{project.testCount}</span> \u4E2A\u6D4B\u8BD5
          </DetailItem>

          {/* Last Commit */}
          <DetailItem label="\u6700\u8FD1\u63D0\u4EA4">
            <div>
              <div className="text-text-muted text-[10px]">{project.lastCommitDate}</div>
              <div className="text-text-main text-[10px] truncate">{project.lastCommitMessage}</div>
            </div>
          </DetailItem>

          {/* TODO */}
          <DetailItem label="\u5F85\u529E">
            <span className="text-amber font-bold">{project.topTodo}</span>
          </DetailItem>

          {/* Timeline */}
          {project.timeline && (
            <DetailItem label="\u65F6\u95F4\u7EBF">
              <span>{project.timeline.start} \u2192 {project.timeline.target}</span>
            </DetailItem>
          )}
        </div>
      </div>

      {/* Milestones */}
      {project.milestones && project.milestones.length > 0 && (
        <div className="mt-4 pt-3 border-t-2 border-dashed border-grid-dot">
          <span className="text-[10px] text-text-muted uppercase">\u91CC\u7A0B\u7891</span>
          <div className="mt-2 space-y-1">
            {project.milestones.map((m, i) => (
              <div key={i} className="flex items-center gap-2 text-[10px]">
                <span>{m.done ? '\u2705' : '\u2B1C'}</span>
                <span className={m.done ? 'text-text-muted line-through' : 'text-text-main'}>{m.label}</span>
                <span className="text-text-muted ml-auto">{m.date}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Notes */}
      {project.notes && (
        <div className="mt-3 text-[10px] text-text-muted">
          <span className="uppercase">\u5907\u6CE8\uFF1A</span>{project.notes}
        </div>
      )}
    </div>
  );
}

function DetailItem({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="text-[11px]">
      <span className="text-text-muted text-[10px] uppercase block mb-0.5">{label}</span>
      <div className="text-text-main">{children}</div>
    </div>
  );
}
