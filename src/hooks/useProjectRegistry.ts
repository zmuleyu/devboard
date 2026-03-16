import { useState, useEffect, useCallback } from 'react';

export interface ProjectRegistryEntry {
  name: string;
  type: string;
  ecosystem: string;
  description: string;
  techStack: string[];
  deployUrls: string[];
  gitRemote: string;
  hasClaudeMd: boolean;
  hasReadme: boolean;
  specCount: number;
  setupCommand: string;
  currentPhase: string;
  version: string;
}

export function useProjectRegistry() {
  const [data, setData] = useState<ProjectRegistryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(() => {
    fetch('/data/project-registry.json')
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
