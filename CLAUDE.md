# DevBoard

Project management visualization dashboard with pixel-art aesthetic.

## Tech Stack
- Vite 6 + React 19 + TypeScript
- Tailwind CSS 4 (PostCSS plugin)
- Recharts (charts, Phase 2+)
- Fonts: Press Start 2P (headings) + JetBrains Mono (body)

## Commands
- `npm run dev` — dev server (localhost:5173)
- `npm run build` — production build
- `npm run preview` — preview production build

## Architecture
- `src/data/` — static JSON data (copied from `~/.claude/data/`)
- `src/hooks/` — data hooks (static JSON now, Supabase later)
- `src/components/` — feature components
- `src/components/ui/` — pixel-art atomic components
- `src/types.ts` — shared TypeScript interfaces

## Conventions
- Pixel-art visual style consistent with cyber-landing
- Color tokens defined in `index.css` `@theme` block
- Use `.pixel-border`, `.pixel-hover`, `.pixel-divider` utility classes
- Font classes: `font-pixel` (Press Start 2P), `font-mono` (JetBrains Mono)
