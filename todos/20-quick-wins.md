# 20 — Quick wins bundle

**Priority:** Low
**Area:** Polish (each item ~30 min)

A grab bag of small improvements. Pick off opportunistically.

## Items
- **Task counts in sidebar** — show `(N)` after each project name in [src/components/layout/Sidebar.tsx](../src/components/layout/Sidebar.tsx). The count is already computed (`taskCounts`).
- **First-hover affordance on Gantt bars** — show a one-time tooltip *"Drag to reschedule, drag the right edge to extend"* in [src/components/gantt/GanttView.tsx](../src/components/gantt/GanttView.tsx).
- **Colored left border for active project** — replace/augment the dot in [src/components/layout/Sidebar.tsx](../src/components/layout/Sidebar.tsx) with a 2px left border in the project's color.
- **Keyboard hint in primary CTA** — append `⌘N` (or `N`) inside the "Task" button label in [src/components/layout/Header.tsx](../src/components/layout/Header.tsx) once shortcuts ship.
- **`prefers-reduced-motion`** — wrap the spinner in [src/App.tsx](../src/App.tsx) and modal transitions in [src/components/modals/Modal.tsx](../src/components/modals/Modal.tsx) so they degrade gracefully.
- **Truncated project name tooltip** — when a project name truncates in the header, set `title={currentProject.name}` so users can hover for the full text.
- **Loading skeleton instead of full-page spinner** — render a sidebar + header skeleton during hydration in [src/App.tsx](../src/App.tsx) so the layout doesn't flash.
- **`aria-current="page"` on the active sidebar project** — small but correct.

## Acceptance
Each item is independently shippable; merging them all should produce no visual regressions.
