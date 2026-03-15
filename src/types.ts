export type Ecosystem = 'cybernium' | 'ziyou' | 'standalone';
export type ProjectRole = 'infra' | 'app' | 'presentation' | 'tool';
export type HealthGrade = 'A' | 'A-' | 'B-' | 'C';
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
}

export interface PortfolioSnapshot {
  date: string;
  projects: ProjectStatus[];
}
