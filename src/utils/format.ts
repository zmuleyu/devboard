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

export function daysSince(dateStr: string): number {
  if (!dateStr) return Infinity;
  const diff = Date.now() - new Date(dateStr).getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

export function formatDuration(sec: number): string {
  if (sec < 60) return `${sec}s`;
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return s > 0 ? `${m}m ${s}s` : `${m}m`;
}
