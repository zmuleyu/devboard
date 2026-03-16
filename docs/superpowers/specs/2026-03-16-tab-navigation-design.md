# DevBoard Tab Navigation Design

## Context

DevBoard has grown to 14 modules in a single-column scroll layout. As the dashboard expanded from 5 to 14 modules, finding and navigating to specific sections requires excessive scrolling. Tab navigation groups related modules and provides quick access while maintaining the pixel aesthetic.

## Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Switch behavior | Tab + lazy load | Visited tabs stay in DOM (display:none), unvisited don't render. Balances performance and UX |
| Grouping | 4 tabs (4/4/4/2) | Clean functional separation. Not too few (crowded) or too many (fragmented) |
| Visual style | Chip buttons | Navigation-level chips with stronger visual weight than in-module filter chips. Selected = solid inverted |
| Position | Below header, scrolls with page | Not sticky. Clean, no viewport occlusion |
| Configurability | TAB_CONFIG array | Tab metadata (key/label) in config file. Render logic uses explicit JSX per group for natural props passing |

## Tab Groups

```
PORTFOLIO:  PortfolioGrid · Timeline · ProjectTasks · RoadmapGantt
DEVOPS:     CronDashboard · AgentLogViewer · AgentTimeline · OffPeakMetrics
ANALYTICS:  TokenAnalytics · BudgetForecast · SessionLog · UsageDashboard
KNOWLEDGE:  KnowledgeArchive · ConversationTimeline
```

## Architecture

### New Files

**`src/config/tabs.ts`** — Tab metadata configuration
```ts
export interface TabConfig {
  key: string;
  label: string;
}

export const TAB_CONFIG: TabConfig[] = [
  { key: 'portfolio', label: 'PORTFOLIO' },
  { key: 'devops', label: 'DEVOPS' },
  { key: 'analytics', label: 'ANALYTICS' },
  { key: 'knowledge', label: 'KNOWLEDGE' },
];
```

To rearrange tabs: reorder this array. To add/remove a tab: edit this array + add/remove the corresponding JSX group in App.tsx.

**`src/components/TabBar.tsx`** — Chip-style tab bar component
- Renders TAB_CONFIG as chip buttons using Tailwind utility classes (no custom CSS classes)
- Selected: `bg-pixel-black text-card-bg border-pixel-black` + `box-shadow: 2px 2px 0` (stronger than in-module filter chips — intentional for navigation-level prominence)
- Unselected: `border-[#706858]/40 text-text-muted hover:border-text-main/60`
- Props: `activeTab: string`, `onTabChange: (key: string) => void`

### Modified Files

**`src/App.tsx`** — Main layout changes
- Add `activeTab` state (default: `'portfolio'`)
- Add `visitedTabs` set state to track which tabs have been rendered
- Place `<TabBar>` between AlertBanner divider and module content
- Replace flat module list with tab-group conditional rendering using explicit JSX per group:
  - If tab is active: render with `display:block`
  - If tab was visited but not active: render with `display:none`
  - If tab was never visited: don't render (lazy)
  - Each group has its own JSX block with direct prop passing (no string-based registry)
- AlertBanner stays outside tabs (always visible)
- Header and footer stay outside tabs (always visible)
- `selectedProject` filter indicator in header (lines 34-41) remains visible across all tabs
- `onTabChange` calls `window.scrollTo({ top: 0 })` to reset scroll position
- Pixel dividers (`<hr className="pixel-divider my-8" />`) between modules within each tab group, no divider after the last module

## Visual Spec

```
┌─────────────────────────────────────────┐
│  DEVBOARD ▮                             │
│  快照：2026-03-16 · 项目管理看板          │
├─────────────────────────────────────────┤
│  ⚠ AlertBanner                          │
├╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌┤
│  [▓PORTFOLIO] [DEVOPS] [ANALYTICS] [KNOWLEDGE]  │
├╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌┤
│  ┌─ PORTFOLIO GRID ──────────────────┐  │
│  │  ...                              │  │
│  └───────────────────────────────────┘  │
│  ╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌  │
│  ┌─ TIMELINE ────────────────────────┐  │
│  │  ...                              │  │
│  └───────────────────────────────────┘  │
│  ╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌  │
│  ┌─ PROJECT TASKS ───────────────────┐  │
│  │  ...                              │  │
│  └───────────────────────────────────┘  │
│  ╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌  │
│  ┌─ ROADMAP GANTT ───────────────────┐  │
│  │  ...                              │  │
│  └───────────────────────────────────┘  │
├─────────────────────────────────────────┤
│  DEVBOARD v0.7.0 · built with ...      │
└─────────────────────────────────────────┘
```

## Chip Button Styling (Tailwind inline)

All styling via Tailwind utility classes in TabBar.tsx — no custom CSS classes needed.

```tsx
// Active tab chip
className="px-3 py-1.5 font-pixel text-[7px] cursor-pointer transition-colors
  bg-pixel-black text-card-bg border-2 border-pixel-black"
style={{ boxShadow: '2px 2px 0 #2a2a2a' }}

// Inactive tab chip
className="px-3 py-1.5 font-pixel text-[7px] cursor-pointer transition-colors
  bg-transparent text-text-muted border-2 border-[#706858]/40
  hover:border-text-main/60"
```

**Note:** Tab chips use solid inverted fill (stronger) vs ConversationTimeline filter chips which use `bg-text-main/10` (lighter). This is intentional — navigation-level tabs need more visual weight than in-module filters.

## Props Flow

- `selectedProject` and `setSelectedProject` remain in App.tsx, passed to modules that need them regardless of tab
- `activeTab` and `visitedTabs` are new App-level state
- TabBar is a controlled component receiving `activeTab` + `onTabChange`
- `onTabChange` updates both `activeTab` and adds to `visitedTabs` set

## Verification

1. `pnpm build` passes with zero TSC errors
2. All 4 tabs render their correct modules
3. Switching tabs preserves module state (e.g., selected filters in ConversationTimeline)
4. First load only renders Portfolio tab modules
5. Tab order can be changed by reordering `TAB_CONFIG` in `tabs.ts`
6. `selectedProject` filter works correctly across tab switches
7. Tab switch scrolls viewport to top
8. Pixel dividers appear between modules within each tab, not after the last one
