# 09 — Don't rely on color alone

**Priority:** Medium
**Area:** Accessibility

## Problem
Project identity is communicated through a single colored dot in [src/components/layout/Sidebar.tsx](../src/components/layout/Sidebar.tsx) and [src/components/layout/Header.tsx](../src/components/layout/Header.tsx). Task type is conveyed only via color in tooltips. Colorblind users cannot distinguish projects or task types.

## Proposal
- Add the project's first letter (initial) inside the swatch on a contrasting fill.
- Use a `Flag` icon for milestones and a bar shape for tasks in tooltips and the task list (already imported from `lucide-react`).
- Pair color with shape on the Gantt bars themselves (e.g. dashed outline for milestones).

## Files to touch
- [src/components/common/ColorSwatch.tsx](../src/components/common/ColorSwatch.tsx)
- [src/components/layout/Sidebar.tsx](../src/components/layout/Sidebar.tsx)
- [src/components/layout/Header.tsx](../src/components/layout/Header.tsx)
- [src/components/gantt/GanttTooltip.tsx](../src/components/gantt/GanttTooltip.tsx)
- [src/lib/ganttAdapter.ts](../src/lib/ganttAdapter.ts) — apply per-type style hints

## Acceptance
- Sidebar and header show the project initial inside the swatch.
- Milestones are visually distinct from tasks regardless of color.
- WCAG AA contrast verified for swatch text.
