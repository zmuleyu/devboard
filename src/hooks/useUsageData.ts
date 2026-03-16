import { useState, useEffect, useCallback } from 'react';
import type { UsageLogEntry } from '../types';

export function useUsageData() {
  const [data, setData] = useState<UsageLogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(() => {
    fetch('/data/usage-log.json')
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
