# 15 — Empty-state & first-run guidance

**Priority:** Low-Medium
**Area:** Onboarding

## Problem
First-run users land in seeded sample data ([src/lib/seed.ts](../src/lib/seed.ts)) with no indication it is sample content. Empty states in [src/components/common/EmptyState.tsx](../src/components/common/EmptyState.tsx) cover "no project" and "no tasks" but not deeper edge cases.

## Proposal
- Add a dismissable banner above the Gantt: *"You're viewing sample data — create a project to start fresh."* with a "Clear sample data" action. Persist the dismissal in localStorage.
- Add a `first-run` flag to the store; show the banner only when seeded data is detected and not yet dismissed.
- Add an `EmptyState` variant for "all tasks complete" (celebrate) and "no dependencies graph yet".

## Files to touch
- [src/components/common/EmptyState.tsx](../src/components/common/EmptyState.tsx)
- New: `src/components/common/SampleDataBanner.tsx`
- [src/App.tsx](../src/App.tsx)
- [src/store/useAppStore.ts](../src/store/useAppStore.ts) — track `seedDismissed`

## Acceptance
- Banner appears only on first visit with seed data; dismissal sticks.
- "Clear sample data" wipes seed and leaves the user on an empty-project state.
- New empty-state variants render with consistent styling.
