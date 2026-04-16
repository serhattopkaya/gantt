# 19 — URL state for project & view mode

**Priority:** Low-Medium
**Area:** Navigation

## Problem
`currentProjectId` and `viewMode` live only in the Zustand store ([src/store/useAppStore.ts](../src/store/useAppStore.ts)). Refreshing or sharing a link drops the user back into the auto-selected first project.

## Proposal
- Sync `currentProjectId`, `viewMode`, and (later) `displayMode` to the URL via `URLSearchParams`.
- On mount: read URL → set store. On store change: replace history without adding entries (`history.replaceState`).
- Avoid pulling in a router; a 30-line `useUrlSync` hook is enough for this app.

## Files to touch
- New: `src/lib/useUrlSync.ts`
- [src/App.tsx](../src/App.tsx) — call the hook after hydration
- [src/store/useAppStore.ts](../src/store/useAppStore.ts) — already exposes setters

## Acceptance
- Reloading lands on the same project and view mode.
- Sharing a URL like `?project=abc&view=Week` opens that project in Week view.
- Browser back/forward buttons do not get cluttered with intermediate state.
