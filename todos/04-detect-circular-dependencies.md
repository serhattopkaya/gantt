# 04 — Detect circular dependencies

**Priority:** High
**Area:** Data integrity

## Problem
The MultiSelect in [src/components/modals/TaskModal.tsx](../src/components/modals/TaskModal.tsx) lets users build cycles like A → B → A. There is no validation, and the Gantt library has no defense against the resulting infinite scheduling logic.

## Proposal
- On TaskModal save, run a DFS from the candidate task's id over `tasks` to detect whether any selected dependency would close a cycle.
- Block submission with an inline error: *"Selecting 'B' would create a circular dependency (A → B → A)."*
- Add a pure helper `hasCycle(taskId, deps, allTasks): string[] | null` returning the offending path.

## Files to touch
- New: `src/lib/dependencies.ts` (the helper, easy to unit test later)
- [src/components/modals/TaskModal.tsx](../src/components/modals/TaskModal.tsx)
- Optional: [src/store/useAppStore.ts](../src/store/useAppStore.ts) — guard at the store layer too

## Acceptance
- Saving a task whose dependencies form a cycle is blocked with a clear error message naming the path.
- Self-references are still stripped (existing behavior preserved).
- Helper handles disconnected graphs and missing ids without throwing.
