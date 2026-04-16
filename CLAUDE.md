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
- `Project` — has an id, name, and a `color` chosen from a fixed preset palette ([src/lib/colors.ts](src/lib/colors.ts)).
- `AppTask` — belongs to a project, has `type: 'task' | 'milestone'`, ISO date strings for `start`/`end`, a `progress` (0–100), `dependencies` (other task ids in the same project), and a `displayOrder`.

Dates are stored as ISO `YYYY-MM-DD` strings and parsed as **local time** (`T00:00:00`) to avoid timezone drift — see [src/lib/dates.ts](src/lib/dates.ts) and [src/lib/ganttAdapter.ts](src/lib/ganttAdapter.ts).

### State ([src/store/useAppStore.ts](src/store/useAppStore.ts))

A single Zustand store holds `projects`, `tasks`, `currentProjectId`, `viewMode`, and `hydrated`. Key invariants enforced inside the store (not at the UI layer) — if you add task-mutating code, preserve these:

- **Milestone constraint**: `type === 'milestone'` forces `end = start` and `progress = 0` on both add and update.
- **Dependency integrity**: `deleteTask` also removes the deleted id from every other task's `dependencies`; `updateTask` strips self-references.
- **Project deletion cascade**: `deleteProject` removes all tasks in that project and reassigns `currentProjectId` to another project or `null`.
- **displayOrder**: new tasks get `max(existingOrders) + 1` for their project.

### Persistence ([src/lib/storage.ts](src/lib/storage.ts))

State is persisted to `localStorage` under key `gantt-app:v1`:
- A store subscription writes through a 100ms debounced `saveState`; `beforeunload` flushes pending writes.
- `loadState` runs `isValidStoredState` shape validation before returning; invalid data is discarded and the app falls back to seed data from [src/lib/seed.ts](src/lib/seed.ts).
- The `version: 1` field is the migration hook — bump it and write a migration if the stored shape changes.

The store is empty until `hydrate()` runs; `App.tsx` calls it on mount and renders a spinner until `hydrated === true`. Do not read persisted state before hydration.

### Gantt rendering ([src/components/gantt/GanttView.tsx](src/components/gantt/GanttView.tsx))

Wraps the third-party `gantt-task-react` library. [src/lib/ganttAdapter.ts](src/lib/ganttAdapter.ts) is the one-way mapping from `AppTask[]` → library `Task[]`, applying per-project color styling via `hexWithAlpha`. When the library fires `onDateChange` / `onProgressChange`, the handlers write back through `updateTask` — the store remains the source of truth.

`onDelete` returns `false` to keep the bar in the library's internal state while a `ConfirmDialog` decides whether to commit the delete via the store.

### UI structure

- [src/App.tsx](src/App.tsx) — top-level layout (Sidebar + Header + GanttView) and a discriminated-union `ModalState` that controls which modal (if any) is open.
- [src/components/layout/](src/components/layout/) — `Sidebar` (project list/switcher) and `Header` (view mode + add task/milestone + edit project).
- [src/components/modals/](src/components/modals/) — `ProjectModal` and `TaskModal` in create/edit modes, both built on a shared `Modal`.
- [src/components/common/](src/components/common/) — reusable primitives (`Button`, `IconButton`, `ColorSwatch`, `MultiSelect`, `ConfirmDialog`, `EmptyState`).

Icons are served from a single sprite at [public/icons.svg](public/icons.svg).
