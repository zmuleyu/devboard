export type Ecosystem = 'cybernium' | 'ziyou' | 'standalone';
export type ProjectRole = 'infra' | 'app' | 'presentation' | 'tool';
export type HealthGrade = 'A' | 'A-' | 'B' | 'B-' | 'C' | 'C-';
export type HealthTrend = '↑' | '↓' | '→';

export interface ProjectStatus {
  name: string;
  ecosystem: Ecosystem;
  role: ProjectRole;
  health: HealthGrade;
  healthTrend: HealthTrend;
  testCount: number;
  techDebtMarkers: number;
  lastCommitDate: string;
  lastCommitMessage: string;
  branch: string;
  uncommittedChanges: number;
  topTodo: string;
  path: string;
  status?: ProjectLifecycle;
  timeline?: ProjectTimeline;
  milestones?: ProjectMilestone[];
  dependencies?: string[];
  notes?: string;
}

export type ProjectLifecycle = 'active' | 'planned' | 'paused' | 'completed';

export interface ProjectTimeline {
  start: string;
  target: string;
}

export interface ProjectMilestone {
  label: string;
  date: string;
  done: boolean;
}

export interface PortfolioSnapshot {
  date: string;
  projects: ProjectStatus[];
}

export interface PortfolioHistoryEntry {
  date: string;
  projects: Array<{
    name: string;
    health: string;
    testCount: number;
    commitCount: number;
  }>;
}

export interface SessionLogEntry {
  date: string;
  startTime: string;
  duration: string;
  tokenUsed: number;
  model: 'haiku' | 'sonnet' | 'opus';
  projectsTouched: string[];
  summary: string;
  commitsCreated: number;
}

export interface TokenDailyEntry {
  date: string;
  totalTokens: number;
  byModel: { haiku: number; sonnet: number; opus: number };
  byProject: Record<string, number>;
  sessionCount: number;
}
