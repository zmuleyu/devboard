import { useState, useEffect, useCallback } from 'react';
import type { PortfolioSnapshot } from '../types';

export function usePortfolioData() {
  const [data, setData] = useState<PortfolioSnapshot>({ date: '', projects: [] });
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(() => {
    fetch('/data/portfolio-data.json')
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
