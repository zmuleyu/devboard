import { useState, useMemo, useEffect } from 'react';

const TOPIC_COLORS: Record<string, string> = {
  'regulatory-research': '#6366f1',
  'scraping-data': '#10b981',
  'frontend-dev': '#f59e0b',
  'browser-automation': '#f97316',
  'toolchain': '#8b5cf6',
  'export-control': '#ef4444',
  'product-research': '#ec4899',
  'design': '#14b8a6',
  'gaming-compliance': '#3b82f6',
  'misc': '#706858',
};

interface Conversation {
  title: string;
  date: string;
  messages: number;
  preview: string;
}

interface Topic {
  id: string;
  label: string;
  conversationCount: number;
  conversations: Conversation[];
}

interface SummariesData {
  topics: Topic[];
  totalConversations: number;
}

export function TopicSummaries() {
  const [summariesData, setSummariesData] = useState<SummariesData | null>(null);
  const [selectedTopic, setSelectedTopic] = useState<string>('');
  const [query, setQuery] = useState('');

  useEffect(() => {
    import('../data/summaries-index.json').then((m) => {
      const data = m.default as SummariesData;
      setSummariesData(data);
      setSelectedTopic(data.topics[0]?.id ?? '');
    });
  }, []);

  const topics = summariesData?.topics ?? [];
  const totalConversations = summariesData?.totalConversations ?? 0;

  const activeTopic = useMemo(
    () => topics.find((t) => t.id === selectedTopic),
    [topics, selectedTopic]
  );

  const filtered = useMemo(() => {
    if (!activeTopic) return [];
    const q = query.trim().toLowerCase();
    if (!q) return activeTopic.conversations;
    return activeTopic.conversations.filter(
      (c) => c.title.toLowerCase().includes(q) || c.preview.toLowerCase().includes(q)
    );
  }, [activeTopic, query]);

  if (!summariesData) {
    return (
      <div className="pixel-border bg-card-bg p-4">
        <h2 className="font-pixel text-[10px] mb-1">TOPIC SUMMARIES</h2>
        <p className="text-center text-[10px] text-text-muted py-8 blink">LOADING...</p>
      </div>
    );
  }

  return (
    <div className="pixel-border bg-card-bg p-4">
      <h2 className="font-pixel text-[10px] mb-1">TOPIC SUMMARIES</h2>
      <p className="text-[10px] text-text-muted mb-4">
        {totalConversations} 个对话摘要 · 10 大主题 · Claude.ai 2026-02-26 → 2026-03-14
      </p>

      <div className="flex gap-4">
        {/* Left: topic list */}
        <div className="w-[160px] shrink-0 flex flex-col gap-0.5">
          {topics.map((t) => (
            <button
              key={t.id}
              onClick={() => { setSelectedTopic(t.id); setQuery(''); }}
              className={`text-left px-2 py-1.5 text-[10px] border transition-colors ${
                selectedTopic === t.id
                  ? 'border-text-main bg-text-main/10 text-text-main'
                  : 'border-transparent text-text-muted hover:border-[#706858]/40 hover:text-text-main'
              }`}
            >
              <span
                className="inline-block w-2 h-2 mr-1.5 shrink-0"
                style={{ backgroundColor: TOPIC_COLORS[t.id] || '#706858' }}
              />
              {t.label}
              <span className="float-right font-bold text-[9px] mt-0.5 text-text-muted">
                {t.conversationCount}
              </span>
            </button>
          ))}
        </div>

        {/* Right: conversation list */}
        <div className="flex-1 min-w-0">
          {/* Search */}
          <div className="flex items-center gap-2 mb-2">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={`搜索 ${activeTopic?.label ?? ''} 对话…`}
              className="flex-1 bg-transparent border border-[#706858]/40 px-2 py-0.5 text-[10px] text-text-main placeholder-text-muted focus:outline-none focus:border-[#706858]"
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="text-[10px] text-text-muted hover:text-text-main"
              >
                清除
              </button>
            )}
            <span className="text-[10px] text-text-muted">{filtered.length} 条</span>
          </div>

          {/* List */}
          <div className="overflow-auto max-h-[320px] space-y-1">
            {filtered.length === 0 ? (
              <p className="text-[10px] text-text-muted py-4 text-center">无匹配结果</p>
            ) : (
              filtered.map((c, i) => (
                <div
                  key={i}
                  className="border border-[#706858]/20 px-2 py-1.5 hover:border-[#706858]/50 hover:bg-[#706858]/5 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-[10px] text-text-main leading-snug">{c.title}</span>
                    <span className="text-[9px] text-text-muted shrink-0 font-bold whitespace-nowrap">
                      {c.messages}条
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[9px] text-text-muted">{c.date}</span>
                    {c.preview && (
                      <span className="text-[9px] text-text-muted truncate">{c.preview}</span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
