import { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import migrationData from '../data/migration-report.json';

const COLORS = [
  '#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
  '#ec4899', '#14b8a6', '#f97316', '#3b82f6', '#84cc16',
  '#06b6d4', '#a855f7',
];

interface ProjectEntry {
  name: string;
  docCount: number;
  totalChars: number;
  target: string;
  files: Array<{ filename: string; chars: number; isDuplicate: boolean }>;
}

export function KnowledgeArchive() {
  const { barData, pieData, stats, typeDistribution } = useMemo(() => {
    const projects = (migrationData as { projects: ProjectEntry[] }).projects;

    // Bar chart: docs per project (sorted desc)
    const bar = projects
      .map((p) => ({
        name: p.name.length > 6 ? p.name.slice(0, 6) + '…' : p.name,
        fullName: p.name,
        docs: p.docCount,
        sizeKB: Math.round(p.totalChars / 1024),
      }))
      .sort((a, b) => b.docs - a.docs);

    // Pie chart: doc distribution
    const pie = projects.map((p, i) => ({
      name: p.name,
      value: p.docCount,
      color: COLORS[i % COLORS.length],
    }));

    // File type distribution
    const types: Record<string, number> = {};
    for (const p of projects) {
      for (const f of p.files) {
        const ext = f.filename.split('.').pop()?.toLowerCase() || 'other';
        types[ext] = (types[ext] || 0) + 1;
      }
    }
    const typeDist = Object.entries(types)
      .sort((a, b) => b[1] - a[1])
      .map(([ext, count]) => ({ ext: `.${ext}`, count }));

    return {
      barData: bar,
      pieData: pie,
      stats: {
        totalProjects: projects.length,
        totalDocs: projects.reduce((s, p) => s + p.docCount, 0),
        totalSizeKB: Math.round(projects.reduce((s, p) => s + p.totalChars, 0) / 1024),
        duplicates: projects.reduce(
          (s, p) => s + p.files.filter((f) => f.isDuplicate).length,
          0
        ),
      },
      typeDistribution: typeDist,
    };
  }, []);

  return (
    <div className="pixel-border bg-card-bg p-4">
      <h2 className="font-pixel text-[10px] mb-1">KNOWLEDGE ARCHIVE</h2>
      <p className="text-[10px] text-text-muted mb-4">
        Claude.ai 知识资产回流 · {stats.totalDocs} 文档 · {stats.totalSizeKB.toLocaleString()} KB
      </p>

      <div className="grid grid-cols-2 gap-4">
        {/* Left: Pie chart */}
        <div>
          <div className="font-pixel text-[8px] text-text-muted mb-1">PROJECT DISTRIBUTION</div>
          <ResponsiveContainer width="100%" height={140}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={28}
                outerRadius={55}
                dataKey="value"
                startAngle={90}
                endAngle={-270}
                stroke="none"
              >
                {pieData.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  fontFamily: 'JetBrains Mono',
                  fontSize: 11,
                  border: '2px solid #2a2a2a',
                  boxShadow: '2px 2px 0 #2a2a2a',
                }}
                formatter={(value, name) => [`${Number(value)} docs`, String(name)]}
              />
            </PieChart>
          </ResponsiveContainer>

          {/* Stats */}
          <div className="text-center text-[11px] space-y-1 mt-1">
            <div>
              <span className="text-[#6366f1] font-bold text-[14px]">{stats.totalDocs}</span>
              <span className="text-text-muted ml-1">份文档</span>
            </div>
            <div className="text-text-muted text-[10px]">
              {stats.totalProjects} 个 Project · {stats.duplicates} 重复
            </div>
          </div>
        </div>

        {/* Right: Bar chart */}
        <div>
          <div className="font-pixel text-[8px] text-text-muted mb-1">DOCS BY PROJECT</div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart
              data={barData}
              layout="vertical"
              margin={{ top: 0, right: 5, bottom: 0, left: 0 }}
            >
              <XAxis
                type="number"
                tick={{ fontSize: 8, fontFamily: 'JetBrains Mono' }}
                stroke="#706858"
              />
              <YAxis
                type="category"
                dataKey="name"
                tick={{ fontSize: 8, fontFamily: 'JetBrains Mono' }}
                stroke="#706858"
                width={55}
              />
              <Tooltip
                contentStyle={{
                  fontFamily: 'JetBrains Mono',
                  fontSize: 11,
                  border: '2px solid #2a2a2a',
                  boxShadow: '2px 2px 0 #2a2a2a',
                }}
                formatter={(value, _name, props) => {
                  const p = (props as { payload?: { fullName?: string; sizeKB?: number } }).payload;
                  return [
                    `${Number(value)} docs (${p?.sizeKB ?? 0} KB)`,
                    p?.fullName ?? String(_name),
                  ];
                }}
              />
              <Bar dataKey="docs" fill="#6366f1" radius={[0, 2, 2, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* File type row */}
      <div className="mt-3 flex gap-2 flex-wrap">
        {typeDistribution.map((t) => (
          <span
            key={t.ext}
            className="px-2 py-0.5 border border-[#706858]/40 text-[10px] text-text-muted"
          >
            {t.ext} <span className="text-text-main font-bold">{t.count}</span>
          </span>
        ))}
      </div>
    </div>
  );
}
