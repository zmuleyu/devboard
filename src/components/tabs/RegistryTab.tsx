import { useState } from 'react';
import { RecoveryGuide } from '../RecoveryGuide';
import { ProjectRegistry } from '../ProjectRegistry';
import { KnowledgeArchive } from '../KnowledgeArchive';
import { ConversationTimeline } from '../ConversationTimeline';
import { TopicSummaries } from '../TopicSummaries';

export default function RegistryTab() {
  const [archiveExpanded, setArchiveExpanded] = useState(false);

  return (
    <>
      <RecoveryGuide />
      <hr className="pixel-divider my-6" />
      <ProjectRegistry />

      {/* Archive - collapsible */}
      <div className="pixel-border bg-card-bg mt-8">
        <button
          className="w-full p-3 flex items-center justify-between text-[11px] cursor-pointer"
          onClick={() => setArchiveExpanded(!archiveExpanded)}
        >
          <span className="text-text-muted font-pixel text-[8px]">
            ARCHIVE -- Claude.ai knowledge base
          </span>
          <span className="text-text-muted">{archiveExpanded ? '\u25B4' : '\u25BE'}</span>
        </button>
        {archiveExpanded && (
          <div className="p-4 border-t-2 border-dashed border-grid-dot space-y-6">
            <KnowledgeArchive />
            <ConversationTimeline />
            <TopicSummaries />
          </div>
        )}
      </div>
    </>
  );
}
