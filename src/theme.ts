// Centralized color tokens for models and projects across all modules

export const MODEL_COLORS = {
  haiku:  '#86efac',
  sonnet: '#e8834a',
  opus:   '#c084fc',
} as const;

// Model icon SVGs (inline — @lobehub/icons requires antd, incompatible with Vite standalone)
export const MODEL_ICON_SVGS: Record<string, string> = {
  haiku:  '☰', // Anthropic models use text fallback
  sonnet: '☰',
  opus:   '☰',
};

// Ecosystem color families: cybernium=indigo, standalone=emerald, ziyou=amber
export const PROJECT_COLORS: Record<string, string> = {
  // cybernium
  'cyber-landing':   '#818cf8',
  'ai_projects':     '#6366f1',
  'devboard':        '#4f46e5',
  // standalone
  'scrapling-mcp':   '#10b981',
  'Data_management': '#34d399',
  'pixel-herbarium': '#f59e0b',
  // ziyou
  'ziyou-server':    '#fbbf24',
  'ziyou-browser':   '#f97316',
  'ziyou-chrome':    '#fb923c',
};

export function projectColor(name: string): string {
  return PROJECT_COLORS[name] ?? '#9ca3af';
}

export const ECOSYSTEM_LABELS: Record<string, string> = {
  cybernium:  'CYBERNIUM',
  ziyou:      'ZIYOU',
  standalone: 'STANDALONE',
};
