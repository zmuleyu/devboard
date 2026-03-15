import historyData from '../data/portfolio-history.json';
import type { PortfolioHistoryEntry } from '../types';

export function usePortfolioHistory() {
  return { data: historyData as PortfolioHistoryEntry[] };
}
