import configData from '../data/config.json';

interface AppConfig {
  weeklyTokenBudget: number;
  warningThreshold: number;
}

export function useConfig(): AppConfig {
  return configData as AppConfig;
}
