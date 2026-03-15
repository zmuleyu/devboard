import usageData from '../data/usage-log.json';
import type { UsageLogEntry } from '../types';

export function useUsageData() {
  const data = usageData as UsageLogEntry[];
  return { data, loading: false };
}
