import portfolioData from '../data/portfolio-data.json';
import type { PortfolioSnapshot } from '../types';

export function usePortfolioData() {
  const data = portfolioData as PortfolioSnapshot;
  return { data, loading: false };
}
