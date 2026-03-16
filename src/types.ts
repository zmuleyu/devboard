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

export type CronTaskType = 'dev' | 'monitor' | 'grind' | 'patrol' | 'batch-fix' | 'data-sync' | 'pr-review' | 'manual' | 'verify' | 'audit' | 'maintenance' | 'report' | 'workflow';
export type CronResult = 'pass' | 'fail' | 'warn' | 'info' | 'crash';
export type CronSource = 'session' | 'cron' | 'loop' | 'persistent';

export interface CronLogEntry {
  date: string;
  time: string;
  taskName: string;
  taskType: CronTaskType;
  project: string;
  result: CronResult;
  detail: string;
  durationSec: number;
  budgetCap?: number;
  source?: CronSource;
  isOffPeak?: boolean;
}

export interface CronTaskConfig {
  name: string;
  prompt: string;
  schedule: string;
  scheduleDays?: string;
  tools: string;
  maxTurns: number;
  budgetUsd: number;
  description: string;
}

export interface CronWorkflowStep {
  task: string;
  parallel?: boolean;
  onFail?: 'continue' | 'stop';
}

export interface CronWorkflow {
  name: string;
  description: string;
  steps: CronWorkflowStep[];
}

export interface CronConfig {
  offPeakWindow: { start: string; end: string };
  defaultModel: string;
  projects: Array<{ name: string; path: string }>;
  workflows: CronWorkflow[];
  tasks: CronTaskConfig[];
}

export interface UsageLogEntry {
  ts: string;
  tsCN: string;
  event: 'start' | 'end';
  cwd: string;
  model: string;
  offPeak: boolean;
  platform: string;
}

export interface HealthStatus {
  timestamp: string;
  claudeAuth: 'ok' | 'FAIL';
  lastExecAge: string;
  logStatus: string;
  issues: string[];
}
