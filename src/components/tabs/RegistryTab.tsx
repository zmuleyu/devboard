import { KnowledgeArchive } from '../KnowledgeArchive';
import { ConversationTimeline } from '../ConversationTimeline';
import { TopicSummaries } from '../TopicSummaries';

export default function KnowledgeTab() {
  return (
    <>
      <KnowledgeArchive />
      <hr className="pixel-divider my-8" />
      <ConversationTimeline />
      <hr className="pixel-divider my-8" />
      <TopicSummaries />
    </>
  );
}
