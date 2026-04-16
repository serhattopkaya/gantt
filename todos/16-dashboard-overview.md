# 16 — Dashboard / overview view

**Priority:** Low-Medium
**Area:** Information architecture

## Problem
The app drops the user straight into one project's Gantt chart. There is no cross-project overview: total tasks, completion %, upcoming milestones, late tasks, etc.

## Proposal
- Add a top-level "Overview" entry in the sidebar above the project list.
- Render a dashboard view with cards: total projects, total tasks, % complete, milestones in next 14 days, tasks past due.
- Each card links/scrolls to the relevant project & task.

## Files to touch
- New: `src/components/dashboard/Dashboard.tsx`
- New: `src/lib/metrics.ts` — pure functions over `tasks` and `projects`
- [src/components/layout/Sidebar.tsx](../src/components/layout/Sidebar.tsx)
- [src/App.tsx](../src/App.tsx) — route between dashboard / project view
- [src/store/useAppStore.ts](../src/store/useAppStore.ts) — `view: 'dashboard' | 'project'`

## Acceptance
- Selecting "Overview" shows aggregate metrics across all projects.
- Each metric reflects current store state in real time.
- Clicking a card jumps to the relevant project / scrolls to the task.
