# 18 — List / table view

**Priority:** Low-Medium
**Area:** Alternative views

## Problem
The Gantt chart in [src/components/gantt/GanttView.tsx](../src/components/gantt/GanttView.tsx) is the only way to see tasks. Many users prefer a sortable, filterable table — especially for grooming, status meetings, or bulk edits.

## Proposal
- Add a view toggle in the header: `Timeline | List`.
- List view renders a sticky-header table: Name, Type, Start, End, Progress, Dependencies.
- Sortable columns; quick filter input; inline edit on click.
- Multi-select rows with bulk actions (delete, shift dates, change progress).

## Files to touch
- New: `src/components/list/TaskListView.tsx`
- [src/components/layout/Header.tsx](../src/components/layout/Header.tsx) — view toggle
- [src/store/useAppStore.ts](../src/store/useAppStore.ts) — `displayMode: 'gantt' | 'list'`, plus a bulk-update action
- [src/App.tsx](../src/App.tsx) — render the right view

## Acceptance
- Toggling between Timeline and List preserves scroll/selection state.
- Sorting and filtering work without re-fetching.
- Inline edits go through the same store actions as the modal (preserving milestone/dependency invariants).
- Bulk delete uses the same confirmation + undo flow.
