import cronData from '../data/cron-log.json';
import type { CronLogEntry } from '../types';

export function useCronData() {
  const data = cronData as CronLogEntry[];
  return { data, loading: false };
}
