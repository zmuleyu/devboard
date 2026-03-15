import { useMemo, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import statsData from '../data/conversation-stats.json';

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

const TOPIC_LABELS: Record<string, string> = {
  'regulatory-research': '法规研究',
  'scraping-data': '爬虫/数据',
  'frontend-dev': '前端开发',
  'browser-automation': '浏览器自动化',
  'toolchain': '工具链',
  'export-control': '出口管制',
  'product-research': '产品研究',
  'design': '设计',
  'gaming-compliance': '出海游戏',
  'misc': '杂项',
};

interface TopConversation {
  name: string;
  topic: string;
  msgs: number;
  date: string;
}

export function ConversationTimeline() {
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);

  const { topicBars, dailyData, topConvs } = useMemo(() => {
    const daily = statsData.dailyActivity as Record<string, number>;
    const topicByDate = statsData.topicByDate as Record<string, number>;
    const topics = statsData.topicDistribution as Array<{ topic: string; count: number; pct: string }>;
    const topConversations = statsData.topConversations as TopConversation[];

    // Sort dates
    const dates = Object.keys(daily).sort();

    const allTopics = topics.map((t) => t.topic);

    // Stacked bar chart of daily activity by topic
    const dailyStacked = dates.map((date) => {
      const entry: Record<string, number | string> = { date: date.slice(5) };
      for (const topic of allTopics) {
        const key = `${date}|${topic}`;
        entry[topic] = topicByDate[key] || 0;
      }
      return entry;
    });

    return {
      topicBars: topics,
      dailyData: dailyStacked,
      topConvs: topConversations,
    };
  }, []);

  const filteredTop = selectedTopic
    ? topConvs.filter((c) => c.topic === selectedTopic)
    : topConvs;

  return (
    <div className="pixel-border bg-card-bg p-4">
      <h2 className="font-pixel text-[10px] mb-1">CONVERSATION TIMELINE</h2>
      <p className="text-[10px] text-text-muted mb-4">
        {statsData.totalConversations} 对话 · {statsData.totalMessages.toLocaleString()} 消息 · {statsData.dateRange.from} → {statsData.dateRange.to}
        {selectedTopic && (
          <span className="ml-2 text-amber font-bold">
            · 筛选：{TOPIC_LABELS[selectedTopic] || selectedTopic}
            <button className="ml-1 underline text-text-muted font-normal" onClick={() => setSelectedTopic(null)}>
              清除
            </button>
          </span>
        )}
      </p>

      {/* Topic distribution chips */}
      <div className="flex gap-1.5 flex-wrap mb-4">
        {topicBars.map((t) => (
          <button
            key={t.topic}
            onClick={() => setSelectedTopic(selectedTopic === t.topic ? null : t.topic)}
            className={`px-2 py-0.5 text-[10px] border transition-colors ${
              selectedTopic === t.topic
                ? 'border-text-main bg-text-main/10 text-text-main'
                : 'border-[#706858]/40 text-text-muted hover:border-text-main/60'
            }`}
          >
            <span
              className="inline-block w-2 h-2 mr-1"
              style={{ backgroundColor: TOPIC_COLORS[t.topic] || '#706858' }}
            />
            {TOPIC_LABELS[t.topic] || t.topic}
            <span className="ml-1 font-bold">{t.count}</span>
          </button>
        ))}
      </div>

      {/* Stacked bar chart: daily activity by topic */}
      <div className="font-pixel text-[8px] text-text-muted mb-1">DAILY ACTIVITY BY TOPIC</div>
      <ResponsiveContainer width="100%" height={140}>
        <BarChart data={dailyData} margin={{ top: 0, right: 0, bottom: 0, left: -15 }}>
          <XAxis
            dataKey="date"
            tick={{ fontSize: 8, fontFamily: 'JetBrains Mono' }}
            stroke="#706858"
          />
          <YAxis
            tick={{ fontSize: 8, fontFamily: 'JetBrains Mono' }}
            stroke="#706858"
            allowDecimals={false}
          />
          <Tooltip
            contentStyle={{
              fontFamily: 'JetBrains Mono',
              fontSize: 10,
              border: '2px solid #2a2a2a',
              boxShadow: '2px 2px 0 #2a2a2a',
              maxWidth: 200,
            }}
            formatter={(value, name) => [
              Number(value) > 0 ? `${value}` : null,
              TOPIC_LABELS[String(name)] || String(name),
            ]}
          />
          {topicBars.map((t) => (
            <Bar
              key={t.topic}
              dataKey={t.topic}
              stackId="a"
              fill={TOPIC_COLORS[t.topic] || '#706858'}
              opacity={selectedTopic && selectedTopic !== t.topic ? 0.15 : 1}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>

      {/* Top conversations table */}
      <div className="mt-4">
        <div className="font-pixel text-[8px] text-text-muted mb-1">
          TOP CONVERSATIONS {selectedTopic ? `(${TOPIC_LABELS[selectedTopic]})` : ''}
        </div>
        <div className="overflow-auto max-h-[180px]">
          <table className="w-full text-[10px]">
            <thead>
              <tr className="text-text-muted border-b border-[#706858]/30">
                <th className="text-left py-1 pr-2">#</th>
                <th className="text-left py-1 pr-2">Date</th>
                <th className="text-left py-1 pr-2">Name</th>
                <th className="text-left py-1 pr-2">Topic</th>
                <th className="text-right py-1">Msgs</th>
              </tr>
            </thead>
            <tbody>
              {filteredTop.slice(0, 15).map((c, i) => (
                <tr key={i} className="border-b border-[#706858]/10 hover:bg-[#706858]/10">
                  <td className="py-1 pr-2 text-text-muted">{i + 1}</td>
                  <td className="py-1 pr-2 text-text-muted">{c.date.slice(5)}</td>
                  <td className="py-1 pr-2 text-text-main truncate max-w-[300px]">{c.name}</td>
                  <td className="py-1 pr-2">
                    <span
                      className="inline-block w-2 h-2 mr-1"
                      style={{ backgroundColor: TOPIC_COLORS[c.topic] || '#706858' }}
                    />
                    <span className="text-text-muted">{TOPIC_LABELS[c.topic] || c.topic}</span>
                  </td>
                  <td className="py-1 text-right font-bold">{c.msgs}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
