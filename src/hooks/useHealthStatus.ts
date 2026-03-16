import { useState, useEffect, useCallback } from 'react';
import type { HealthStatus } from '../types';

const DEFAULT_HEALTH: HealthStatus = {
  timestamp: '',
  claudeAuth: 'ok',
  lastExecAge: '',
  logStatus: '',
  issues: [],
};

export function useHealthStatus() {
  const [data, setData] = useState<HealthStatus>(DEFAULT_HEALTH);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(() => {
    fetch('/data/health-status.json')
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
