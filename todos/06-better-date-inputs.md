# 06 — Better date inputs

**Priority:** Medium
**Area:** Forms

## Problem
Date inputs in [src/components/modals/TaskModal.tsx](../src/components/modals/TaskModal.tsx) are bare `<input type="date">` controls. There is no quick-set affordance, no duration display, and the end-date field disappears abruptly when toggling milestone vs task.

## Proposal
- Add quick-set chips next to each date: `Today`, `+1 day`, `+1 week`, `+1 month`.
- Below the end-date field, show derived duration: e.g. *"5 working days (Mon → Fri)"*.
- Animate the show/hide of the end-date field when toggling type, instead of an abrupt remount.
- Keep the `min={start}` constraint and add a friendly inline error if the browser lets it through.

## Files to touch
- [src/components/modals/TaskModal.tsx](../src/components/modals/TaskModal.tsx)
- [src/lib/dates.ts](../src/lib/dates.ts) — add `workingDaysBetween` helper

## Acceptance
- Clicking a quick-set chip writes a valid ISO date into the field.
- Duration text updates live as either date changes.
- Toggling milestone ↔ task transitions smoothly (CSS height/opacity).
