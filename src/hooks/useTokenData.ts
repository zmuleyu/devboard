import { useState, useEffect, useCallback } from 'react';
import type { TokenDailyEntry } from '../types';

export function useTokenData() {
  const [data, setData] = useState<TokenDailyEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(() => {
    fetch('/data/token-daily.json')
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
