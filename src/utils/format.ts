export function formatTokens(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(0)}K`;
  return String(value);
}

const HEALTH_SCORES: Record<string, number> = {
  'A':  4,
  'A-': 3.5,
  'B':  3,
  'B-': 2.5,
  'C':  2,
  'C-': 1,
};

export function healthScore(grade: string): number {
  return HEALTH_SCORES[grade] ?? 2;
}
