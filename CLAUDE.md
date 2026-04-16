# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm run dev` — start Vite dev server with HMR
- `npm run build` — type-check (`tsc -b`) then produce a production build
- `npm run lint` — run ESLint across the repo
- `npm run preview` — serve the production build locally

There is no test suite configured.

## Architecture

This is a client-only, single-page Gantt chart app (Vite + React 19 + TypeScript + Tailwind). All state lives in the browser; there is no backend.

### Data model ([src/types/index.ts](src/types/index.ts))

Two domain entities:
- `Project` — id, `name`, `color` from a fixed preset palette ([src/lib/colors.ts](src/lib/colors.ts)), plus `createdAt`/`updatedAt` ISO timestamps.
- `AppTask` — belongs to a project, has `type: 'task' | 'milestone'`, ISO date strings for `start`/`end`, a `progress` (0–100), `dependencies` (other task ids in the same project), and a `displayOrder`.

Dates are stored as ISO `YYYY-MM-DD` strings and parsed as **local time** (`T00:00:00`) to avoid timezone drift — see [src/lib/dates.ts](src/lib/dates.ts) and [src/lib/ganttAdapter.ts](src/lib/ganttAdapter.ts).

Top-level UI state is also typed here: `ViewModeKey` (Day/Week/Month/Quarter/Year), `ThemeKey` (light/dark/system), `DisplayMode` (gantt/list), `AppView` (dashboard/project).

### State ([src/store/useAppStore.ts](src/store/useAppStore.ts))

A single Zustand store holds `projects`, `tasks`, `currentProjectId`, `viewMode`, `theme`, `displayMode`, `view`, `sidebarCollapsed`, `seedDismissed`, and `hydrated`. Key invariants enforced inside the store (not at the UI layer) — if you add task-mutating code, preserve these:

- **Milestone constraint**: `type === 'milestone'` forces `end = start` and `progress = 0` on both add and update.
- **Dependency integrity**: `addTask`/`updateTask` drop self-references and any dependency ids that don't belong to a sibling task in the same project; `deleteTask` also removes the deleted id from every other task's `dependencies`.
- **Project deletion cascade**: `deleteProject` removes all tasks in that project and reassigns `currentProjectId` to another project or `null`.
- **displayOrder**: new tasks get `max(existingOrders) + 1` for their project.
- **Progress clamp**: task progress is clamped to `[0, 100]` on add, update, and `bulkSetProgress`.

Bulk actions (`bulkSetProgress`, `bulkShiftTasks`, `bulkDeleteTasks`) and the `restoreProject` / `restoreTask` / `bulkRestoreTasks` actions exist to support undo flows — `bulkDeleteTasks` returns a snapshot (deleted tasks + affected dependents) that `bulkRestoreTasks` reapplies. Toasts ([src/store/useToastStore.ts](src/store/useToastStore.ts)) surface the undo affordance.

Seed detection: `detectSeeded` / `selectIsSeeded` recognize a first-run state based on a single project matching `SEED_MARKER_NAME`; `clearSeedData` wipes it and `dismissSeed` hides the banner.

### Persistence ([src/lib/storage.ts](src/lib/storage.ts))

State is persisted to `localStorage` under key `gantt-app:v1`:
- A store subscription writes through a 100ms debounced `saveState`; `beforeunload` flushes pending writes.
- `loadState` runs `isValidStoredState` shape validation before returning; invalid data is discarded and the app falls back to seed data from [src/lib/seed.ts](src/lib/seed.ts).
- Stored `version` accepts `1` or `2`; loaded state is normalized to `version: 2` (optional fields like `theme`, `displayMode`, `view`, `sidebarCollapsed`, `seedDismissed` may be absent on legacy v1 payloads and default in the store). Bump to `3` and write a migration if the shape changes again.
- `QuotaExceededError` is caught and logged; other write errors propagate.

The store is empty until `hydrate()` runs; `App.tsx` calls it on mount and renders a spinner until `hydrated === true`. Do not read persisted state before hydration.

### Gantt rendering ([src/components/gantt/GanttView.tsx](src/components/gantt/GanttView.tsx))

Wraps the third-party `gantt-task-react` library. [src/lib/ganttAdapter.ts](src/lib/ganttAdapter.ts) is the one-way mapping from `AppTask[]` → library `Task[]`, applying per-project color styling via `hexWithAlpha`. When the library fires `onDateChange` / `onProgressChange`, the handlers write back through `updateTask` — the store remains the source of truth.

`onDelete` returns `false` to keep the bar in the library's internal state while a `ConfirmDialog` decides whether to commit the delete via the store. `GanttView` exposes an imperative `jumpToToday` handle via `forwardRef`, consumed by `App.tsx` through `ganttRef`. Custom styling lives in [src/components/gantt/gantt-overrides.css](src/components/gantt/gantt-overrides.css) and the hover popover in [src/components/gantt/GanttTooltip.tsx](src/components/gantt/GanttTooltip.tsx).

### UI structure

- [src/App.tsx](src/App.tsx) — top-level layout (Sidebar + Header + main content) and a discriminated-union `ModalState` that controls which modal (if any) is open. Switches between `Dashboard`, `TaskListView`, and `GanttView` based on `view` / `displayMode`. Applies theme via `useApplyTheme` and syncs route/query state via `useUrlSync`.
- [src/components/layout/](src/components/layout/) — `Sidebar` (project list/switcher, collapsible, with mobile drawer) and `Header` (view mode, display mode toggle, add task/milestone, edit project, jump-to-today).
- [src/components/dashboard/](src/components/dashboard/) — project overview cards with aggregate metrics from [src/lib/metrics.ts](src/lib/metrics.ts).
- [src/components/list/](src/components/list/) — alternative tabular `TaskListView` with multi-select and bulk actions.
- [src/components/modals/](src/components/modals/) — `ProjectModal` and `TaskModal` in create/edit modes, both built on a shared `Modal` that uses [src/lib/useFocusTrap.ts](src/lib/useFocusTrap.ts).
- [src/components/common/](src/components/common/) — reusable primitives (`Button`, `IconButton`, `ColorSwatch`, `MultiSelect`, `ConfirmDialog`, `EmptyState`, `FieldError`, `Toaster`, `SampleDataBanner`).

Supporting libs:
- [src/lib/dependencies.ts](src/lib/dependencies.ts) — cycle detection / dependency graph helpers for the task modal.
- [src/lib/exportImport.ts](src/lib/exportImport.ts) — JSON export/import of full app state (feeds `replaceAll`).
- [src/lib/useTheme.ts](src/lib/useTheme.ts) — applies `light`/`dark`/`system` theme to the document root.
- [src/lib/useUrlSync.ts](src/lib/useUrlSync.ts) — two-way sync between URL (hash/search) and store (`view`, `currentProjectId`, `displayMode`).

Icons are served from a single sprite at [public/icons.svg](public/icons.svg).
