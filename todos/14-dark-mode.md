# 14 — Dark mode

**Priority:** Medium
**Area:** Theming

## Problem
[tailwind.config.js](../tailwind.config.js) has no `darkMode` configuration, and components hardcode `bg-white`, `text-slate-900`, etc. There is no theme toggle.

## Proposal
- Set `darkMode: 'class'` in `tailwind.config.js`.
- Add semantic tokens (e.g. `bg-surface`, `text-primary`) via CSS variables in [src/index.css](../src/index.css), with `:root` and `.dark` blocks.
- Replace hardcoded colors across components with the tokens.
- Add a theme toggle (sun/moon) in the header; persist to localStorage and respect `prefers-color-scheme` on first load.
- Update [src/components/gantt/GanttView.tsx](../src/components/gantt/GanttView.tsx) chart colors (`barBackgroundColor`, `todayColor`, etc.) for dark mode.

## Files to touch
- [tailwind.config.js](../tailwind.config.js)
- [src/index.css](../src/index.css)
- [src/components/layout/Header.tsx](../src/components/layout/Header.tsx)
- [src/store/useAppStore.ts](../src/store/useAppStore.ts) — add `theme: 'light' | 'dark' | 'system'`
- All components using slate/white literals

## Acceptance
- Theme toggle switches the entire UI including the Gantt chart.
- Preference persists across reloads and respects system default initially.
- WCAG AA contrast verified in both modes.
