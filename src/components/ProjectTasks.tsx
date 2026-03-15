import { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { usePortfolioData } from '../hooks/usePortfolioData';
import { usePortfolioHistory } from '../hooks/usePortfolioHistory';
import { projectColor } from '../theme';
import type { Ecosystem } from '../types';

const ecosystemOrder: Ecosystem[] = ['cybernium', 'ziyou', 'standalone'];
const ecosystemLabels: Record<Ecosystem, string> = {
  cybernium:  'CYBERNIUM',
  ziyou:      'ZIYOU',
  standalone: 'STANDALONE',
};

const healthColors: Record<string, string> = {
  A:   '#86efac',
  'A-':'#a7f3d0',
  B:   '#fde68a',
  'B-':'#fbbf24',
  C:   '#fca5a5',
  'C-':'#f87171',
};

interface ProjectTasksProps {
  selectedProject?: string | null;
}

export function ProjectTasks({ selectedProject }: ProjectTasksProps) {
  const { data } = usePortfolioData();
  const { data: history } = usePortfolioHistory();

  // Build commit activity data: [{date, projectName: commitCount, ...}]
  const commitChartData = useMemo(() => {
    return history.map((snapshot) => {
      const entry: Record<string, string | number> = { date: snapshot.date.slice(5) };
      snapshot.projects.forEach((p) => {
        entry[p.name] = p.commitCount;
      });
      return entry;
    });
  }, [history]);

  const allProjectNames = useMemo(
    () => data.projects.map((p) => p.name),
    [data.projects]
  );

  const grouped = useMemo(() => {
    return ecosystemOrder.reduce<Record<Ecosystem, typeof data.projects>>((acc, eco) => {
      acc[eco] = data.projects.filter((p) => p.ecosystem === eco && p.topTodo);
      return acc;
    }, {} as Record<Ecosystem, typeof data.projects>);
  }, [data.projects]);

  return (
    <div className="pixel-border bg-card-bg p-4">
      <h2 className="font-pixel text-[10px] mb-1">任务总览</h2>
      <p className="text-[10px] text-text-muted mb-4">各项目当前待办 + 近4周提交活跃度</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left: Todo list by ecosystem */}
        <div>
          <p className="text-[9px] text-text-muted mb-2 font-pixel">待办汇总</p>
          <div className="space-y-4">
            {ecosystemOrder.map((eco) => {
              const projects = grouped[eco];
              if (!projects?.length) return null;
              return (
                <div key={eco}>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="font-pixel text-[7px] text-text-muted">{ecosystemLabels[eco]}</span>
                    <div className="flex-1 border-t border-dashed border-grid-dot" />
                  </div>
                  <div className="space-y-1.5">
                    {projects.map((p) => {
                      const dimmed = selectedProject !== null && selectedProject !== p.name;
                      return (
                        <div
                          key={p.name}
                          className="flex items-start gap-2 text-[11px]"
                          style={{ opacity: dimmed ? 0.3 : 1, transition: 'opacity 0.15s' }}
                        >
                          <span
                            className="shrink-0 font-bold text-[10px]"
                            style={{ color: projectColor(p.name), minWidth: 80 }}
                          >
                            {p.name}
                          </span>
                          <span
                            className="font-pixel text-[7px] px-1 py-0.5 shrink-0"
                            style={{
                              backgroundColor: healthColors[p.health] ?? '#fbbf24',
                              color: '#2a2a2a',
                            }}
                          >
                            {p.health}
                          </span>
                          <span className="text-text-muted text-[10px] leading-relaxed">{p.topTodo}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Commit activity bar chart */}
        <div>
          <p className="text-[9px] text-text-muted mb-2 font-pixel">提交活跃度（近4周）</p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={commitChartData} barSize={6}>
              <XAxis
                dataKey="date"
                tick={{ fontSize: 9, fontFamily: 'JetBrains Mono' }}
                stroke="#706858"
              />
              <Tooltip
                contentStyle={{
                  fontFamily: 'JetBrains Mono',
                  fontSize: 10,
                  border: '2px solid #2a2a2a',
                  boxShadow: '2px 2px 0 #2a2a2a',
                }}
              />
              {allProjectNames.map((name) => (
                <Bar
                  key={name}
                  dataKey={name}
                  stackId="commits"
                  fill={projectColor(name)}
                  opacity={selectedProject && selectedProject !== name ? 0.25 : 1}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
