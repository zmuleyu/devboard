import sessionsData from '../data/sessions-log.json';
import type { SessionLogEntry } from '../types';

export function useSessionData() {
  const data = sessionsData as SessionLogEntry[];
  return { data, loading: false };
}
