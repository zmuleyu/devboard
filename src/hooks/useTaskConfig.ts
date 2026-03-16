import { useState, useEffect, useCallback } from 'react';

export interface TaskConfig {
  name: string;
  schedule: string;
  enabled: boolean;
  goal: string;
  execution: string;
  budgetPerRun: string;
  scheduleReason: string;
}

export function useTaskConfig() {
  const [data, setData] = useState<TaskConfig[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(() => {
    fetch('/data/task-config.json')
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
