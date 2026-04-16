# 17 — Export / import

**Priority:** Low-Medium
**Area:** Data portability

## Problem
All data lives in `localStorage` under `gantt-app:v1` (see [src/lib/storage.ts](../src/lib/storage.ts)). There is no way to back up, share, or move data between browsers/devices.

## Proposal
- **Export JSON**: `Download all data` action that writes the current store to a `.json` file. Reuse the existing `isValidStoredState` shape.
- **Export CSV**: per-project `tasks.csv` (id, name, type, start, end, progress, dependencies).
- **Import JSON**: file picker → `isValidStoredState` validation → confirm overwrite → hydrate store.
- **Import CSV**: optional, lower priority.

## Files to touch
- New: `src/lib/exportImport.ts`
- New: menu in [src/components/layout/Header.tsx](../src/components/layout/Header.tsx) or a settings modal
- [src/store/useAppStore.ts](../src/store/useAppStore.ts) — add `replaceAll(state)` action
- [src/lib/storage.ts](../src/lib/storage.ts) — reuse validator

## Acceptance
- Export downloads a valid JSON file that can be re-imported losslessly.
- Import rejects malformed files with a clear error.
- CSV per-project export opens in Excel/Numbers without column drift.
