# 02 — Undo / toast feedback for destructive actions

**Priority:** High
**Area:** Feedback / safety

## Problem
Project and task deletes ([src/components/layout/Sidebar.tsx](../src/components/layout/Sidebar.tsx), [src/components/gantt/GanttView.tsx](../src/components/gantt/GanttView.tsx), [src/components/modals/TaskModal.tsx](../src/components/modals/TaskModal.tsx)) succeed silently. There is no confirmation feedback or recovery path. Project deletion cascades to all child tasks — losing one accidentally is catastrophic.

## Proposal
- Add a lightweight toast system (e.g. `sonner` or a small custom `<Toaster />`).
- After every mutation that removes data, fire a toast with an "Undo" action that restores the snapshot via the store.
- Snapshot strategy: capture `{ project, tasks }` before delete; on undo, re-add via the store.

## Files to touch
- New: `src/components/common/Toaster.tsx`
- [src/store/useAppStore.ts](../src/store/useAppStore.ts) — add `restoreProject`, `restoreTask` actions
- [src/components/layout/Sidebar.tsx](../src/components/layout/Sidebar.tsx)
- [src/components/gantt/GanttView.tsx](../src/components/gantt/GanttView.tsx)
- [src/components/modals/TaskModal.tsx](../src/components/modals/TaskModal.tsx)
- [src/App.tsx](../src/App.tsx) — mount `<Toaster />`

## Acceptance
- Deleting a task or project shows a toast with an "Undo" button.
- Clicking Undo within the toast lifetime restores the exact prior state, including dependencies and `displayOrder`.
- Toasts are accessible (`role="status"`, dismissable, keyboard reachable).
