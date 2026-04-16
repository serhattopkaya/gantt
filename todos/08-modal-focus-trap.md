# 08 — Modal focus trap & restore

**Priority:** Medium
**Area:** Accessibility

## Problem
[src/components/modals/Modal.tsx](../src/components/modals/Modal.tsx) handles Escape and initial focus, but Tab can move focus out of the dialog into the page behind it. On close, focus does not return to the element that opened the modal.

## Proposal
- Implement a focus trap: on Tab from the last focusable element, move focus to the first; on Shift+Tab from the first, move to the last.
- Capture `document.activeElement` on open and call `.focus()` on it when the modal unmounts.
- Optional: extract to a `useFocusTrap(ref)` hook so it is reusable for `ConfirmDialog`.

## Files to touch
- [src/components/modals/Modal.tsx](../src/components/modals/Modal.tsx)
- [src/components/common/ConfirmDialog.tsx](../src/components/common/ConfirmDialog.tsx) — apply the same hook
- New: `src/lib/useFocusTrap.ts`

## Acceptance
- Tabbing past the last control wraps to the first; Shift+Tab from the first wraps to the last.
- Closing the modal returns focus to the originating button.
- No regression to Escape-to-close behavior.
