# 03 — Dependency-impact preview before delete

**Priority:** High
**Area:** Confirmation dialogs

## Problem
Deleting a task silently strips it from every other task's `dependencies` array (see `deleteTask` in [src/store/useAppStore.ts](../src/store/useAppStore.ts)). The user has no way to see how many downstream tasks will be affected before confirming.

## Proposal
- Before opening `ConfirmDialog`, compute `dependents = tasks.filter(t => t.dependencies.includes(targetId))`.
- Render the count and a short list (first 3 names + "…and N more") in the dialog body.
- For project deletes, surface child task count and milestone count.

## Files to touch
- [src/components/common/ConfirmDialog.tsx](../src/components/common/ConfirmDialog.tsx) — accept richer body content
- [src/components/gantt/GanttView.tsx](../src/components/gantt/GanttView.tsx) — pass dependents
- [src/components/modals/TaskModal.tsx](../src/components/modals/TaskModal.tsx) — pass dependents
- [src/components/layout/Sidebar.tsx](../src/components/layout/Sidebar.tsx) — pass child counts for project delete

## Acceptance
- Delete confirmations show "N tasks depend on this" with the affected names.
- Project delete confirmations show task and milestone counts.
- Empty case ("No other tasks depend on this") still renders cleanly.
