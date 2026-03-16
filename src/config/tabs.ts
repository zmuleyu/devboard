export interface TabConfig {
  key: string;
  label: string;
}

export const TAB_CONFIG: TabConfig[] = [
  { key: 'projects', label: '项目总览' },
  { key: 'tasks', label: '定时任务' },
  { key: 'usage', label: '用量分析' },
  { key: 'cycle', label: '周期规划' },
  { key: 'registry', label: '项目档案' },
];
