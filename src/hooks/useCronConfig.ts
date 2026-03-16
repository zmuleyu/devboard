import { useState, useEffect, useCallback } from 'react';
import type { CronConfig } from '../types';

const DEFAULT: CronConfig = {
  offPeakWindow: { start: '01:00', end: '07:00' },
  defaultModel: 'sonnet',
  projects: [],
  workflows: [],
  tasks: [],
};

export function useCronConfig() {
  const [data, setData] = useState<CronConfig>(DEFAULT);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(() => {
    fetch('/data/cron-config.json')
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    refresh();
    const handler = () => { if (document.visibilityState === 'visible') refresh(); };
    document.addEventListener('visibilitychange', handler);
    return () => document.removeEventListener('visibilitychange', handler);
  }, [refresh]);

  return { data, loading };
}
