# 13 — Collapsible sidebar & responsive layout

**Priority:** Medium
**Area:** Responsive

## Problem
Sidebar width is fixed at `w-[280px]` in [src/components/layout/Sidebar.tsx](../src/components/layout/Sidebar.tsx). On narrow viewports the Gantt grid is unusable; on small laptops the sidebar wastes valuable horizontal space.

## Proposal
- Add a collapse toggle (chevron) at the top of the sidebar; persist state in the store and localStorage.
- Collapsed mode: 56px wide, icons only, project name in a tooltip.
- Below `md` breakpoint: render sidebar as an off-canvas drawer with a hamburger toggle in [src/components/layout/Header.tsx](../src/components/layout/Header.tsx).
- Make `Modal` `max-h-[90vh]` with internal scroll so it works on short viewports.

## Files to touch
- [src/components/layout/Sidebar.tsx](../src/components/layout/Sidebar.tsx)
- [src/components/layout/Header.tsx](../src/components/layout/Header.tsx)
- [src/App.tsx](../src/App.tsx)
- [src/store/useAppStore.ts](../src/store/useAppStore.ts) — add `sidebarCollapsed`
- [src/components/modals/Modal.tsx](../src/components/modals/Modal.tsx)

## Acceptance
- Sidebar can be collapsed and re-expanded; preference persists.
- Below 768px the sidebar is a drawer that overlays the chart.
- Modals never overflow the viewport on short screens.
