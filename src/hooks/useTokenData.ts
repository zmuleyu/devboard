import tokenDailyData from '../data/token-daily.json';
import type { TokenDailyEntry } from '../types';

export function useTokenData() {
  const data = tokenDailyData as unknown as TokenDailyEntry[];
  return { data, loading: false };
}
