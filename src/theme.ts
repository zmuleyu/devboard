// Centralized color tokens for models and projects across all modules
import { Anthropic, OpenAI, Google } from '@lobehub/icons';
import type { ComponentType } from 'react';

export const MODEL_COLORS = {
  haiku:  '#86efac',
  sonnet: '#e8834a',
  opus:   '#c084fc',
} as const;

// LLM provider brand icons from @lobehub/icons
export const MODEL_ICONS: Record<string, ComponentType<{ size?: number }>> = {
  haiku:  Anthropic,
  sonnet: Anthropic,
  opus:   Anthropic,
  'gpt-4': OpenAI,
  'gpt-4o': OpenAI,
  gemini: Google,
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
